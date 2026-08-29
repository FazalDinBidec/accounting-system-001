<?php

namespace Database\Seeders;

use App\Enums\AccountType;
use App\Models\Account;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->accounts() as $account) {
            $parentId = $account['parent'] === null
                ? null
                : Account::query()->where('name', $account['parent'])->value('id');

            Account::query()->firstOrCreate(
                ['name' => $account['name']],
                [
                    'type' => $account['type'],
                    'parent_id' => $parentId,
                    'is_active' => true,
                ],
            );
        }
    }

    /**
     * @return list<array{name: string, type: AccountType, parent: string|null}>
     */
    private function accounts(): array
    {
        return [
            ['name' => 'Cash', 'type' => AccountType::Asset, 'parent' => null],
            ['name' => 'Bank', 'type' => AccountType::Asset, 'parent' => null],
            ['name' => 'Party Receivables', 'type' => AccountType::Asset, 'parent' => null],
            ['name' => 'Inventory', 'type' => AccountType::Asset, 'parent' => null],
            ['name' => 'Party Payables', 'type' => AccountType::Liability, 'parent' => null],
            ['name' => 'Tax Payable', 'type' => AccountType::Liability, 'parent' => null],
            ['name' => 'Owner Capital', 'type' => AccountType::Equity, 'parent' => null],
            ['name' => 'Sales', 'type' => AccountType::Income, 'parent' => null],
            ['name' => 'Sales Return', 'type' => AccountType::Income, 'parent' => 'Sales'],
            ['name' => 'Cost of Goods Sold', 'type' => AccountType::Expense, 'parent' => null],
            ['name' => 'General Expense', 'type' => AccountType::Expense, 'parent' => null],
        ];
    }
}
