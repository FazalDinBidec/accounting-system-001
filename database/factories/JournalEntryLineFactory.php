<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JournalEntryLine>
 */
class JournalEntryLineFactory extends Factory
{
    /**
     * @return array{journal_entry_id: int, account_id: int, debit: string, credit: string, narration: string}
     */
    public function definition(): array
    {
        return [
            'journal_entry_id' => JournalEntry::factory(),
            'account_id' => Account::factory(),
            'debit' => '0.00',
            'credit' => '0.00',
            'narration' => fake()->sentence(),
        ];
    }
}
