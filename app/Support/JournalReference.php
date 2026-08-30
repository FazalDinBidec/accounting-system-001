<?php

namespace App\Support;

use App\Models\JournalEntry;
use App\Models\PurchaseOrder;
use App\Models\SaleOrder;
use App\Models\SaleReturn;
use App\Models\Voucher;

final class JournalReference
{
    public static function label(JournalEntry $entry): string
    {
        $journalable = $entry->journalable;

        if ($journalable instanceof SaleOrder
            || $journalable instanceof PurchaseOrder
            || $journalable instanceof SaleReturn
            || $journalable instanceof Voucher) {
            return $journalable->number;
        }

        if ($entry->narration !== null && $entry->narration !== '') {
            return $entry->narration;
        }

        return (string) $entry->number;
    }

    public static function type(JournalEntry $entry): string
    {
        $journalable = $entry->journalable;

        if ($journalable instanceof SaleOrder) {
            return 'Sale';
        }

        if ($journalable instanceof PurchaseOrder) {
            return 'Purchase';
        }

        if ($journalable instanceof SaleReturn) {
            return 'Sale Return';
        }

        if ($journalable instanceof Voucher) {
            return $journalable->type->value === 'receipt' ? 'Receipt' : 'Payment';
        }

        return 'Journal';
    }
}
