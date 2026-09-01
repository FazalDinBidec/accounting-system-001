<?php

namespace App\Reports;

use App\Enums\AccountType;
use App\Models\Account;
use App\Models\JournalEntryLine;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final class TrialBalanceReport
{
    /**
     * @return array{
     *     rows: list<array{
     *         id: int,
     *         name: string,
     *         type: string,
     *         debit: string,
     *         credit: string
     *     }>,
     *     totals: array{debit: string, credit: string}
     * }
     */
    public static function for(?string $to = null): array
    {
        $totalsByAccount = JournalEntryLine::query()
            ->when($to !== null, function (Builder $query) use ($to): void {
                $query->whereHas('journalEntry', function (Builder $entryQuery) use ($to): void {
                    $entryQuery->whereDate('date', '<=', $to);
                });
            })
            ->selectRaw('account_id, COALESCE(SUM(debit), 0) as debit_total, COALESCE(SUM(credit), 0) as credit_total')
            ->groupBy('account_id')
            ->get()
            ->keyBy('account_id');

        /** @var Collection<int, Account> $accounts */
        $accounts = Account::query()
            ->whereIn('id', $totalsByAccount->keys())
            ->orderBy('name')
            ->get(['id', 'name', 'type']);

        $rows = [];
        $totalDebit = '0.00';
        $totalCredit = '0.00';

        foreach ($accounts as $account) {
            $totals = $totalsByAccount->get($account->id);

            if ($totals === null) {
                continue;
            }

            $signed = AccountBalance::signed(
                (string) $totals->debit_total,
                (string) $totals->credit_total,
                $account->type,
            );

            if (bccomp($signed, '0', 2) === 0) {
                continue;
            }

            $columns = AccountBalance::trialColumns($signed, $account->type);

            $rows[] = [
                'id' => $account->id,
                'name' => $account->name,
                'type' => self::typeLabel($account->type),
                'debit' => $columns['debit'],
                'credit' => $columns['credit'],
            ];

            $totalDebit = bcadd($totalDebit, $columns['debit'], 2);
            $totalCredit = bcadd($totalCredit, $columns['credit'], 2);
        }

        return [
            'rows' => $rows,
            'totals' => [
                'debit' => $totalDebit,
                'credit' => $totalCredit,
            ],
        ];
    }

    private static function typeLabel(AccountType $type): string
    {
        return match ($type) {
            AccountType::Asset => 'Asset',
            AccountType::Liability => 'Liability',
            AccountType::Equity => 'Equity',
            AccountType::Income => 'Income',
            AccountType::Expense => 'Expense',
        };
    }
}
