<?php

namespace App\Support;

use App\Models\Account;
use App\Models\FiscalPeriod;
use App\Models\FiscalPeriodAllocation;
use App\Models\Party;
use App\Reports\ProfitAndLossReport;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class FiscalPeriodCloser
{
    public function close(FiscalPeriod $period, string $closeDate): FiscalPeriod
    {
        return DB::transaction(function () use ($period, $closeDate): FiscalPeriod {
            $period = FiscalPeriod::query()
                ->whereKey($period->id)
                ->lockForUpdate()
                ->with('fiscalYear')
                ->firstOrFail();

            if ($period->is_closed) {
                throw ValidationException::withMessages([
                    'close_date' => __('This fiscal period is already closed.'),
                ]);
            }

            $fiscalYear = $period->fiscalYear;

            if ($fiscalYear->is_closed || ! $fiscalYear->is_active) {
                throw ValidationException::withMessages([
                    'close_date' => __('The fiscal year is not open for closing.'),
                ]);
            }

            $parsedCloseDate = Carbon::parse($closeDate)->toDateString();
            $today = today()->toDateString();

            if ($parsedCloseDate < $period->start_date->toDateString()) {
                throw ValidationException::withMessages([
                    'close_date' => __('Close date cannot be before the period start date.'),
                ]);
            }

            if ($parsedCloseDate > $today) {
                throw ValidationException::withMessages([
                    'close_date' => __('Close date cannot be in the future.'),
                ]);
            }

            if ($parsedCloseDate > $fiscalYear->end_date->toDateString()) {
                throw ValidationException::withMessages([
                    'close_date' => __('Close date cannot be after the fiscal year end date.'),
                ]);
            }

            $profitAndLoss = ProfitAndLossReport::for(
                from: $period->start_date->toDateString(),
                to: $parsedCloseDate,
                excludeClosing: true,
            );

            $netProfit = bcsub($profitAndLoss['income']['total'], $profitAndLoss['expenses']['total'], 2);
            $allocations = $this->allocateProfit($netProfit, $parsedCloseDate);

            DocumentJournal::forget($period);
            $this->postClosingJournal($period, $parsedCloseDate, $profitAndLoss, $allocations);

            foreach ($allocations as $allocation) {
                FiscalPeriodAllocation::query()->create([
                    'fiscal_period_id' => $period->id,
                    'party_id' => $allocation['party_id'],
                    'amount' => $allocation['amount'],
                ]);
            }

            $period->update([
                'end_date' => $parsedCloseDate,
                'is_closed' => true,
                'closed_at' => now(),
                'net_profit' => $netProfit,
            ]);

            $nextStart = Carbon::parse($parsedCloseDate)->addDay()->toDateString();

            if ($nextStart <= $fiscalYear->end_date->toDateString()) {
                FiscalPeriod::query()->create([
                    'fiscal_year_id' => $fiscalYear->id,
                    'sequence' => $period->sequence + 1,
                    'start_date' => $nextStart,
                    'end_date' => null,
                    'is_closed' => false,
                ]);
            }

            return $period->fresh(['fiscalYear', 'allocations.party']);
        });
    }

    /**
     * @return list<array{party_id: int, amount: string}>
     */
    private function allocateProfit(string $netProfit, string $asOf): array
    {
        if (bccomp($netProfit, '0', 2) === 0) {
            return [];
        }

        $partners = CapitalBalance::partners();

        if ($partners->isEmpty()) {
            throw ValidationException::withMessages([
                'close_date' => __('Add at least one active partner before closing a period.'),
            ]);
        }

        $ratios = [];
        $ratioTotal = '0.0000';

        foreach ($partners as $partner) {
            $ratio = CapitalBalance::ratio($partner, $asOf);
            $ratios[$partner->id] = $ratio;
            $ratioTotal = bcadd($ratioTotal, $ratio, 4);
        }

        if (bccomp($ratioTotal, '0', 4) !== 1) {
            $equalShare = bcdiv('1', (string) $partners->count(), 4);

            foreach ($partners as $partner) {
                $ratios[$partner->id] = $equalShare;
            }
        }

        return $this->splitAmount($netProfit, $partners, $ratios);
    }

    /**
     * @param  Collection<int, Party>  $partners
     * @param  array<int, string>  $ratios
     * @return list<array{party_id: int, amount: string}>
     */
    private function splitAmount(string $amount, Collection $partners, array $ratios): array
    {
        $isNegative = bccomp($amount, '0', 2) === -1;
        $absolute = ltrim($amount, '-');
        $allocated = [];
        $running = '0.00';

        foreach ($partners as $index => $partner) {
            $share = $index === $partners->count() - 1
                ? bcsub($absolute, $running, 2)
                : bcmul($absolute, $ratios[$partner->id] ?? '0', 2);

            $running = bcadd($running, $share, 2);

            if (bccomp($share, '0', 2) !== 0) {
                $allocated[] = [
                    'party_id' => $partner->id,
                    'amount' => $isNegative ? '-'.$share : $share,
                ];
            }
        }

        return $allocated;
    }

    /**
     * @param  list<array{party_id: int, amount: string}>  $allocations
     * @param  array{
     *     income: array{rows: list<array{id: int, name: string, amount: string}>, total: string},
     *     expenses: array{rows: list<array{id: int, name: string, amount: string}>, total: string},
     *     net: string,
     *     net_label: 'Net Profit'|'Net Loss'
     * }  $profitAndLoss
     */
    private function postClosingJournal(
        FiscalPeriod $period,
        string $closeDate,
        array $profitAndLoss,
        array $allocations,
    ): void {
        $builder = JournalEntryBuilder::make()
            ->date($closeDate)
            ->narration('Period '.$period->sequence.' close')
            ->journalable($period)
            ->isClosing();

        $hasLines = false;

        foreach ($profitAndLoss['income']['rows'] as $row) {
            if (bccomp($row['amount'], '0', 2) === 0) {
                continue;
            }

            $amount = ltrim($row['amount'], '-');
            $account = Account::query()->findOrFail($row['id']);

            if (bccomp($row['amount'], '0', 2) === 1) {
                $builder->debit(account: $account, amount: $amount);
            } else {
                $builder->credit(account: $account, amount: $amount);
            }

            $hasLines = true;
        }

        foreach ($profitAndLoss['expenses']['rows'] as $row) {
            if (bccomp($row['amount'], '0', 2) === 0) {
                continue;
            }

            $amount = ltrim($row['amount'], '-');
            $account = Account::query()->findOrFail($row['id']);

            if (bccomp($row['amount'], '0', 2) === 1) {
                $builder->credit(account: $account, amount: $amount);
            } else {
                $builder->debit(account: $account, amount: $amount);
            }

            $hasLines = true;
        }

        $capitalAccount = SystemAccounts::partnersCapital();

        foreach ($allocations as $allocation) {
            $amount = ltrim($allocation['amount'], '-');
            $party = Party::query()->findOrFail($allocation['party_id']);

            if (bccomp($allocation['amount'], '0', 2) === -1) {
                $builder->debit(
                    account: $capitalAccount,
                    amount: $amount,
                    party: $party,
                );
            } else {
                $builder->credit(
                    account: $capitalAccount,
                    amount: $amount,
                    party: $party,
                );
            }

            $hasLines = true;
        }

        if ($hasLines) {
            $builder->post();
        }
    }
}
