<?php

namespace App\Reports;

use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\PurchaseOrderItem;
use App\Support\BatchNo;
use App\Support\ProductBatchBook;
use Illuminate\Database\Eloquent\Builder;

final class StockBatchReport
{
    /**
     * @return array{
     *     rows: list<array{
     *         id: int,
     *         product_id: int,
     *         product_name: string,
     *         batch_no: string,
     *         quantity_on_hand: string,
     *         parties: string
     *     }>
     * }
     */
    public static function for(?int $productId = null, ?int $partyId = null): array
    {
        $batchKeys = null;

        if ($partyId !== null) {
            $batchKeys = PurchaseOrderItem::query()
                ->whereHas('purchaseOrder', fn (Builder $query) => $query->where('party_id', $partyId))
                ->get(['product_id', 'batch_no'])
                ->unique(fn (PurchaseOrderItem $item): string => $item->product_id.'|'.BatchNo::normalize($item->batch_no))
                ->values();
        }

        $query = ProductBatch::query()
            ->with('product:id,name')
            ->where('quantity_on_hand', '>', 0)
            ->when($productId !== null, function (Builder $query) use ($productId): void {
                $query->where('product_id', $productId);
            })
            ->when($batchKeys !== null, function (Builder $query) use ($batchKeys): void {
                $query->where(function (Builder $query) use ($batchKeys): void {
                    foreach ($batchKeys as $item) {
                        $query->orWhere(function (Builder $query) use ($item): void {
                            BatchNo::scopeProductBatch(
                                $query,
                                $item->product_id,
                                $item->batch_no,
                            );
                        });
                    }
                });
            })
            ->orderBy(
                Product::query()
                    ->select('name')
                    ->whereColumn('products.id', 'product_batches.product_id')
                    ->limit(1),
            )
            ->orderBy('batch_no');

        $rows = [];

        foreach ($query->get() as $batch) {
            $parties = ProductBatchBook::partiesForBatch($batch);

            $rows[] = [
                'id' => $batch->id,
                'product_id' => $batch->product_id,
                'product_name' => $batch->product?->name ?? '—',
                'batch_no' => $batch->batch_no,
                'quantity_on_hand' => bcadd((string) $batch->quantity_on_hand, '0', 2),
                'parties' => implode(', ', $parties),
            ];
        }

        return ['rows' => $rows];
    }
}
