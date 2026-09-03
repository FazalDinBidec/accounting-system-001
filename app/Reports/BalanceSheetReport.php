<?php

namespace App\Reports;

use App\Enums\AccountType;
use App\Models\Account;
use App\Models\JournalEntryLine;
use App\Models\Party;
use App\Support\AccountBalance;
use App\Support\SystemAccounts;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

final class BalanceSheetReport
{
    /**
     * @return array{
     *     assets: array{rows: list<array{id: int, name: string, amount: string}>, total: string},
     *     liabilities: array{rows: list<array{id: int, name: string, amount: string}>, total: string},
     *     equity: array{rows: list<array{id: int, name: string, amount: string, party_name: string|null}>, total: string},
     *     totals: array{liabilities_and_equity: string}
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
            ->selectRaw('account_id, party_id, COALESCE(SUM(debit), 0) as debit_total, COALESCE(SUM(credit), 0) as credit_total')
            ->groupBy('account_id', 'party_id')
            ->get();

        $accounts = Account::query()
            ->whereIn('type', [AccountType::Asset, AccountType::Liability, AccountType::Equity])
            ->orderBy('name')
            ->get(['id', 'name', 'type'])
            ->keyBy('id');

        $partnersCapitalId = SystemAccounts::partnersCapital()->id;
        $parties = Party::query()->whereIn('id', $totalsByAccount->pluck('party_id')->filter())->pluck('name', 'id');

        $assets = [];
        $liabilities = [];
        $equity = [];
        $totalAssets = '0.00';
        $totalLiabilities = '0.00';
        $totalEquity = '0.00';

        /** @var Collection<int, Collection<int, object>> $grouped */
        $grouped = $totalsByAccount->groupBy('account_id');

        foreach ($grouped as $accountId => $rows) {
            $account = $accounts->get((int) $accountId);

            if ($account === null) {
                continue;
            }

            if ((int) $accountId === $partnersCapitalId) {
                foreach ($rows as $row) {
                    if ($row->party_id === null) {
                        continue;
                    }

                    $signed = AccountBalance::signed(
                        (string) $row->debit_total,
                        (string) $row->credit_total,
                        $account->type,
                    );

                    if (bccomp($signed, '0', 2) === 0) {
                        continue;
                    }

                    $equity[] = [
                        'id' => $account->id,
                        'name' => $account->name,
                        'amount' => $signed,
                        'party_name' => $parties->get($row->party_id),
                    ];
                    $totalEquity = bcadd($totalEquity, $signed, 2);
                }

                continue;
            }

            $debitTotal = '0.00';
            $creditTotal = '0.00';

            foreach ($rows as $row) {
                $debitTotal = bcadd($debitTotal, (string) $row->debit_total, 2);
                $creditTotal = bcadd($creditTotal, (string) $row->credit_total, 2);
            }

            $signed = AccountBalance::signed($debitTotal, $creditTotal, $account->type);

            if (bccomp($signed, '0', 2) === 0) {
                continue;
            }

            $row = [
                'id' => $account->id,
                'name' => $account->name,
                'amount' => $signed,
            ];

            match ($account->type) {
                AccountType::Asset => (function () use (&$assets, &$totalAssets, $row, $signed): void {
                    $assets[] = $row;
                    $totalAssets = bcadd($totalAssets, $signed, 2);
                })(),
                AccountType::Liability => (function () use (&$liabilities, &$totalLiabilities, $row, $signed): void {
                    $liabilities[] = $row;
                    $totalLiabilities = bcadd($totalLiabilities, $signed, 2);
                })(),
                AccountType::Equity => (function () use (&$equity, &$totalEquity, $row, $signed): void {
                    $equity[] = [...$row, 'party_name' => null];
                    $totalEquity = bcadd($totalEquity, $signed, 2);
                })(),
                default => null,
            };
        }

        $liabilitiesAndEquity = bcadd($totalLiabilities, $totalEquity, 2);

        return [
            'assets' => [
                'rows' => $assets,
                'total' => $totalAssets,
            ],
            'liabilities' => [
                'rows' => $liabilities,
                'total' => $totalLiabilities,
            ],
            'equity' => [
                'rows' => $equity,
                'total' => $totalEquity,
            ],
            'totals' => [
                'liabilities_and_equity' => $liabilitiesAndEquity,
            ],
        ];
    }
}
