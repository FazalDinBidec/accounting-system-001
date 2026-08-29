<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\SaleOrderItem;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SaleReturnItem>
 */
class SaleReturnItemFactory extends Factory
{
    /**
     * @return array{sale_return_id: int, sale_order_item_id: int, product_id: int, quantity: string, unit_price: string, total_amount: string}
     */
    public function definition(): array
    {
        $quantity = fake()->randomFloat(2, 1, 5);
        $unitPrice = fake()->randomFloat(2, 5, 100);

        return [
            'sale_return_id' => SaleReturn::factory(),
            'sale_order_item_id' => SaleOrderItem::factory(),
            'product_id' => Product::factory(),
            'quantity' => number_format($quantity, 2, '.', ''),
            'unit_price' => number_format($unitPrice, 2, '.', ''),
            'total_amount' => number_format($quantity * $unitPrice, 2, '.', ''),
        ];
    }
}
