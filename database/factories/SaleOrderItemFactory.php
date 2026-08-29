<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\SaleOrder;
use App\Models\SaleOrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SaleOrderItem>
 */
class SaleOrderItemFactory extends Factory
{
    /**
     * @return array{sale_id: int, product_id: int, quantity: string, unit_price: string, total_amount: string}
     */
    public function definition(): array
    {
        $quantity = fake()->randomFloat(2, 1, 20);
        $unitPrice = fake()->randomFloat(2, 5, 100);

        return [
            'sale_id' => SaleOrder::factory(),
            'product_id' => Product::factory(),
            'quantity' => number_format($quantity, 2, '.', ''),
            'unit_price' => number_format($unitPrice, 2, '.', ''),
            'total_amount' => number_format($quantity * $unitPrice, 2, '.', ''),
        ];
    }
}
