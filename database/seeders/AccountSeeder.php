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

            $record = Account::query()->firstOrNew(['name' => $account['name']]);
            $record->forceFill([
                'type' => $account['type'],
                'parent_id' => $parentId,
                'is_system' => true,
                'is_active' => true,
            ])->save();
        }
    }

    /**
     * @return list<array{name: string, type: AccountType, parent: string|null}>
     */
    private function accounts(): array
    {
        return [
            ['name' => 'Cash', 'type' => AccountType::Asset, 'parent' => null],
            ['name' => 'Cash in Hand', 'type' => AccountType::Asset, 'parent' => 'Cash'],
            ['name' => 'Bank', 'type' => AccountType::Asset, 'parent' => null],
            ['name' => 'Bank Current', 'type' => AccountType::Asset, 'parent' => 'Bank'],
            ['name' => 'Party Receivables', 'type' => AccountType::Asset, 'parent' => null],
            ['name' => 'Inventory', 'type' => AccountType::Asset, 'parent' => null],
            ['name' => 'Party Payables', 'type' => AccountType::Liability, 'parent' => null],
            ['name' => 'Tax Payable', 'type' => AccountType::Liability, 'parent' => null],
            ['name' => 'Partners Capital', 'type' => AccountType::Equity, 'parent' => null],
            ['name' => 'Opening Balance Equity', 'type' => AccountType::Equity, 'parent' => null],
            ['name' => 'Sales', 'type' => AccountType::Income, 'parent' => null],
            ['name' => 'Sales Return', 'type' => AccountType::Income, 'parent' => 'Sales'],
            ['name' => 'Cost of Goods Sold', 'type' => AccountType::Expense, 'parent' => null],
            ['name' => 'General Expense', 'type' => AccountType::Expense, 'parent' => null],
        ];
    }
}
