<?php

namespace Database\Factories;

use App\Enums\AccountType;
use App\Models\Account;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Account>
 */
class AccountFactory extends Factory
{
    /**
     * @return array{name: string, type: AccountType, parent_id: null, is_active: bool}
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'type' => AccountType::Asset,
            'parent_id' => null,
            'is_active' => true,
        ];
    }
}
