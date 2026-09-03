<?php

namespace App\Support;

use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\PurchaseOrder;
use App\Models\SaleOrder;
use App\Models\SaleReturn;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class ProductStock
{
    /**
     * @return LengthAwarePaginator<int, array{id: int, name: string, purchased: string, sold: string, returned: string, on_hand: string, batch_count: int}>
     */
    public static function summaries(): LengthAwarePaginator
    {
        $productsTable = (new Product)->getTable();
        $batchesTable = (new ProductBatch)->getTable();

        $batchTotals = ProductBatch::query()
            ->select('product_id')
            ->selectRaw('COALESCE(SUM(quantity_on_hand), 0) as on_hand')
            ->selectRaw('COUNT(*) as batch_count')
            ->groupBy('product_id');

        $movementTotals = StockMovement::query()
            ->select('product_id')
            ->selectRaw('SUM(CASE WHEN type = ? THEN quantity ELSE 0 END) as purchased', [StockMovementType::Purchase->value])
            ->selectRaw('SUM(CASE WHEN type = ? THEN quantity ELSE 0 END) as sold', [StockMovementType::Sale->value])
            ->selectRaw('SUM(CASE WHEN type = ? THEN quantity ELSE 0 END) as returned', [StockMovementType::SaleReturn->value])
            ->groupBy('product_id');

        return Product::query()
            ->select([
                "{$productsTable}.id",
                "{$productsTable}.name",
                DB::raw('COALESCE(movement_totals.purchased, 0) as purchased'),
                DB::raw('COALESCE(movement_totals.sold, 0) as sold'),
                DB::raw('COALESCE(movement_totals.returned, 0) as returned'),
                DB::raw('COALESCE(batch_totals.on_hand, 0) as on_hand'),
                DB::raw('COALESCE(batch_totals.batch_count, 0) as batch_count'),
            ])
            ->leftJoinSub($movementTotals, 'movement_totals', 'movement_totals.product_id', '=', "{$productsTable}.id")
            ->leftJoinSub($batchTotals, 'batch_totals', 'batch_totals.product_id', '=', "{$productsTable}.id")
            ->orderBy("{$productsTable}.name")
            ->paginate(10)
            ->withQueryString()
            ->through(function (Product $product): array {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'purchased' => bcadd((string) $product->getAttribute('purchased'), '0', 2),
                    'sold' => bcadd((string) $product->getAttribute('sold'), '0', 2),
                    'returned' => bcadd((string) $product->getAttribute('returned'), '0', 2),
                    'on_hand' => bcadd((string) $product->getAttribute('on_hand'), '0', 2),
                    'batch_count' => (int) $product->getAttribute('batch_count'),
                ];
            });
    }

    /**
     * @return array<int, string>
     */
    public static function onHandByProductId(?Model $excludeStockable = null): array
    {
        return ProductBatch::query()
            ->select('product_id')
            ->selectRaw('COALESCE(SUM(quantity_on_hand), 0) as on_hand')
            ->groupBy('product_id')
            ->get()
            ->mapWithKeys(fn (ProductBatch $row): array => [
                (int) $row->product_id => bcadd((string) $row->getAttribute('on_hand'), '0', 2),
            ])
            ->all();
    }

    /**
     * @param  Collection<int, Product>  $products
     * @return Collection<int, Product>
     */
    public static function withOnHand(Collection $products, ?Model $excludeStockable = null): Collection
    {
        $onHand = self::onHandByProductId($excludeStockable);

        if ($excludeStockable instanceof SaleOrder) {
            $excludeStockable->loadMissing('items.batchAllocations');

            foreach ($excludeStockable->items as $item) {
                $productId = $item->product_id;
                $current = $onHand[$productId] ?? '0.00';

                foreach ($item->batchAllocations as $allocation) {
                    $current = bcadd($current, bcadd((string) $allocation->quantity, '0', 2), 2);
                }

                $onHand[$productId] = $current;
            }
        }

        return $products->each(function (Product $product) use ($onHand): void {
            $product->setAttribute('on_hand', $onHand[$product->id] ?? '0.00');
        });
    }

    /**
     * @return list<array{
     *     id: int,
     *     batch_no: string,
     *     quantity_on_hand: string,
     *     purchased_at: string,
     *     purchase_history: list<array{
     *         purchase_order_id: int,
     *         number: string,
     *         party_name: string,
     *         date: string,
     *         quantity: string
     *     }>
     * }>
     */
    public static function batchesFor(Product $product): array
    {
        return ProductBatchBook::batchesForProduct($product)
            ->map(fn (ProductBatch $batch): array => [
                'id' => $batch->id,
                'batch_no' => $batch->batch_no,
                'quantity_on_hand' => bcadd((string) $batch->quantity_on_hand, '0', 2),
                'purchased_at' => $batch->purchased_at->toDateString(),
                'purchase_history' => ProductBatchBook::purchaseHistoryForBatch($batch),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, date: string, type: string, number: string, batch_no: string|null, quantity_in: string, quantity_out: string, balance: string}>
     */
    public static function history(Product $product): array
    {
        $movements = StockMovement::query()
            ->where('product_id', $product->id)
            ->with(['stockable', 'productBatch:id,batch_no'])
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        $balance = '0.00';
        $rows = [];

        foreach ($movements as $movement) {
            $quantity = bcadd((string) $movement->quantity, '0', 2);
            $isInbound = $movement->type === StockMovementType::Purchase
                || $movement->type === StockMovementType::SaleReturn;

            if ($isInbound) {
                $balance = bcadd($balance, $quantity, 2);
                $quantityIn = $quantity;
                $quantityOut = '0.00';
            } else {
                $balance = bcsub($balance, $quantity, 2);
                $quantityIn = '0.00';
                $quantityOut = $quantity;
            }

            $stockable = $movement->stockable;
            $number = $stockable instanceof PurchaseOrder
                || $stockable instanceof SaleOrder
                || $stockable instanceof SaleReturn
                ? $stockable->number
                : '—';

            $rows[] = [
                'id' => $movement->id,
                'date' => $movement->date->toDateString(),
                'type' => $movement->type->name,
                'number' => $number,
                'batch_no' => $movement->productBatch?->batch_no,
                'quantity_in' => $quantityIn,
                'quantity_out' => $quantityOut,
                'balance' => $balance,
            ];
        }

        return $rows;
    }
}
