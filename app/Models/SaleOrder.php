<?php

namespace App\Models;

use Database\Factories\SaleOrderFactory;
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
 * @property int $party_id
 * @property string $number
 * @property Carbon $date
 * @property string $sub_total
 * @property string $other_charges
 * @property string $total_amount
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Party $party
 * @property-read Collection<int, SaleOrderItem> $items
 * @property-read Collection<int, StockMovement> $stockMovements
 */
#[Fillable(['party_id', 'number', 'date', 'sub_total', 'other_charges', 'total_amount', 'notes'])]
class SaleOrder extends Model
{
    /** @use HasFactory<SaleOrderFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'other_charges' => 0,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'party_id' => 'integer',
            'date' => 'date',
            'sub_total' => 'decimal:2',
            'other_charges' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Party, $this>
     */
    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class);
    }

    /**
     * @return HasMany<SaleOrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleOrderItem::class, 'sale_id');
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
        static::deleting(function (SaleOrder $saleOrder): void {
            $saleOrder->stockMovements()->delete();
        });
    }
}
