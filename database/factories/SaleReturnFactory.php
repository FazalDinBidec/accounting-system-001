<?php

namespace Database\Factories;

use App\Models\SaleOrder;
use App\Models\SaleReturn;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<SaleReturn>
 */
class SaleReturnFactory extends Factory
{
    /**
     * @return array{sale_id: int, number: string, date: Carbon, sub_total: string, total_amount: string, notes: string}
     */
    public function definition(): array
    {
        $total = fake()->randomFloat(2, 10, 200);

        return [
            'sale_id' => SaleOrder::factory(),
            'number' => 'SR-'.fake()->unique()->numerify('#####'),
            'date' => fake()->dateTimeBetween('-1 month'),
            'sub_total' => number_format($total, 2, '.', ''),
            'total_amount' => number_format($total, 2, '.', ''),
            'notes' => fake()->sentence(),
        ];
    }
}
