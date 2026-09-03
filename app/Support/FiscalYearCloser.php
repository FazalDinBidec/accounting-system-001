<?php

namespace App\Support;

use App\Models\FiscalYear;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class FiscalYearCloser
{
    public function close(FiscalYear $fiscalYear): FiscalYear
    {
        return DB::transaction(function () use ($fiscalYear): FiscalYear {
            $fiscalYear = FiscalYear::query()
                ->whereKey($fiscalYear->id)
                ->lockForUpdate()
                ->with('periods')
                ->firstOrFail();

            if ($fiscalYear->is_closed) {
                throw ValidationException::withMessages([
                    'fiscal_year' => __('This fiscal year is already closed.'),
                ]);
            }

            if (! $fiscalYear->is_active) {
                throw ValidationException::withMessages([
                    'fiscal_year' => __('Only the active fiscal year can be closed.'),
                ]);
            }

            $openPeriods = $fiscalYear->periods->where('is_closed', false);

            if ($openPeriods->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'fiscal_year' => __('Close all fiscal periods before closing the fiscal year.'),
                ]);
            }

            $lastPeriod = $fiscalYear->periods->sortByDesc('sequence')->first();

            if ($lastPeriod === null || $lastPeriod->end_date === null) {
                throw ValidationException::withMessages([
                    'fiscal_year' => __('The fiscal year has no closed periods.'),
                ]);
            }

            if ($lastPeriod->end_date->toDateString() !== $fiscalYear->end_date->toDateString()) {
                throw ValidationException::withMessages([
                    'fiscal_year' => __('The last closed period must end on the fiscal year end date.'),
                ]);
            }

            $fiscalYear->update([
                'is_closed' => true,
                'is_active' => false,
                'closed_at' => now(),
            ]);

            return FiscalYearGenerator::createNext($fiscalYear);
        });
    }
}
