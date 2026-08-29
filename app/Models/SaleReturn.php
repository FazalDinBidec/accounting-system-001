<?php

namespace App\Models;

use Database\Factories\SaleReturnFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $sale_id
 * @property string $number
 * @property Carbon $date
 * @property string $sub_total
 * @property string $total_amount
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read SaleOrder $saleOrder
 * @property-read Collection<int, SaleReturnItem> $items
 * @property-read Collection<int, StockMovement> $stockMovements
 */
#[Fillable(['sale_id', 'number', 'date', 'sub_total', 'total_amount', 'notes'])]
class SaleReturn extends Model
{
    /** @use HasFactory<SaleReturnFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sale_id' => 'integer',
            'date' => 'date',
            'sub_total' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<SaleOrder, $this>
     */
    public function saleOrder(): BelongsTo
    {
        return $this->belongsTo(SaleOrder::class, 'sale_id');
    }

    /**
     * @return HasMany<SaleReturnItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleReturnItem::class);
    }

    /**
     * @return MorphMany<StockMovement, $this>
     */
    public function stockMovements(): MorphMany
    {
        return $this->morphMany(StockMovement::class, 'stockable');
    }

    protected static function booted(): void
    {
        static::deleting(function (SaleReturn $saleReturn): void {
            $saleReturn->stockMovements()->delete();
        });
    }
}
