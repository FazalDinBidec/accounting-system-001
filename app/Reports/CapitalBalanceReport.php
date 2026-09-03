<?php

namespace App\Reports;

use App\Enums\CapitalTransactionType;
use App\Models\CapitalTransaction;
use App\Models\FiscalPeriodAllocation;
use App\Support\CapitalBalance;
use Illuminate\Database\Eloquent\Builder;

final class CapitalBalanceReport
{
    /**
     * @return array{
     *     rows: list<array{
     *         party_id: int,
     *         party_name: string,
     *         allocated: string,
     *         withdrawn: string,
     *         balance: string
     *     }>,
     *     totals: array{allocated: string, withdrawn: string, balance: string}
     * }
     */
    public static function for(?string $from = null, ?string $to = null): array
    {
        $partners = CapitalBalance::partners();
        $rows = [];
        $totalAllocated = '0.00';
        $totalWithdrawn = '0.00';
        $totalBalance = '0.00';

        foreach ($partners as $partner) {
            $allocated = FiscalPeriodAllocation::query()
                ->where('party_id', $partner->id)
                ->when($from !== null || $to !== null, function (Builder $query) use ($from, $to): void {
                    $query->whereHas('fiscalPeriod', function (Builder $periodQuery) use ($from, $to): void {
                        if ($from !== null) {
                            $periodQuery->whereDate('end_date', '>=', $from);
                        }

                        if ($to !== null) {
                            $periodQuery->whereDate('end_date', '<=', $to);
                        }
                    });
                })
                ->sum('amount');

            $withdrawn = CapitalTransaction::query()
                ->where('party_id', $partner->id)
                ->where('type', CapitalTransactionType::Withdrawal)
                ->when($from !== null, fn (Builder $query): Builder => $query->whereDate('date', '>=', $from))
                ->when($to !== null, fn (Builder $query): Builder => $query->whereDate('date', '<=', $to))
                ->sum('amount');

            $balance = CapitalBalance::for($partner, $to);

            $allocatedAmount = bcadd((string) $allocated, '0', 2);
            $withdrawnAmount = bcadd((string) $withdrawn, '0', 2);

            $rows[] = [
                'party_id' => $partner->id,
                'party_name' => $partner->name,
                'allocated' => $allocatedAmount,
                'withdrawn' => $withdrawnAmount,
                'balance' => $balance,
            ];

            $totalAllocated = bcadd($totalAllocated, $allocatedAmount, 2);
            $totalWithdrawn = bcadd($totalWithdrawn, $withdrawnAmount, 2);
            $totalBalance = bcadd($totalBalance, $balance, 2);
        }

        return [
            'rows' => $rows,
            'totals' => [
                'allocated' => $totalAllocated,
                'withdrawn' => $totalWithdrawn,
                'balance' => $totalBalance,
            ],
        ];
    }
}
