<?php

namespace App\Models;

use App\Enums\StockMovementType;
use Database\Factories\StockMovementFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $product_id
 * @property StockMovementType $type
 * @property string $quantity
 * @property Carbon $date
 * @property string $stockable_type
 * @property int $stockable_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Product $product
 * @property-read Model $stockable
 */
#[Fillable(['product_id', 'type', 'quantity', 'date', 'stockable_type', 'stockable_id'])]
class StockMovement extends Model
{
    /** @use HasFactory<StockMovementFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'product_id' => 'integer',
            'type' => StockMovementType::class,
            'quantity' => 'decimal:2',
            'date' => 'date',
            'stockable_id' => 'integer',
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
     * @return MorphTo<Model, $this>
     */
    public function stockable(): MorphTo
    {
        return $this->morphTo();
    }

    public static function syncForOrder(PurchaseOrder|SaleOrder|SaleReturn $order): void
    {
        $order->stockMovements()->delete();
        $order->loadMissing('items');

        $type = match (true) {
            $order instanceof PurchaseOrder => StockMovementType::Purchase,
            $order instanceof SaleOrder => StockMovementType::Sale,
            $order instanceof SaleReturn => StockMovementType::SaleReturn,
        };

        $order->stockMovements()->createMany(
            $order->items->map(fn (PurchaseOrderItem|SaleOrderItem|SaleReturnItem $item): array => [
                'product_id' => $item->product_id,
                'type' => $type,
                'quantity' => $item->quantity,
                'date' => $order->date,
            ])->all(),
        );
    }
}
