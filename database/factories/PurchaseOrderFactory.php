<?php

namespace Database\Factories;

use App\Models\Party;
use App\Models\PurchaseOrder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<PurchaseOrder>
 */
class PurchaseOrderFactory extends Factory
{
    /**
     * @return array{party_id: int, number: string, date: Carbon, sub_total: string, other_charges: string, total_amount: string, notes: string}
     */
    public function definition(): array
    {
        $subTotal = fake()->randomFloat(2, 10, 500);
        $otherCharges = fake()->randomFloat(2, 0, 50);

        return [
            'party_id' => Party::factory(),
            'number' => 'PO-'.fake()->unique()->numerify('#####'),
            'date' => fake()->dateTimeBetween('-1 month'),
            'sub_total' => number_format($subTotal, 2, '.', ''),
            'other_charges' => number_format($otherCharges, 2, '.', ''),
            'total_amount' => number_format($subTotal + $otherCharges, 2, '.', ''),
            'notes' => fake()->sentence(),
        ];
    }
}
