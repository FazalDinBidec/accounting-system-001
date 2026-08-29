<?php

namespace App\Support;

use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\SaleOrder;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class ProductStock
{
    /**
     * @return LengthAwarePaginator<int, array{id: int, name: string, purchased: string, sold: string, on_hand: string}>
     */
    public static function summaries(): LengthAwarePaginator
    {
        $productsTable = (new Product)->getTable();
        $purchase = StockMovementType::Purchase->value;
        $sale = StockMovementType::Sale->value;

        $totals = StockMovement::query()
            ->select('product_id')
            ->selectRaw('SUM(CASE WHEN type = ? THEN quantity ELSE 0 END) as purchased', [$purchase])
            ->selectRaw('SUM(CASE WHEN type = ? THEN quantity ELSE 0 END) as sold', [$sale])
            ->groupBy('product_id');

        return Product::query()
            ->select([
                "{$productsTable}.id",
                "{$productsTable}.name",
                DB::raw('COALESCE(stock_totals.purchased, 0) as purchased'),
                DB::raw('COALESCE(stock_totals.sold, 0) as sold'),
            ])
            ->leftJoinSub($totals, 'stock_totals', 'stock_totals.product_id', '=', "{$productsTable}.id")
            ->orderBy("{$productsTable}.name")
            ->paginate(10)
            ->withQueryString()
            ->through(function (Product $product): array {
                $purchased = bcadd((string) $product->getAttribute('purchased'), '0', 2);
                $sold = bcadd((string) $product->getAttribute('sold'), '0', 2);

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'purchased' => $purchased,
                    'sold' => $sold,
                    'on_hand' => bcsub($purchased, $sold, 2),
                ];
            });
    }

    /**
     * @return array<int, string>
     */
    public static function onHandByProductId(?Model $excludeStockable = null): array
    {
        $query = StockMovement::query()
            ->select('product_id')
            ->selectRaw('SUM(CASE WHEN type = ? THEN quantity ELSE 0 END) as purchased', [StockMovementType::Purchase->value])
            ->selectRaw('SUM(CASE WHEN type = ? THEN quantity ELSE 0 END) as sold', [StockMovementType::Sale->value])
            ->groupBy('product_id');

        if ($excludeStockable !== null) {
            $query->whereNot(function (Builder $query) use ($excludeStockable): void {
                $query->where('stockable_type', $excludeStockable->getMorphClass())
                    ->where('stockable_id', $excludeStockable->getKey());
            });
        }

        return $query
            ->get()
            ->mapWithKeys(function (StockMovement $row): array {
                $purchased = bcadd((string) $row->getAttribute('purchased'), '0', 2);
                $sold = bcadd((string) $row->getAttribute('sold'), '0', 2);

                return [
                    (int) $row->product_id => bcsub($purchased, $sold, 2),
                ];
            })
            ->all();
    }

    /**
     * @param  Collection<int, Product>  $products
     * @return Collection<int, Product>
     */
    public static function withOnHand(Collection $products, ?Model $excludeStockable = null): Collection
    {
        $onHand = self::onHandByProductId($excludeStockable);

        return $products->each(function (Product $product) use ($onHand): void {
            $product->setAttribute('on_hand', $onHand[$product->id] ?? '0.00');
        });
    }

    /**
     * @return list<array{id: int, date: string, type: string, number: string, quantity_in: string, quantity_out: string, balance: string}>
     */
    public static function history(Product $product): array
    {
        $movements = StockMovement::query()
            ->where('product_id', $product->id)
            ->with('stockable')
            ->orderBy('date')
            ->orderBy('id')
            ->get();

        $balance = '0.00';
        $rows = [];

        foreach ($movements as $movement) {
            $quantity = bcadd((string) $movement->quantity, '0', 2);
            $isPurchase = $movement->type === StockMovementType::Purchase;

            if ($isPurchase) {
                $balance = bcadd($balance, $quantity, 2);
                $quantityIn = $quantity;
                $quantityOut = '0.00';
            } else {
                $balance = bcsub($balance, $quantity, 2);
                $quantityIn = '0.00';
                $quantityOut = $quantity;
            }

            $stockable = $movement->stockable;
            $number = $stockable instanceof PurchaseOrder || $stockable instanceof SaleOrder
                ? $stockable->number
                : '—';

            $rows[] = [
                'id' => $movement->id,
                'date' => $movement->date->toDateString(),
                'type' => $movement->type->name,
                'number' => $number,
                'quantity_in' => $quantityIn,
                'quantity_out' => $quantityOut,
                'balance' => $balance,
            ];
        }

        return $rows;
    }
}
