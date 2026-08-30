<?php

namespace App\Support;

use App\Enums\VoucherMethod;
use App\Models\Account;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;

final class SystemAccounts
{
    public const Cash = 'Cash';

    public const Bank = 'Bank';

    public const PartyReceivables = 'Party Receivables';

    public const PartyPayables = 'Party Payables';

    public const Inventory = 'Inventory';

    public const Sales = 'Sales';

    public const SalesReturn = 'Sales Return';

    public static function named(string $name): Account
    {
        $account = Account::query()->where('name', $name)->first();

        if ($account === null) {
            throw new InvalidArgumentException("System account [{$name}] was not found.");
        }

        return $account;
    }

    public static function cash(): Account
    {
        return self::named(self::Cash);
    }

    public static function bank(): Account
    {
        return self::named(self::Bank);
    }

    public static function partyReceivables(): Account
    {
        return self::named(self::PartyReceivables);
    }

    public static function partyPayables(): Account
    {
        return self::named(self::PartyPayables);
    }

    public static function inventory(): Account
    {
        return self::named(self::Inventory);
    }

    public static function sales(): Account
    {
        return self::named(self::Sales);
    }

    public static function salesReturn(): Account
    {
        return self::named(self::SalesReturn);
    }

    public static function parentForMethod(VoucherMethod $method): Account
    {
        return $method === VoucherMethod::Cash ? self::cash() : self::bank();
    }

    /**
     * @param  list<int>  $includeAccountIds
     * @return Collection<int, Account>
     */
    public static function childrenForMethod(VoucherMethod $method, array $includeAccountIds = []): Collection
    {
        $parent = self::parentForMethod($method);

        return Account::query()
            ->where('parent_id', $parent->id)
            ->where(function ($query) use ($includeAccountIds): void {
                $query->where('is_active', true);

                if ($includeAccountIds !== []) {
                    $query->orWhereIn('id', $includeAccountIds);
                }
            })
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id', 'is_active']);
    }

    public static function accountBelongsToMethod(Account $account, VoucherMethod $method): bool
    {
        return $account->parent_id === self::parentForMethod($method)->id;
    }
}
