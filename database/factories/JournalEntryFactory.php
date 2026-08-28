<?php

namespace Database\Factories;

use App\Models\JournalEntry;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<JournalEntry>
 */
class JournalEntryFactory extends Factory
{
    /**
     * @return array{number: Carbon, date: Carbon, narration: string, journalable_type: null, journalable_id: null}
     */
    public function definition(): array
    {
        $date = fake()->dateTimeBetween('-1 month');

        return [
            'number' => $date,
            'date' => $date,
            'narration' => fake()->sentence(),
            'journalable_type' => null,
            'journalable_id' => null,
        ];
    }
}
