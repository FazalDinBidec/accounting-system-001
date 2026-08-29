<?php

namespace App\Models;

use Database\Factories\SaleReturnItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $sale_return_id
 * @property int $sale_order_item_id
 * @property int $product_id
 * @property string $quantity
 * @property string $unit_price
 * @property string $total_amount
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read SaleReturn $saleReturn
 * @property-read SaleOrderItem $saleOrderItem
 * @property-read Product $product
 */
#[Fillable(['sale_return_id', 'sale_order_item_id', 'product_id', 'quantity', 'unit_price', 'total_amount'])]
class SaleReturnItem extends Model
{
    /** @use HasFactory<SaleReturnItemFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sale_return_id' => 'integer',
            'sale_order_item_id' => 'integer',
            'product_id' => 'integer',
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<SaleReturn, $this>
     */
    public function saleReturn(): BelongsTo
    {
        return $this->belongsTo(SaleReturn::class);
    }

    /**
     * @return BelongsTo<SaleOrderItem, $this>
     */
    public function saleOrderItem(): BelongsTo
    {
        return $this->belongsTo(SaleOrderItem::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
