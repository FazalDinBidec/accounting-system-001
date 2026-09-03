<?php

namespace App\Support;

use App\Enums\AccountType;
use App\Models\JournalEntryLine;
use App\Models\Party;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

final class CapitalBalance
{
    public static function for(Party $party, Carbon|string|null $asOf = null): string
    {
        $accountId = SystemAccounts::partnersCapital()->id;

        $query = JournalEntryLine::query()
            ->where('party_id', $party->id)
            ->where('account_id', $accountId);

        if ($asOf !== null) {
            $query->whereHas('journalEntry', function (Builder $entryQuery) use ($asOf): void {
                $entryQuery->whereDate('date', '<=', Carbon::parse($asOf)->toDateString());
            });
        }

        $totals = $query
            ->selectRaw('COALESCE(SUM(debit), 0) as debit_total, COALESCE(SUM(credit), 0) as credit_total')
            ->first();

        return AccountBalance::signed(
            (string) ($totals?->debit_total ?? '0'),
            (string) ($totals?->credit_total ?? '0'),
            AccountType::Equity,
        );
    }

    public static function total(Carbon|string|null $asOf = null): string
    {
        $total = '0.00';

        foreach (self::partners() as $partner) {
            $total = bcadd($total, self::for($partner, $asOf), 2);
        }

        return $total;
    }

    public static function ratio(Party $party, Carbon|string|null $asOf = null): string
    {
        $total = self::total($asOf);

        if (bccomp($total, '0', 2) !== 1) {
            return '0.00';
        }

        $balance = self::for($party, $asOf);

        return bcdiv($balance, $total, 4);
    }

    /**
     * @return Collection<int, Party>
     */
    public static function partners(): Collection
    {
        return Party::query()
            ->where('is_partner', true)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'is_partner']);
    }
}
