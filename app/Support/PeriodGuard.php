<?php

namespace App\Support;

use App\Models\FiscalPeriod;
use App\Models\FiscalYear;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

final class PeriodGuard
{
    public static function assertDateIsPostable(string $date): void
    {
        $parsed = Carbon::parse($date)->toDateString();

        $fiscalYear = FiscalYear::query()->active()->open()->first();

        if ($fiscalYear === null) {
            throw ValidationException::withMessages([
                'date' => __('No open active fiscal year is configured.'),
            ]);
        }

        if ($parsed < $fiscalYear->start_date->toDateString() || $parsed > $fiscalYear->end_date->toDateString()) {
            throw ValidationException::withMessages([
                'date' => __('Date must fall within the active fiscal year.'),
            ]);
        }

        $closedPeriod = FiscalPeriod::query()
            ->where('fiscal_year_id', $fiscalYear->id)
            ->where('is_closed', true)
            ->whereDate('start_date', '<=', $parsed)
            ->whereDate('end_date', '>=', $parsed)
            ->exists();

        if ($closedPeriod) {
            throw ValidationException::withMessages([
                'date' => __('This date falls in a closed fiscal period.'),
            ]);
        }

        $openPeriod = FiscalPeriod::query()
            ->where('fiscal_year_id', $fiscalYear->id)
            ->open()
            ->first();

        if ($openPeriod === null) {
            throw ValidationException::withMessages([
                'date' => __('No open fiscal period is available.'),
            ]);
        }

        if ($parsed < $openPeriod->start_date->toDateString()) {
            throw ValidationException::withMessages([
                'date' => __('Date is before the current open fiscal period.'),
            ]);
        }
    }

    public static function activeFiscalYear(): ?FiscalYear
    {
        return FiscalYear::query()->active()->open()->first();
    }
}
