<?php

namespace App\Models;

use App\Enums\StockMovementType;
use App\Support\BatchNo;
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
 * @property int|null $product_batch_id
 * @property StockMovementType $type
 * @property string $quantity
 * @property Carbon $date
 * @property string $stockable_type
 * @property int $stockable_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Product $product
 * @property-read ProductBatch|null $productBatch
 * @property-read Model $stockable
 */
#[Fillable(['product_id', 'product_batch_id', 'type', 'quantity', 'date', 'stockable_type', 'stockable_id'])]
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
            'product_batch_id' => 'integer',
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
     * @return BelongsTo<ProductBatch, $this>
     */
    public function productBatch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class);
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function stockable(): MorphTo
    {
        return $this->morphTo();
    }

    public static function syncForPurchase(PurchaseOrder $order): void
    {
        $order->stockMovements()->delete();
        $order->loadMissing('items');

        $rows = [];

        foreach ($order->items as $item) {
            $batch = BatchNo::findForProduct($item->product_id, $item->batch_no);

            $rows[] = [
                'product_id' => $item->product_id,
                'product_batch_id' => $batch?->id,
                'type' => StockMovementType::Purchase,
                'quantity' => $item->quantity,
                'date' => $order->date,
            ];
        }

        if ($rows !== []) {
            $order->stockMovements()->createMany($rows);
        }
    }

    public static function syncForSale(SaleOrder $order): void
    {
        $order->stockMovements()->delete();
        $order->loadMissing(['items.batchAllocations']);

        $rows = [];

        foreach ($order->items as $item) {
            foreach ($item->batchAllocations as $allocation) {
                $rows[] = [
                    'product_id' => $item->product_id,
                    'product_batch_id' => $allocation->product_batch_id,
                    'type' => StockMovementType::Sale,
                    'quantity' => $allocation->quantity,
                    'date' => $order->date,
                ];
            }
        }

        if ($rows !== []) {
            $order->stockMovements()->createMany($rows);
        }
    }

    public static function syncForSaleReturn(SaleReturn $order): void
    {
        $order->stockMovements()->delete();
        $order->loadMissing(['items.saleOrderItem.batchAllocations']);

        $rows = [];

        foreach ($order->items as $returnItem) {
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

                $rows[] = [
                    'product_id' => $returnItem->product_id,
                    'product_batch_id' => $allocation->product_batch_id,
                    'type' => StockMovementType::SaleReturn,
                    'quantity' => $share,
                    'date' => $order->date,
                ];
            }
        }

        if ($rows !== []) {
            $order->stockMovements()->createMany($rows);
        }
    }

    /** @deprecated Use syncForPurchase, syncForSale, or syncForSaleReturn */
    public static function syncForOrder(PurchaseOrder|SaleOrder|SaleReturn $order): void
    {
        match (true) {
            $order instanceof PurchaseOrder => self::syncForPurchase($order),
            $order instanceof SaleOrder => self::syncForSale($order),
            $order instanceof SaleReturn => self::syncForSaleReturn($order),
        };
    }
}
