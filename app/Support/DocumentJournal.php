<?php

namespace App\Support;

use App\Models\JournalEntry;
use App\Models\PurchaseOrder;
use App\Models\SaleOrder;
use App\Models\SaleReturn;
use Illuminate\Database\Eloquent\Model;

final class DocumentJournal
{
    public static function forget(Model $document): void
    {
        $document->journalEntries()->get()->each(function (JournalEntry $entry): void {
            $entry->delete();
        });
    }

    public static function syncForSale(SaleOrder $saleOrder): void
    {
        self::forget($saleOrder);

        if (! self::hasAmount($saleOrder->total_amount)) {
            return;
        }

        $saleOrder->loadMissing('party');

        JournalEntryBuilder::make()
            ->date($saleOrder->date)
            ->narration('Sale '.$saleOrder->number)
            ->journalable($saleOrder)
            ->debit(
                account: SystemAccounts::partyReceivables(),
                amount: $saleOrder->total_amount,
                party: $saleOrder->party,
            )
            ->credit(
                account: SystemAccounts::sales(),
                amount: $saleOrder->total_amount,
            )
            ->post();
    }

    public static function syncForPurchase(PurchaseOrder $purchaseOrder): void
    {
        self::forget($purchaseOrder);

        if (! self::hasAmount($purchaseOrder->total_amount)) {
            return;
        }

        $purchaseOrder->loadMissing('party');

        JournalEntryBuilder::make()
            ->date($purchaseOrder->date)
            ->narration('Purchase '.$purchaseOrder->number)
            ->journalable($purchaseOrder)
            ->debit(
                account: SystemAccounts::inventory(),
                amount: $purchaseOrder->total_amount,
            )
            ->credit(
                account: SystemAccounts::partyPayables(),
                amount: $purchaseOrder->total_amount,
                party: $purchaseOrder->party,
            )
            ->post();
    }

    public static function syncForSaleReturn(SaleReturn $saleReturn): void
    {
        self::forget($saleReturn);

        if (! self::hasAmount($saleReturn->total_amount)) {
            return;
        }

        $saleReturn->loadMissing('saleOrder.party');

        JournalEntryBuilder::make()
            ->date($saleReturn->date)
            ->narration('Sale return '.$saleReturn->number)
            ->journalable($saleReturn)
            ->debit(
                account: SystemAccounts::salesReturn(),
                amount: $saleReturn->total_amount,
            )
            ->credit(
                account: SystemAccounts::partyReceivables(),
                amount: $saleReturn->total_amount,
                party: $saleReturn->saleOrder->party,
            )
            ->post();
    }

    private static function hasAmount(string $amount): bool
    {
        return bccomp($amount, '0', 2) === 1;
    }
}
