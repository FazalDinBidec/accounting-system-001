<?php

namespace Database\Seeders;

use App\Support\FiscalYearGenerator;
use Illuminate\Database\Seeder;

class FiscalYearSeeder extends Seeder
{
    public function run(): void
    {
        $suggested = FiscalYearGenerator::suggestDates();

        FiscalYearGenerator::create(
            name: $suggested['name'],
            startDate: $suggested['start_date'],
            endDate: $suggested['end_date'],
            activate: true,
        );
    }
}
