<?php

namespace App\Support;

use App\Models\SaleOrderItem;
use App\Models\SaleReturnItem;

final class SaleReturnQuantities
{
    public static function returnedForItem(int $saleOrderItemId, ?int $excludeSaleReturnId = null): string
    {
        $query = SaleReturnItem::query()->where('sale_order_item_id', $saleOrderItemId);

        if ($excludeSaleReturnId !== null) {
            $query->where('sale_return_id', '!=', $excludeSaleReturnId);
        }

        return bcadd((string) $query->sum('quantity'), '0', 2);
    }

    public static function remainingForItem(SaleOrderItem $item, ?int $excludeSaleReturnId = null): string
    {
        $sold = bcadd((string) $item->quantity, '0', 2);
        $returned = self::returnedForItem($item->id, $excludeSaleReturnId);
        $remaining = bcsub($sold, $returned, 2);

        return bccomp($remaining, '0', 2) === 1 ? $remaining : '0.00';
    }
}
