<?php

namespace App\Reports;

use App\Models\Account;
use App\Models\JournalEntryLine;
use Illuminate\Database\Eloquent\Builder;

final class GeneralLedgerReport
{
    /**
     * @return array{
     *     opening: string|null,
     *     rows: list<array{
     *         id: int,
     *         date: string,
     *         type: string,
     *         reference: string,
     *         party: string|null,
     *         narration: string|null,
     *         debit: string,
     *         credit: string,
     *         balance: string
     *     }>,
     *     closing: string
     * }
     */
    public static function for(Account $account, ?string $from = null, ?string $to = null): array
    {
        $balance = '0.00';
        $opening = null;

        if ($from !== null) {
            $totals = JournalEntryLine::query()
                ->where('account_id', $account->id)
                ->whereHas('journalEntry', function (Builder $query) use ($from): void {
                    $query->whereDate('date', '<', $from);
                })
                ->selectRaw('COALESCE(SUM(debit), 0) as debit_total, COALESCE(SUM(credit), 0) as credit_total')
                ->first();

            $balance = AccountBalance::signed(
                (string) ($totals?->debit_total ?? '0'),
                (string) ($totals?->credit_total ?? '0'),
                $account->type,
            );
            $opening = $balance;
        }

        $lines = JournalEntryLine::query()
            ->where('account_id', $account->id)
            ->whereHas('journalEntry', function (Builder $query) use ($from, $to): void {
                if ($from !== null) {
                    $query->whereDate('date', '>=', $from);
                }

                if ($to !== null) {
                    $query->whereDate('date', '<=', $to);
                }
            })
            ->with(['journalEntry.journalable', 'party:id,name'])
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

            $balance = bcadd(
                $balance,
                AccountBalance::signed($debit, $credit, $account->type),
                2,
            );

            $rows[] = [
                'id' => $line->id,
                'date' => $entry->date->toDateString(),
                'type' => JournalReference::type($entry),
                'reference' => JournalReference::label($entry),
                'party' => $line->party?->name,
                'narration' => $line->narration ?? $entry->narration,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $balance,
            ];
        }

        return [
            'opening' => $opening,
            'rows' => $rows,
            'closing' => $balance,
        ];
    }
}
