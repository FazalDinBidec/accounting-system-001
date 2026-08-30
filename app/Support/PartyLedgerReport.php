<?php

namespace App\Support;

use App\Models\JournalEntryLine;
use App\Models\Party;
use Illuminate\Database\Eloquent\Builder;

final class PartyLedgerReport
{
    /**
     * @return array{
     *     opening: array{receivable: string, payable: string, net: string}|null,
     *     rows: list<array{
     *         id: int,
     *         date: string,
     *         type: string,
     *         reference: string,
     *         account: string,
     *         debit: string,
     *         credit: string,
     *         receivable: string,
     *         payable: string,
     *         net: string
     *     }>,
     *     closing: array{receivable: string, payable: string, net: string}
     * }
     */
    public static function for(Party $party, ?string $from = null, ?string $to = null): array
    {
        $receivableAccountId = SystemAccounts::partyReceivables()->id;
        $payableAccountId = SystemAccounts::partyPayables()->id;
        $accountIds = [$receivableAccountId, $payableAccountId];

        $receivableBalance = '0.00';
        $payableBalance = '0.00';
        $opening = null;

        if ($from !== null) {
            $openingTotals = self::totalsQuery($party, $accountIds)
                ->whereHas('journalEntry', function (Builder $query) use ($from): void {
                    $query->whereDate('date', '<', $from);
                })
                ->get();

            $receivableBalance = self::receivableBalance($openingTotals, $receivableAccountId);
            $payableBalance = self::payableBalance($openingTotals, $payableAccountId);

            $opening = [
                'receivable' => $receivableBalance,
                'payable' => $payableBalance,
                'net' => bcsub($receivableBalance, $payableBalance, 2),
            ];
        }

        $lines = JournalEntryLine::query()
            ->where('party_id', $party->id)
            ->whereIn('account_id', $accountIds)
            ->whereHas('journalEntry', function (Builder $query) use ($from, $to): void {
                if ($from !== null) {
                    $query->whereDate('date', '>=', $from);
                }

                if ($to !== null) {
                    $query->whereDate('date', '<=', $to);
                }
            })
            ->with(['journalEntry.journalable', 'account:id,name'])
            ->get()
            ->sortBy(fn (JournalEntryLine $line): array => [
                $line->journalEntry->date->format('Y-m-d'),
                $line->id,
            ])
            ->values();

        $rows = [];

        foreach ($lines as $line) {
            $debit = bcadd((string) $line->debit, '0', 2);
            $credit = bcadd((string) $line->credit, '0', 2);
            $entry = $line->journalEntry;

            if ((int) $line->account_id === $receivableAccountId) {
                $receivableBalance = bcadd($receivableBalance, bcsub($debit, $credit, 2), 2);
            } else {
                $payableBalance = bcadd($payableBalance, bcsub($credit, $debit, 2), 2);
            }

            $rows[] = [
                'id' => $line->id,
                'date' => $entry->date->toDateString(),
                'type' => JournalReference::type($entry),
                'reference' => JournalReference::label($entry),
                'account' => $line->account->name,
                'debit' => $debit,
                'credit' => $credit,
                'receivable' => $receivableBalance,
                'payable' => $payableBalance,
                'net' => bcsub($receivableBalance, $payableBalance, 2),
            ];
        }

        return [
            'opening' => $opening,
            'rows' => $rows,
            'closing' => [
                'receivable' => $receivableBalance,
                'payable' => $payableBalance,
                'net' => bcsub($receivableBalance, $payableBalance, 2),
            ],
        ];
    }

    /**
     * @param  list<int>  $accountIds
     */
    private static function totalsQuery(Party $party, array $accountIds): Builder
    {
        return JournalEntryLine::query()
            ->where('party_id', $party->id)
            ->whereIn('account_id', $accountIds)
            ->selectRaw('account_id, COALESCE(SUM(debit), 0) as debit_total, COALESCE(SUM(credit), 0) as credit_total')
            ->groupBy('account_id');
    }

    /**
     * @param  iterable<int, JournalEntryLine>  $totals
     */
    private static function receivableBalance(iterable $totals, int $receivableAccountId): string
    {
        foreach ($totals as $row) {
            if ((int) $row->account_id === $receivableAccountId) {
                return bcsub(
                    bcadd((string) $row->debit_total, '0', 2),
                    bcadd((string) $row->credit_total, '0', 2),
                    2,
                );
            }
        }

        return '0.00';
    }

    /**
     * @param  iterable<int, JournalEntryLine>  $totals
     */
    private static function payableBalance(iterable $totals, int $payableAccountId): string
    {
        foreach ($totals as $row) {
            if ((int) $row->account_id === $payableAccountId) {
                return bcsub(
                    bcadd((string) $row->credit_total, '0', 2),
                    bcadd((string) $row->debit_total, '0', 2),
                    2,
                );
            }
        }

        return '0.00';
    }
}
