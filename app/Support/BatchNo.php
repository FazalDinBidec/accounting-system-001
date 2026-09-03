<?php

namespace App\Support;

use App\Models\ProductBatch;
use App\Models\PurchaseOrderItem;
use Illuminate\Database\Eloquent\Builder;

final class BatchNo
{
    public static function normalize(string $batchNo): string
    {
        return mb_strtoupper(trim($batchNo), 'UTF-8');
    }

    public static function findForProduct(int $productId, string $batchNo): ?ProductBatch
    {
        $normalized = self::normalize($batchNo);

        return ProductBatch::query()
            ->where('product_id', $productId)
            ->whereRaw('UPPER(batch_no) = ?', [$normalized])
            ->first();
    }

    /**
     * @param  Builder<PurchaseOrderItem>  $query
     * @return Builder<PurchaseOrderItem>
     */
    public static function scopePurchaseItemsForBatch(
        Builder $query,
        int $productId,
        string $batchNo,
    ): Builder {
        return $query
            ->where('product_id', $productId)
            ->whereRaw('UPPER(batch_no) = ?', [self::normalize($batchNo)]);
    }

    /**
     * @param  Builder<ProductBatch>  $query
     * @return Builder<ProductBatch>
     */
    public static function scopeProductBatch(
        Builder $query,
        int $productId,
        string $batchNo,
    ): Builder {
        return $query
            ->where('product_id', $productId)
            ->whereRaw('UPPER(batch_no) = ?', [self::normalize($batchNo)]);
    }
}
