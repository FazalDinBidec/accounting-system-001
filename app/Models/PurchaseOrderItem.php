<?php

namespace App\Models;

use App\Support\BatchNo;
use Database\Factories\PurchaseOrderItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $purchase_id
 * @property int $product_id
 * @property string $batch_no
 * @property string $quantity
 * @property string $unit_price
 * @property string $total_amount
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read PurchaseOrder $purchaseOrder
 * @property-read Product $product
 */
#[Fillable(['purchase_id', 'product_id', 'batch_no', 'quantity', 'unit_price', 'total_amount'])]
class PurchaseOrderItem extends Model
{
    /** @use HasFactory<PurchaseOrderItemFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::saving(function (PurchaseOrderItem $item): void {
            $item->batch_no = BatchNo::normalize($item->batch_no);
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'purchase_id' => 'integer',
            'product_id' => 'integer',
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<PurchaseOrder, $this>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_id');
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
