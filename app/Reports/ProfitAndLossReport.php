<?php

namespace App\Reports;

use App\Enums\AccountType;
use App\Models\Account;
use App\Models\JournalEntryLine;
use App\Support\AccountBalance;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final class ProfitAndLossReport
{
    /**
     * @return array{
     *     income: array{
     *         rows: list<array{id: int, name: string, amount: string}>,
     *         total: string
     *     },
     *     expenses: array{
     *         rows: list<array{id: int, name: string, amount: string}>,
     *         total: string
     *     },
     *     net: string,
     *     net_label: 'Net Profit'|'Net Loss'
     * }
     */
    public static function for(?string $from = null, ?string $to = null, bool $excludeClosing = false): array
    {
        $totalsByAccount = JournalEntryLine::query()
            ->whereHas('journalEntry', function (Builder $query) use ($from, $to, $excludeClosing): void {
                if ($from !== null) {
                    $query->whereDate('date', '>=', $from);
                }

                if ($to !== null) {
                    $query->whereDate('date', '<=', $to);
                }

                if ($excludeClosing) {
                    $query->where('is_closing', false);
                }
            })
            ->selectRaw('account_id, COALESCE(SUM(debit), 0) as debit_total, COALESCE(SUM(credit), 0) as credit_total')
            ->groupBy('account_id')
            ->get()
            ->keyBy('account_id');

        /** @var Collection<int, Account> $accounts */
        $accounts = Account::query()
            ->whereIn('type', [AccountType::Income, AccountType::Expense])
            ->whereIn('id', $totalsByAccount->keys())
            ->orderBy('name')
            ->get(['id', 'name', 'type']);

        $incomeRows = [];
        $expenseRows = [];
        $totalIncome = '0.00';
        $totalExpense = '0.00';

        foreach ($accounts as $account) {
            $totals = $totalsByAccount->get($account->id);

            if ($totals === null) {
                continue;
            }

            $amount = AccountBalance::signed(
                (string) $totals->debit_total,
                (string) $totals->credit_total,
                $account->type,
            );

            if (bccomp($amount, '0', 2) === 0) {
                continue;
            }

            $row = [
                'id' => $account->id,
                'name' => $account->name,
                'amount' => $amount,
            ];

            if ($account->type === AccountType::Income) {
                $incomeRows[] = $row;
                $totalIncome = bcadd($totalIncome, $amount, 2);
            } else {
                $expenseRows[] = $row;
                $totalExpense = bcadd($totalExpense, $amount, 2);
            }
        }

        $net = bcsub($totalIncome, $totalExpense, 2);

        return [
            'income' => [
                'rows' => $incomeRows,
                'total' => $totalIncome,
            ],
            'expenses' => [
                'rows' => $expenseRows,
                'total' => $totalExpense,
            ],
            'net' => ltrim($net, '-'),
            'net_label' => bccomp($net, '0', 2) >= 0 ? 'Net Profit' : 'Net Loss',
        ];
    }
}
