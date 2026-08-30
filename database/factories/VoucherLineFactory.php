<?php

namespace Database\Factories;

use App\Enums\VoucherMethod;
use App\Models\Account;
use App\Models\Voucher;
use App\Models\VoucherLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VoucherLine>
 */
class VoucherLineFactory extends Factory
{
    /**
     * @return array{voucher_id: int, method: VoucherMethod, account_id: int, amount: string, bank_name: null, account_no: null, holder_name: null, instrument_no: null}
     */
    public function definition(): array
    {
        return [
            'voucher_id' => Voucher::factory(),
            'method' => VoucherMethod::Cash,
            'account_id' => Account::factory(),
            'amount' => '100.00',
            'bank_name' => null,
            'account_no' => null,
            'holder_name' => null,
            'instrument_no' => null,
        ];
    }
}
