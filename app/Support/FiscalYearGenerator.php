<?php

namespace App\Support;

use App\Models\FiscalPeriod;
use App\Models\FiscalYear;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class FiscalYearGenerator
{
    /**
     * @return array{name: string, start_date: string, end_date: string}
     */
    public static function suggestDates(?Carbon $reference = null): array
    {
        $reference ??= today();

        $start = $reference->copy()->startOfMonth();
        $end = $start->copy()->addYear()->subDay();

        return [
            'name' => 'FY '.$start->format('Y').'-'.$end->format('y'),
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
        ];
    }

    public static function create(string $name, string $startDate, string $endDate, bool $activate = true): FiscalYear
    {
        return DB::transaction(function () use ($name, $startDate, $endDate, $activate): FiscalYear {
            if ($activate) {
                FiscalYear::query()->where('is_active', true)->update(['is_active' => false]);
            }

            $fiscalYear = FiscalYear::query()->create([
                'name' => $name,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'is_active' => $activate,
                'is_closed' => false,
            ]);

            FiscalPeriod::query()->create([
                'fiscal_year_id' => $fiscalYear->id,
                'sequence' => 1,
                'start_date' => $startDate,
                'end_date' => null,
                'is_closed' => false,
            ]);

            return $fiscalYear->load('periods');
        });
    }

    public static function createNext(FiscalYear $current): FiscalYear
    {
        $start = $current->end_date->copy()->addDay();
        $days = $current->start_date->diffInDays($current->end_date) + 1;
        $end = $start->copy()->addDays($days - 1);

        return self::create(
            name: 'FY '.$start->format('Y').'-'.$end->format('y'),
            startDate: $start->toDateString(),
            endDate: $end->toDateString(),
            activate: true,
        );
    }
}
