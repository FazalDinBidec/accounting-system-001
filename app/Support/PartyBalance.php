<?php

namespace App\Support;

use App\Models\JournalEntryLine;
use App\Models\Party;
use App\Models\Voucher;
use Illuminate\Database\Eloquent\Builder;

final class PartyBalance
{
    /**
     * @return array{receivable: string, payable: string}
     */
    public static function for(Party $party, ?Voucher $excludeVoucher = null): array
    {
        $receivableAccountId = SystemAccounts::partyReceivables()->id;
        $payableAccountId = SystemAccounts::partyPayables()->id;

        $query = JournalEntryLine::query()
            ->where('party_id', $party->id)
            ->whereIn('account_id', [$receivableAccountId, $payableAccountId]);

        if ($excludeVoucher !== null && $excludeVoucher->exists) {
            $query->where(function (Builder $builder) use ($excludeVoucher): void {
                $builder->whereDoesntHave('journalEntry', function (Builder $entry) use ($excludeVoucher): void {
                    $entry->where('journalable_type', $excludeVoucher->getMorphClass())
                        ->where('journalable_id', $excludeVoucher->getKey());
                });
            });
        }

        $totals = $query
            ->selectRaw('account_id, COALESCE(SUM(debit), 0) as debit_total, COALESCE(SUM(credit), 0) as credit_total')
            ->groupBy('account_id')
            ->get()
            ->keyBy('account_id');

        $receivableRow = $totals->get($receivableAccountId);
        $payableRow = $totals->get($payableAccountId);

        $receivableDebit = bcadd((string) ($receivableRow?->debit_total ?? '0'), '0', 2);
        $receivableCredit = bcadd((string) ($receivableRow?->credit_total ?? '0'), '0', 2);
        $payableDebit = bcadd((string) ($payableRow?->debit_total ?? '0'), '0', 2);
        $payableCredit = bcadd((string) ($payableRow?->credit_total ?? '0'), '0', 2);

        return [
            'receivable' => bcsub($receivableDebit, $receivableCredit, 2),
            'payable' => bcsub($payableCredit, $payableDebit, 2),
        ];
    }
}
