<?php

namespace App\Support;

use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\SaleOrder;
use App\Models\SaleOrderItemBatch;
use App\Models\SaleReturn;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

final class ProductBatchBook
{
    /**
     * @return list<array{product_batch_id: int, batch_no: string, quantity_on_hand: string}>
     */
    public static function availableForProduct(int $productId, ?SaleOrder $excludeSale = null): array
    {
        return ProductBatch::query()
            ->where('product_id', $productId)
            ->where('quantity_on_hand', '>', 0)
            ->orderBy('purchased_at')
            ->orderBy('id')
            ->get(['id', 'batch_no', 'quantity_on_hand'])
            ->map(function (ProductBatch $batch) use ($excludeSale): array {
                $available = bcadd((string) $batch->quantity_on_hand, '0', 2);

                if ($excludeSale instanceof SaleOrder) {
                    $existing = SaleOrderItemBatch::query()
                        ->where('product_batch_id', $batch->id)
                        ->whereHas('saleOrderItem', fn ($q) => $q->where('sale_id', $excludeSale->id))
                        ->sum('quantity');

                    $available = bcadd($available, bcadd((string) $existing, '0', 2), 2);
                }

                if (bccomp($available, '0', 2) !== 1) {
                    return null;
                }

                return [
                    'product_batch_id' => $batch->id,
                    'batch_no' => $batch->batch_no,
                    'quantity_on_hand' => $available,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return list<array{product_batch_id: int, batch_no: string, quantity: string}>
     */
    public static function fifoSuggest(int $productId, string $quantity, ?SaleOrder $exclude = null): array
    {
        $remaining = bcadd($quantity, '0', 2);
        $suggestions = [];

        foreach (self::availableForProduct($productId, $exclude) as $batch) {
            if (bccomp($remaining, '0', 2) !== 1) {
                break;
            }

            $available = $batch['quantity_on_hand'];

            if ($exclude instanceof SaleOrder) {
                $existing = SaleOrderItemBatch::query()
                    ->where('product_batch_id', $batch['product_batch_id'])
                    ->whereHas('saleOrderItem', fn ($q) => $q->where('sale_id', $exclude->id))
                    ->sum('quantity');

                $available = bcadd($available, bcadd((string) $existing, '0', 2), 2);
            }

            if (bccomp($available, '0', 2) !== 1) {
                continue;
            }

            $pick = bccomp($available, $remaining, 2) >= 0 ? $remaining : $available;

            $suggestions[] = [
                'product_batch_id' => $batch['product_batch_id'],
                'batch_no' => $batch['batch_no'],
                'quantity' => $pick,
            ];

            $remaining = bcsub($remaining, $pick, 2);
        }

        return $suggestions;
    }

    public static function receiveFromPurchase(PurchaseOrder $purchaseOrder): void
    {
        $purchaseOrder->loadMissing('items');

        foreach ($purchaseOrder->items as $item) {
            self::mergeBatch(
                $item->product_id,
                $item->batch_no,
                bcadd((string) $item->quantity, '0', 2),
                $purchaseOrder->date->toDateString(),
            );
        }
    }

    public static function revertPurchase(PurchaseOrder $purchaseOrder): void
    {
        $purchaseOrder->loadMissing('items');

        foreach ($purchaseOrder->items as $item) {
            self::subtractBatch(
                $item->product_id,
                $item->batch_no,
                bcadd((string) $item->quantity, '0', 2),
            );
        }
    }

    /**
     * @param  list<array{
     *     product_id: int,
     *     quantity: mixed,
     *     batches: list<array{product_batch_id: int, quantity: mixed}>
     * }>  $items
     */
    public static function validateSaleAllocations(array $items, ?SaleOrder $exclude = null): void
    {
        foreach ($items as $index => $item) {
            $lineQty = bcadd((string) $item['quantity'], '0', 2);
            $allocated = '0.00';
            $seenBatches = [];

            foreach ($item['batches'] as $batchIndex => $allocation) {
                $batchId = (int) $allocation['product_batch_id'];

                if (isset($seenBatches[$batchId])) {
                    throw ValidationException::withMessages([
                        "items.{$index}.batches.{$batchIndex}.product_batch_id" => __('Duplicate batch on this line.'),
                    ]);
                }

                $seenBatches[$batchId] = true;
                $qty = bcadd((string) $allocation['quantity'], '0', 2);

                if (bccomp($qty, '0', 2) !== 1) {
                    throw ValidationException::withMessages([
                        "items.{$index}.batches.{$batchIndex}.quantity" => __('Quantity must be greater than zero.'),
                    ]);
                }

                $batch = ProductBatch::query()->find($batchId);

                if ($batch === null || (int) $batch->product_id !== (int) $item['product_id']) {
                    throw ValidationException::withMessages([
                        "items.{$index}.batches.{$batchIndex}.product_batch_id" => __('Invalid batch for this product.'),
                    ]);
                }

                $available = bcadd((string) $batch->quantity_on_hand, '0', 2);

                if ($exclude instanceof SaleOrder) {
                    $existing = SaleOrderItemBatch::query()
                        ->where('product_batch_id', $batch->id)
                        ->whereHas('saleOrderItem', fn ($q) => $q->where('sale_id', $exclude->id))
                        ->sum('quantity');

                    $available = bcadd($available, bcadd((string) $existing, '0', 2), 2);
                }

                if (bccomp($qty, $available, 2) === 1) {
                    throw ValidationException::withMessages([
                        "items.{$index}.batches.{$batchIndex}.quantity" => __('Not enough stock in batch :batch.', ['batch' => $batch->batch_no]),
                    ]);
                }

                $allocated = bcadd($allocated, $qty, 2);
            }

            if (bccomp($allocated, $lineQty, 2) !== 0) {
                throw ValidationException::withMessages([
                    "items.{$index}.batches" => __('Allocated quantity must match line quantity.'),
                ]);
            }
        }
    }

    /**
     * @param  list<array{
     *     product_id: int,
     *     quantity: mixed,
     *     batches: list<array{product_batch_id: int, quantity: mixed}>
     * }>  $items
     */
    public static function applySaleAllocations(SaleOrder $saleOrder, array $items): void
    {
        $saleOrder->loadMissing('items');

        foreach ($saleOrder->items as $index => $saleItem) {
            $allocations = $items[$index]['batches'] ?? [];

            foreach ($allocations as $allocation) {
                $batch = ProductBatch::query()->findOrFail($allocation['product_batch_id']);
                $qty = bcadd((string) $allocation['quantity'], '0', 2);

                SaleOrderItemBatch::query()->create([
                    'sale_order_item_id' => $saleItem->id,
                    'product_batch_id' => $batch->id,
                    'quantity' => $qty,
                ]);

                $batch->update([
                    'quantity_on_hand' => bcsub(
                        bcadd((string) $batch->quantity_on_hand, '0', 2),
                        $qty,
                        2,
                    ),
                ]);
            }
        }
    }

    public static function revertSale(SaleOrder $saleOrder): void
    {
        $saleOrder->loadMissing(['items.batchAllocations']);

        foreach ($saleOrder->items as $item) {
            foreach ($item->batchAllocations as $allocation) {
                $batch = $allocation->productBatch;
                $batch->update([
                    'quantity_on_hand' => bcadd(
                        bcadd((string) $batch->quantity_on_hand, '0', 2),
                        bcadd((string) $allocation->quantity, '0', 2),
                        2,
                    ),
                ]);
            }

            $item->batchAllocations()->delete();
        }
    }

    public static function restoreFromSaleReturn(SaleReturn $saleReturn): void
    {
        $saleReturn->loadMissing(['items.saleOrderItem.batchAllocations']);

        foreach ($saleReturn->items as $returnItem) {
            $saleItem = $returnItem->saleOrderItem;
            $returnQty = bcadd((string) $returnItem->quantity, '0', 2);
            $soldQty = bcadd((string) $saleItem->quantity, '0', 2);

            foreach ($saleItem->batchAllocations as $allocation) {
                $share = bcdiv(
                    bcmul($returnQty, bcadd((string) $allocation->quantity, '0', 2), 4),
                    $soldQty,
                    2,
                );

                if (bccomp($share, '0', 2) !== 1) {
                    continue;
                }

                $batch = $allocation->productBatch;
                $batch->update([
                    'quantity_on_hand' => bcadd(
                        bcadd((string) $batch->quantity_on_hand, '0', 2),
                        $share,
                        2,
                    ),
                ]);
            }
        }
    }

    public static function revertSaleReturn(SaleReturn $saleReturn): void
    {
        $saleReturn->loadMissing(['items.saleOrderItem.batchAllocations']);

        foreach ($saleReturn->items as $returnItem) {
            $saleItem = $returnItem->saleOrderItem;
            $returnQty = bcadd((string) $returnItem->quantity, '0', 2);
            $soldQty = bcadd((string) $saleItem->quantity, '0', 2);

            foreach ($saleItem->batchAllocations as $allocation) {
                $share = bcdiv(
                    bcmul($returnQty, bcadd((string) $allocation->quantity, '0', 2), 4),
                    $soldQty,
                    2,
                );

                if (bccomp($share, '0', 2) !== 1) {
                    continue;
                }

                $batch = $allocation->productBatch;
                $batch->update([
                    'quantity_on_hand' => bcsub(
                        bcadd((string) $batch->quantity_on_hand, '0', 2),
                        $share,
                        2,
                    ),
                ]);
            }
        }
    }

    /**
     * @return list<array{
     *     purchase_order_id: int,
     *     number: string,
     *     party_name: string,
     *     date: string,
     *     quantity: string
     * }>
     */
    public static function purchaseHistoryForBatch(ProductBatch $batch): array
    {
        return PurchaseOrderItem::query()
            ->tap(fn ($query) => BatchNo::scopePurchaseItemsForBatch(
                $query,
                $batch->product_id,
                $batch->batch_no,
            ))
            ->with(['purchaseOrder.party:id,name'])
            ->get()
            ->map(function (PurchaseOrderItem $item): array {
                $order = $item->purchaseOrder;

                return [
                    'purchase_order_id' => $order->id,
                    'number' => $order->number,
                    'party_name' => $order->party?->name ?? '—',
                    'date' => $order->date->toDateString(),
                    'quantity' => bcadd((string) $item->quantity, '0', 2),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    public static function partiesForBatch(ProductBatch $batch): array
    {
        return PurchaseOrderItem::query()
            ->tap(fn ($query) => BatchNo::scopePurchaseItemsForBatch(
                $query,
                $batch->product_id,
                $batch->batch_no,
            ))
            ->whereHas('purchaseOrder.party')
            ->with('purchaseOrder.party:id,name')
            ->get()
            ->map(fn (PurchaseOrderItem $item): string => $item->purchaseOrder->party->name)
            ->unique()
            ->values()
            ->all();
    }

    private static function mergeBatch(int $productId, string $batchNo, string $quantity, string $purchasedAt): ProductBatch
    {
        $batchNo = BatchNo::normalize($batchNo);
        $batch = BatchNo::findForProduct($productId, $batchNo);

        if ($batch === null) {
            return ProductBatch::query()->create([
                'product_id' => $productId,
                'batch_no' => $batchNo,
                'quantity_on_hand' => $quantity,
                'purchased_at' => $purchasedAt,
            ]);
        }

        $updates = [
            'quantity_on_hand' => bcadd(
                bcadd((string) $batch->quantity_on_hand, '0', 2),
                $quantity,
                2,
            ),
        ];

        if ($batch->batch_no !== $batchNo) {
            $updates['batch_no'] = $batchNo;
        }

        $batch->update($updates);

        return $batch;
    }

    private static function subtractBatch(int $productId, string $batchNo, string $quantity): void
    {
        $batch = BatchNo::findForProduct($productId, $batchNo);

        if ($batch === null) {
            return;
        }

        $newQty = bcsub(
            bcadd((string) $batch->quantity_on_hand, '0', 2),
            $quantity,
            2,
        );

        if (bccomp($newQty, '0', 2) === -1) {
            throw ValidationException::withMessages([
                'items' => __('Cannot change purchase because batch :batch no longer has enough stock.', ['batch' => $batchNo]),
            ]);
        }

        $batch->update(['quantity_on_hand' => $newQty]);
    }

    /**
     * @return Collection<int, ProductBatch>
     */
    public static function batchesForProduct(Product $product): Collection
    {
        return ProductBatch::query()
            ->where('product_id', $product->id)
            ->where('quantity_on_hand', '>', 0)
            ->orderBy('purchased_at')
            ->orderBy('batch_no')
            ->get();
    }
}
