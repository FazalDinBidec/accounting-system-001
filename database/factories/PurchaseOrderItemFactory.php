<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseOrderItem>
 */
class PurchaseOrderItemFactory extends Factory
{
    /**
     * @return array{purchase_id: int, product_id: int, quantity: string, unit_price: string, total_amount: string}
     */
    public function definition(): array
    {
        $quantity = fake()->randomFloat(2, 1, 20);
        $unitPrice = fake()->randomFloat(2, 5, 100);

        return [
            'purchase_id' => PurchaseOrder::factory(),
            'product_id' => Product::factory(),
            'quantity' => number_format($quantity, 2, '.', ''),
            'unit_price' => number_format($unitPrice, 2, '.', ''),
            'total_amount' => number_format($quantity * $unitPrice, 2, '.', ''),
        ];
    }
}
