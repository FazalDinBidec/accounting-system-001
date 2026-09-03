<?php

namespace App\Http\Controllers;

use App\Models\Party;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use App\Support\BatchNo;
use App\Support\DocumentJournal;
use App\Support\ProductBatchBook;
use App\Support\ProductStock;
use App\Support\Toast;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('purchases/index', [
            'purchases' => PurchaseOrder::query()
                ->with('party:id,name')
                ->latest()
                ->paginate(10)
                ->withQueryString(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('purchases/create', [
            'parties' => $this->partyOptions(),
            'products' => $this->productOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->persist(null, $this->validatedAttributes($request));

        Toast::success(__('Purchase created.'));

        return to_route('purchases.index');
    }

    public function edit(PurchaseOrder $purchaseOrder): Response
    {
        $purchaseOrder->load('items');

        return Inertia::render('purchases/edit', [
            'purchase' => $purchaseOrder,
            'parties' => $this->partyOptions($purchaseOrder->party_id),
            'products' => $this->productOptions(
                $purchaseOrder->items->pluck('product_id')->all(),
                $purchaseOrder,
            ),
        ]);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $this->persist($purchaseOrder, $this->validatedAttributes($request));

        Toast::success(__('Purchase updated.'));

        return to_route('purchases.index');
    }

    public function destroy(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        DB::transaction(function () use ($purchaseOrder): void {
            ProductBatchBook::revertPurchase($purchaseOrder);
            $purchaseOrder->delete();
        });

        Toast::success(__('Purchase deleted.'));

        return to_route('purchases.index');
    }

    /**
     * @return array{
     *     party_id: int,
     *     date: string,
     *     notes: string|null,
     *     other_charges: mixed,
     *     items: list<array{product_id: int, batch_no: string, quantity: mixed, unit_price: mixed}>
     * }
     */
    private function validatedAttributes(Request $request): array
    {
        $request->merge([
            'party_id' => $request->filled('party_id') ? $request->integer('party_id') : null,
            'other_charges' => $request->filled('other_charges') ? $request->input('other_charges') : '0',
        ]);

        $attributes = $request->validate([
            'party_id' => ['required', 'integer', Rule::exists(Party::class, 'id')],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'other_charges' => ['required', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', Rule::exists(Product::class, 'id')],
            'items.*.batch_no' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $seen = [];

        foreach ($attributes['items'] as $index => $item) {
            $key = $item['product_id'].'|'.BatchNo::normalize($item['batch_no']);

            if (isset($seen[$key])) {
                throw ValidationException::withMessages([
                    "items.{$index}.batch_no" => __('Duplicate batch for the same product on this purchase.'),
                ]);
            }

            $seen[$key] = true;
            $attributes['items'][$index]['batch_no'] = BatchNo::normalize($item['batch_no']);
        }

        return $attributes;
    }

    /**
     * @param  array{
     *     party_id: int,
     *     date: string,
     *     notes: string|null,
     *     other_charges: mixed,
     *     items: list<array{product_id: int, batch_no: string, quantity: mixed, unit_price: mixed}>
     * }  $attributes
     */
    private function persist(?PurchaseOrder $purchaseOrder, array $attributes): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder, $attributes): PurchaseOrder {
            if ($purchaseOrder !== null) {
                ProductBatchBook::revertPurchase($purchaseOrder);
            }

            $itemRows = [];
            $subTotal = '0.00';

            foreach ($attributes['items'] as $item) {
                $lineTotal = bcmul((string) $item['quantity'], (string) $item['unit_price'], 2);
                $subTotal = bcadd($subTotal, $lineTotal, 2);
                $itemRows[] = [
                    'product_id' => $item['product_id'],
                    'batch_no' => $item['batch_no'],
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

            if ($purchaseOrder === null) {
                $purchaseOrder = PurchaseOrder::query()->create([
                    ...$payload,
                    'number' => 'DRAFT',
                ]);
                $purchaseOrder->update([
                    'number' => 'PO-'.str_pad((string) $purchaseOrder->id, 5, '0', STR_PAD_LEFT),
                ]);
            } else {
                $purchaseOrder->update($payload);
                $purchaseOrder->items()->delete();
            }

            $purchaseOrder->items()->createMany($itemRows);
            $purchaseOrder->unsetRelation('items');
            ProductBatchBook::receiveFromPurchase($purchaseOrder);
            StockMovement::syncForPurchase($purchaseOrder);
            DocumentJournal::syncForPurchase($purchaseOrder);

            return $purchaseOrder;
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
    private function productOptions(array $includeProductIds = [], ?PurchaseOrder $excludeStockable = null): Collection
    {
        $products = Product::query()
            ->where(function (Builder $query) use ($includeProductIds): void {
                $query->where('is_active', true);

                if ($includeProductIds !== []) {
                    $query->orWhereIn('id', $includeProductIds);
                }
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        return ProductStock::withOnHand($products, $excludeStockable);
    }
}
