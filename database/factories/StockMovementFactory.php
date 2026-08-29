<?php

namespace Database\Factories;

use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<StockMovement>
 */
class StockMovementFactory extends Factory
{
    /**
     * @return array{product_id: int, type: StockMovementType, quantity: string, date: Carbon, stockable_type: string, stockable_id: int}
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'type' => StockMovementType::Purchase,
            'quantity' => number_format(fake()->randomFloat(2, 1, 20), 2, '.', ''),
            'date' => fake()->dateTimeBetween('-1 month'),
            'stockable_type' => PurchaseOrder::class,
            'stockable_id' => PurchaseOrder::factory(),
        ];
    }
}
