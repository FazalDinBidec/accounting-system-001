<?php

namespace App\Models;

use App\Concerns\HasJournalEntries;
use App\Enums\CapitalTransactionType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property CapitalTransactionType $type
 * @property string $number
 * @property Carbon $date
 * @property int $party_id
 * @property string $amount
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Party $party
 * @property-read Collection<int, CapitalTransactionLine> $lines
 */
#[Fillable(['type', 'number', 'date', 'party_id', 'amount', 'notes'])]
class CapitalTransaction extends Model
{
    use HasJournalEntries;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => CapitalTransactionType::class,
            'date' => 'date',
            'party_id' => 'integer',
            'amount' => 'decimal:2',
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
     * @return HasMany<CapitalTransactionLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(CapitalTransactionLine::class);
    }
}
