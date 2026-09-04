<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $expense_id
 * @property int $account_id
 * @property string $amount
 * @property string|null $narration
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Expense $expense
 * @property-read Account $account
 */
#[Fillable(['expense_id', 'account_id', 'amount', 'narration'])]
class ExpenseLine extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expense_id' => 'integer',
            'account_id' => 'integer',
            'amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Expense, $this>
     */
    public function expense(): BelongsTo
    {
        return $this->belongsTo(Expense::class);
    }

    /**
     * @return BelongsTo<Account, $this>
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
