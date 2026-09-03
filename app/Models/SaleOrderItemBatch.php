<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $sale_order_item_id
 * @property int $product_batch_id
 * @property string $quantity
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read SaleOrderItem $saleOrderItem
 * @property-read ProductBatch $productBatch
 */
#[Fillable(['sale_order_item_id', 'product_batch_id', 'quantity'])]
class SaleOrderItemBatch extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sale_order_item_id' => 'integer',
            'product_batch_id' => 'integer',
            'quantity' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<SaleOrderItem, $this>
     */
    public function saleOrderItem(): BelongsTo
    {
        return $this->belongsTo(SaleOrderItem::class);
    }

    /**
     * @return BelongsTo<ProductBatch, $this>
     */
    public function productBatch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class);
    }
}
