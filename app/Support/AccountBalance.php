<?php

namespace App\Support;

use App\Enums\AccountType;

final class AccountBalance
{
    public static function isDebitNormal(AccountType $type): bool
    {
        return in_array($type, [AccountType::Asset, AccountType::Expense], true);
    }

    public static function signed(string $debit, string $credit, AccountType $type): string
    {
        $debit = bcadd($debit, '0', 2);
        $credit = bcadd($credit, '0', 2);

        if (self::isDebitNormal($type)) {
            return bcsub($debit, $credit, 2);
        }

        return bcsub($credit, $debit, 2);
    }

    /**
     * @return array{debit: string, credit: string}
     */
    public static function trialColumns(string $signedBalance, AccountType $type): array
    {
        if (bccomp($signedBalance, '0', 2) === 0) {
            return [
                'debit' => '0.00',
                'credit' => '0.00',
            ];
        }

        $isPositive = bccomp($signedBalance, '0', 2) === 1;
        $amount = ltrim($signedBalance, '-');
        $isDebitNormal = self::isDebitNormal($type);
        $showDebit = ($isDebitNormal && $isPositive) || (! $isDebitNormal && ! $isPositive);

        return [
            'debit' => $showDebit ? $amount : '0.00',
            'credit' => $showDebit ? '0.00' : $amount,
        ];
    }
}
