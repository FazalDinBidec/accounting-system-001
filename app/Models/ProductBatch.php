<?php

namespace App\Models;

use App\Support\BatchNo;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $product_id
 * @property string $batch_no
 * @property string $quantity_on_hand
 * @property Carbon $purchased_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Product $product
 * @property-read Collection<int, SaleOrderItemBatch> $saleOrderItemBatches
 * @property-read Collection<int, StockMovement> $stockMovements
 */
#[Fillable(['product_id', 'batch_no', 'quantity_on_hand', 'purchased_at'])]
class ProductBatch extends Model
{
    protected static function booted(): void
    {
        static::saving(function (ProductBatch $batch): void {
            $batch->batch_no = BatchNo::normalize($batch->batch_no);
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'product_id' => 'integer',
            'quantity_on_hand' => 'decimal:2',
            'purchased_at' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return HasMany<SaleOrderItemBatch, $this>
     */
    public function saleOrderItemBatches(): HasMany
    {
        return $this->hasMany(SaleOrderItemBatch::class);
    }

    /**
     * @return HasMany<StockMovement, $this>
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }
}
