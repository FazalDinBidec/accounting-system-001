<?php

namespace App\Http\Controllers;

use App\Models\Party;
use App\Support\CapitalBalance;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartyController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('parties/index', [
            'parties' => Party::query()
                ->latest()
                ->paginate(10)
                ->through(function (Party $party): array {
                    return [
                        ...$party->toArray(),
                        'capital_balance' => $party->is_partner
                            ? CapitalBalance::for($party)
                            : null,
                    ];
                })
                ->withQueryString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Party::query()->create($this->validatedAttributes($request));

        Toast::success(__('Party created.'));

        return back();
    }

    public function update(Request $request, Party $party): RedirectResponse
    {
        $party->update($this->validatedAttributes($request));

        Toast::success(__('Party updated.'));

        return back();
    }

    public function toggleStatus(Party $party): RedirectResponse
    {
        $party->update([
            'is_active' => ! $party->is_active,
        ]);

        Toast::success(__('Party status updated.'));

        return back();
    }

    public function destroy(Party $party): RedirectResponse
    {
        if (
            $party->saleOrders()->exists()
            || $party->purchaseOrders()->exists()
            || $party->vouchers()->exists()
            || $party->capitalTransactions()->exists()
            || $party->journalEntryLines()->exists()
            || $party->partyOpenings()->exists()
        ) {
            Toast::error(__('This party is used on documents or journals.'));

            return back();
        }

        $party->delete();

        Toast::success(__('Party deleted.'));

        return to_route('parties.index');
    }

    /**
     * @return array{name: string, phone: string|null, address: string|null, is_active: bool, is_partner: bool}
     */
    private function validatedAttributes(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'is_partner' => ['required', 'boolean'],
        ]);
    }
}
