<?php

namespace App\Http\Controllers;

use App\Models\Party;
use App\Models\Product;
use App\Models\SaleOrder;
use App\Toast;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SaleOrderController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('sales/index', [
            'sales' => SaleOrder::query()
                ->with('party:id,name')
                ->latest()
                ->paginate(10)
                ->withQueryString(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('sales/create', [
            'parties' => $this->partyOptions(),
            'products' => $this->productOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->persist(null, $this->validatedAttributes($request));

        Toast::success(__('Sale created.'));

        return to_route('sales.index');
    }

    public function edit(SaleOrder $saleOrder): Response
    {
        $saleOrder->load('items');

        return Inertia::render('sales/edit', [
            'sale' => $saleOrder,
            'parties' => $this->partyOptions($saleOrder->party_id),
            'products' => $this->productOptions($saleOrder->items->pluck('product_id')->all()),
        ]);
    }

    public function update(Request $request, SaleOrder $saleOrder): RedirectResponse
    {
        $this->persist($saleOrder, $this->validatedAttributes($request));

        Toast::success(__('Sale updated.'));

        return to_route('sales.index');
    }

    public function destroy(SaleOrder $saleOrder): RedirectResponse
    {
        $saleOrder->delete();

        Toast::success(__('Sale deleted.'));

        return to_route('sales.index');
    }

    /**
     * @return array{
     *     party_id: int,
     *     date: string,
     *     notes: string|null,
     *     other_charges: mixed,
     *     items: list<array{product_id: int, quantity: mixed, unit_price: mixed}>
     * }
     */
    private function validatedAttributes(Request $request): array
    {
        $request->merge([
            'party_id' => $request->filled('party_id') ? $request->integer('party_id') : null,
            'other_charges' => $request->filled('other_charges') ? $request->input('other_charges') : '0',
        ]);

        return $request->validate([
            'party_id' => ['required', 'integer', Rule::exists(Party::class, 'id')],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'other_charges' => ['required', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', Rule::exists(Product::class, 'id')],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);
    }

    /**
     * @param  array{
     *     party_id: int,
     *     date: string,
     *     notes: string|null,
     *     other_charges: mixed,
     *     items: list<array{product_id: int, quantity: mixed, unit_price: mixed}>
     * }  $attributes
     */
    private function persist(?SaleOrder $saleOrder, array $attributes): SaleOrder
    {
        return DB::transaction(function () use ($saleOrder, $attributes): SaleOrder {
            $itemRows = [];
            $subTotal = '0.00';

            foreach ($attributes['items'] as $item) {
                $lineTotal = bcmul((string) $item['quantity'], (string) $item['unit_price'], 2);
                $subTotal = bcadd($subTotal, $lineTotal, 2);
                $itemRows[] = [
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_amount' => $lineTotal,
                ];
            }

            $otherCharges = bcadd((string) $attributes['other_charges'], '0', 2);
            $payload = [
                'party_id' => $attributes['party_id'],
                'date' => $attributes['date'],
                'sub_total' => $subTotal,
                'other_charges' => $otherCharges,
                'total_amount' => bcadd($subTotal, $otherCharges, 2),
                'notes' => $attributes['notes'] ?? null,
            ];

            if ($saleOrder === null) {
                $saleOrder = SaleOrder::query()->create([
                    ...$payload,
                    'number' => 'DRAFT',
                ]);
                $saleOrder->update([
                    'number' => 'SO-'.str_pad((string) $saleOrder->id, 5, '0', STR_PAD_LEFT),
                ]);
            } else {
                $saleOrder->update($payload);
                $saleOrder->items()->delete();
            }

            $saleOrder->items()->createMany($itemRows);

            return $saleOrder;
        });
    }

    /**
     * @return Collection<int, Party>
     */
    private function partyOptions(?int $includePartyId = null): Collection
    {
        return Party::query()
            ->where(function (Builder $query) use ($includePartyId): void {
                $query->where('is_active', true);

                if ($includePartyId !== null) {
                    $query->orWhere('id', $includePartyId);
                }
            })
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * @param  list<int>  $includeProductIds
     * @return Collection<int, Product>
     */
    private function productOptions(array $includeProductIds = []): Collection
    {
        return Product::query()
            ->where(function (Builder $query) use ($includeProductIds): void {
                $query->where('is_active', true);

                if ($includeProductIds !== []) {
                    $query->orWhereIn('id', $includeProductIds);
                }
            })
            ->orderBy('name')
            ->get(['id', 'name']);
    }
}
