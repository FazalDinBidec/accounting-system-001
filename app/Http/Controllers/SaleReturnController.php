<?php

namespace App\Http\Controllers;

use App\Models\SaleOrder;
use App\Models\SaleOrderItem;
use App\Models\SaleReturn;
use App\Models\StockMovement;
use App\Support\SaleReturnQuantities;
use App\Support\Toast;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SaleReturnController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('sale-returns/index', [
            'saleReturns' => SaleReturn::query()
                ->with(['saleOrder:id,number,party_id', 'saleOrder.party:id,name'])
                ->latest()
                ->paginate(10)
                ->withQueryString(),
        ]);
    }

    public function create(Request $request): Response
    {
        $saleId = $request->integer('sale_id') ?: (int) old('sale_id', 0);
        $sale = $saleId > 0
            ? SaleOrder::query()
                ->with(['party:id,name', 'items.product:id,name'])
                ->find($saleId)
            : null;

        return Inertia::render('sale-returns/create', [
            'sale' => $sale === null ? null : $this->salePayload($sale),
        ]);
    }

    public function searchSales(Request $request): JsonResponse
    {
        $query = $request->string('q')->trim()->toString();

        $sales = SaleOrder::query()
            ->with('party:id,name')
            ->when($query !== '', function (Builder $builder) use ($query): void {
                $builder->where(function (Builder $builder) use ($query): void {
                    $builder->where('number', 'like', '%'.$query.'%')
                        ->orWhereHas('party', function (Builder $builder) use ($query): void {
                            $builder->where('name', 'like', '%'.$query.'%');
                        });
                });
            })
            ->latest()
            ->limit(15)
            ->get(['id', 'number', 'party_id']);

        return response()->json(
            $sales->map(fn (SaleOrder $sale): array => [
                'id' => $sale->id,
                'number' => $sale->number,
                'party_name' => $sale->party?->name ?? '—',
            ])->values(),
        );
    }

    public function lookup(SaleOrder $saleOrder): JsonResponse
    {
        return response()->json($this->salePayload($saleOrder));
    }

    public function store(Request $request): RedirectResponse
    {
        $this->persist(null, $this->validatedAttributes($request));

        Toast::success(__('Sale return created.'));

        return to_route('sale-returns.index');
    }

    public function edit(SaleReturn $saleReturn): Response
    {
        $saleReturn->load(['items', 'saleOrder.party:id,name', 'saleOrder.items.product:id,name']);

        return Inertia::render('sale-returns/edit', [
            'saleReturn' => $saleReturn,
            'sale' => $this->salePayload($saleReturn->saleOrder, $saleReturn),
        ]);
    }

    public function update(Request $request, SaleReturn $saleReturn): RedirectResponse
    {
        $this->persist($saleReturn, $this->validatedAttributes($request, $saleReturn));

        Toast::success(__('Sale return updated.'));

        return to_route('sale-returns.index');
    }

    public function destroy(SaleReturn $saleReturn): RedirectResponse
    {
        $saleReturn->delete();

        Toast::success(__('Sale return deleted.'));

        return to_route('sale-returns.index');
    }

    /**
     * @return array{
     *     sale_id: int,
     *     date: string,
     *     notes: string|null,
     *     items: list<array{sale_order_item_id: int, quantity: mixed}>
     * }
     */
    private function validatedAttributes(Request $request, ?SaleReturn $saleReturn = null): array
    {
        $request->merge([
            'sale_id' => $request->filled('sale_id') ? $request->integer('sale_id') : null,
        ]);

        $attributes = $request->validate([
            'sale_id' => ['required', 'integer', Rule::exists(SaleOrder::class, 'id')],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sale_order_item_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists(SaleOrderItem::class, 'id')->where('sale_id', $request->integer('sale_id')),
            ],
            'items.*.quantity' => ['required', 'numeric', 'min:0'],
        ]);

        $selected = [];

        foreach ($attributes['items'] as $index => $item) {
            if (bccomp((string) $item['quantity'], '0', 2) !== 1) {
                continue;
            }

            $saleOrderItem = SaleOrderItem::query()->findOrFail($item['sale_order_item_id']);
            $remaining = SaleReturnQuantities::remainingForItem($saleOrderItem, $saleReturn?->id);

            if (bccomp((string) $item['quantity'], $remaining, 2) === 1) {
                throw ValidationException::withMessages([
                    "items.{$index}.quantity" => __('Cannot return more than :qty.', ['qty' => $remaining]),
                ]);
            }

            $selected[] = $item;
        }

        if ($selected === []) {
            throw ValidationException::withMessages([
                'items' => __('Select at least one item to return.'),
            ]);
        }

        $attributes['items'] = $selected;

        return $attributes;
    }

    /**
     * @param  array{
     *     sale_id: int,
     *     date: string,
     *     notes: string|null,
     *     items: list<array{sale_order_item_id: int, quantity: mixed}>
     * }  $attributes
     */
    private function persist(?SaleReturn $saleReturn, array $attributes): SaleReturn
    {
        return DB::transaction(function () use ($saleReturn, $attributes): SaleReturn {
            $itemRows = [];
            $subTotal = '0.00';

            foreach ($attributes['items'] as $item) {
                $saleOrderItem = SaleOrderItem::query()->findOrFail($item['sale_order_item_id']);
                $lineTotal = bcmul((string) $item['quantity'], (string) $saleOrderItem->unit_price, 2);
                $subTotal = bcadd($subTotal, $lineTotal, 2);
                $itemRows[] = [
                    'sale_order_item_id' => $saleOrderItem->id,
                    'product_id' => $saleOrderItem->product_id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $saleOrderItem->unit_price,
                    'total_amount' => $lineTotal,
                ];
            }

            $payload = [
                'sale_id' => $attributes['sale_id'],
                'date' => $attributes['date'],
                'sub_total' => $subTotal,
                'total_amount' => $subTotal,
                'notes' => $attributes['notes'] ?? null,
            ];

            if ($saleReturn === null) {
                $saleReturn = SaleReturn::query()->create([
                    ...$payload,
                    'number' => 'DRAFT',
                ]);
                $saleReturn->update([
                    'number' => 'SR-'.str_pad((string) $saleReturn->id, 5, '0', STR_PAD_LEFT),
                ]);
            } else {
                $saleReturn->update($payload);
                $saleReturn->items()->delete();
            }

            $saleReturn->items()->createMany($itemRows);
            $saleReturn->unsetRelation('items');
            StockMovement::syncForOrder($saleReturn);

            return $saleReturn;
        });
    }

    /**
     * @return array{
     *     id: int,
     *     number: string,
     *     date: string,
     *     party: array{id: int, name: string}|null,
     *     items: list<array{
     *         sale_order_item_id: int,
     *         product_id: int,
     *         product_name: string,
     *         sold_qty: string,
     *         returned_qty: string,
     *         remaining_qty: string,
     *         unit_price: string
     *     }>
     * }
     */
    private function salePayload(SaleOrder $saleOrder, ?SaleReturn $exclude = null): array
    {
        $saleOrder->loadMissing(['party:id,name', 'items.product:id,name']);

        return [
            'id' => $saleOrder->id,
            'number' => $saleOrder->number,
            'date' => $saleOrder->date->toDateString(),
            'party' => $saleOrder->party === null ? null : [
                'id' => $saleOrder->party->id,
                'name' => $saleOrder->party->name,
            ],
            'items' => $saleOrder->items->map(function (SaleOrderItem $item) use ($exclude): array {
                $returned = SaleReturnQuantities::returnedForItem($item->id, $exclude?->id);
                $remaining = SaleReturnQuantities::remainingForItem($item, $exclude?->id);

                return [
                    'sale_order_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product?->name ?? '—',
                    'sold_qty' => bcadd((string) $item->quantity, '0', 2),
                    'returned_qty' => $returned,
                    'remaining_qty' => $remaining,
                    'unit_price' => $item->unit_price,
                ];
            })->values()->all(),
        ];
    }
}
