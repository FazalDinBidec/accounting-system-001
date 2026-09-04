<?php

namespace App\Models;

use App\Concerns\HasJournalEntries;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $number
 * @property Carbon $date
 * @property string $amount
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, ExpenseLine> $expenseLines
 * @property-read Collection<int, ExpensePaymentLine> $paymentLines
 */
#[Fillable(['number', 'date', 'amount', 'notes'])]
class Expense extends Model
{
    use HasJournalEntries;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    /**
     * @return HasMany<ExpenseLine, $this>
     */
    public function expenseLines(): HasMany
    {
        return $this->hasMany(ExpenseLine::class);
    }

    /**
     * @return HasMany<ExpensePaymentLine, $this>
     */
    public function paymentLines(): HasMany
    {
        return $this->hasMany(ExpensePaymentLine::class);
    }
}
