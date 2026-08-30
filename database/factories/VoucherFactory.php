<?php

namespace Database\Factories;

use App\Enums\VoucherType;
use App\Models\Party;
use App\Models\Voucher;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Voucher>
 */
class VoucherFactory extends Factory
{
    /**
     * @return array{type: VoucherType, number: string, date: Carbon, party_id: int, amount: string, notes: string}
     */
    public function definition(): array
    {
        return [
            'type' => VoucherType::Receipt,
            'number' => 'RCP-'.fake()->unique()->numerify('#####'),
            'date' => fake()->dateTimeBetween('-1 month'),
            'party_id' => Party::factory(),
            'amount' => '100.00',
            'notes' => fake()->sentence(),
        ];
    }
}
