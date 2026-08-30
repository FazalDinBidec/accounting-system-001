<?php

namespace App\Models;

use App\Enums\VoucherMethod;
use Database\Factories\VoucherLineFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $voucher_id
 * @property VoucherMethod $method
 * @property int $account_id
 * @property string $amount
 * @property string|null $bank_name
 * @property string|null $account_no
 * @property string|null $holder_name
 * @property string|null $instrument_no
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Voucher $voucher
 * @property-read Account $account
 */
#[Fillable(['voucher_id', 'method', 'account_id', 'amount', 'bank_name', 'account_no', 'holder_name', 'instrument_no'])]
class VoucherLine extends Model
{
    /** @use HasFactory<VoucherLineFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'voucher_id' => 'integer',
            'method' => VoucherMethod::class,
            'account_id' => 'integer',
            'amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Voucher, $this>
     */
    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    /**
     * @return BelongsTo<Account, $this>
     */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
