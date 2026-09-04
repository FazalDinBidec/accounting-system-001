<?php

namespace App\Http\Controllers;

use App\Enums\OpeningType;
use App\Models\Party;
use App\Models\PartyOpening;
use App\Support\OpeningBook;
use App\Support\PeriodGuard;
use App\Support\Toast;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OpeningController extends Controller
{
    public function __construct(private OpeningBook $openingBook) {}

    public function index(Request $request): Response
    {
        $type = $request->string('type')->toString();

        return Inertia::render('openings/index', [
            'filters' => [
                'type' => in_array($type, [OpeningType::Receivable->value, OpeningType::Payable->value], true) ? $type : '',
            ],
            'openings' => PartyOpening::query()
                ->with('party:id,name')
                ->when(
                    $type === OpeningType::Receivable->value || $type === OpeningType::Payable->value,
                    function (Builder $query) use ($type): void {
                        $query->where('type', $type);
                    },
                )
                ->latest()
                ->paginate(10)
                ->withQueryString(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('openings/create', [
            'parties' => $this->partyOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->openingBook->persist(null, $this->validatedAttributes($request));

        Toast::success(__('Opening balance created.'));

        return to_route('openings.index');
    }

    public function edit(PartyOpening $partyOpening): Response
    {
        return Inertia::render('openings/edit', [
            'opening' => $partyOpening->load('party:id,name'),
            'parties' => $this->partyOptions($partyOpening->party_id),
        ]);
    }

    public function update(Request $request, PartyOpening $partyOpening): RedirectResponse
    {
        $request->merge([
            'type' => $partyOpening->type->value,
        ]);

        $this->openingBook->persist($partyOpening, $this->validatedAttributes($request));

        Toast::success(__('Opening balance updated.'));

        return to_route('openings.index');
    }

    public function destroy(PartyOpening $partyOpening): RedirectResponse
    {
        PeriodGuard::assertDateIsPostable($partyOpening->date->toDateString());
        $partyOpening->delete();

        Toast::success(__('Opening balance deleted.'));

        return to_route('openings.index');
    }

    /**
     * @return array{
     *     type: string,
     *     party_id: int,
     *     date: string,
     *     amount: mixed,
     *     notes: string|null
     * }
     */
    private function validatedAttributes(Request $request): array
    {
        $request->merge([
            'party_id' => $request->filled('party_id') ? $request->integer('party_id') : null,
        ]);

        return $request->validate([
            'type' => ['required', Rule::enum(OpeningType::class)],
            'party_id' => ['required', 'integer', Rule::exists(Party::class, 'id')],
            'date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'notes' => ['nullable', 'string'],
        ]);
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
}
