<?php

namespace App\Models;

use App\Concerns\HasJournalEntries;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $fiscal_year_id
 * @property int $sequence
 * @property Carbon $start_date
 * @property Carbon|null $end_date
 * @property bool $is_closed
 * @property Carbon|null $closed_at
 * @property string|null $net_profit
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read FiscalYear $fiscalYear
 * @property-read Collection<int, FiscalPeriodAllocation> $allocations
 */
#[Fillable(['fiscal_year_id', 'sequence', 'start_date', 'end_date', 'is_closed', 'closed_at', 'net_profit'])]
class FiscalPeriod extends Model
{
    use HasJournalEntries;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fiscal_year_id' => 'integer',
            'sequence' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
            'is_closed' => 'boolean',
            'closed_at' => 'datetime',
            'net_profit' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<FiscalYear, $this>
     */
    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    /**
     * @return HasMany<FiscalPeriodAllocation, $this>
     */
    public function allocations(): HasMany
    {
        return $this->hasMany(FiscalPeriodAllocation::class);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeOpen($query)
    {
        return $query->where('is_closed', false);
    }
}
