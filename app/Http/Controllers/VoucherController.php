<?php

namespace App\Http\Controllers;

use App\Enums\VoucherMethod;
use App\Enums\VoucherType;
use App\Models\Account;
use App\Models\Party;
use App\Models\Voucher;
use App\Models\VoucherLine;
use App\Support\PartyBalance;
use App\Support\SystemAccounts;
use App\Support\Toast;
use App\Support\VoucherBook;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VoucherController extends Controller
{
    public function __construct(private VoucherBook $voucherBook) {}

    public function index(Request $request): Response
    {
        $type = $request->string('type')->toString();

        return Inertia::render('vouchers/index', [
            'filters' => [
                'type' => in_array($type, [VoucherType::Receipt->value, VoucherType::Payment->value], true) ? $type : '',
            ],
            'vouchers' => Voucher::query()
                ->with(['party:id,name', 'lines.account:id,name'])
                ->when(
                    $type === VoucherType::Receipt->value || $type === VoucherType::Payment->value,
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
        return Inertia::render('vouchers/create', [
            'parties' => $this->partyOptions(),
            'cashAccounts' => $this->methodAccounts(VoucherMethod::Cash),
            'bankAccounts' => $this->methodAccounts(VoucherMethod::Bank),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->voucherBook->persist(null, $this->validatedAttributes($request));

        Toast::success(__('Voucher created.'));

        return to_route('vouchers.index');
    }

    public function edit(Voucher $voucher): Response
    {
        $voucher->load('lines');

        return Inertia::render('vouchers/edit', [
            'voucher' => $voucher,
            'parties' => $this->partyOptions($voucher->party_id),
            'cashAccounts' => $this->methodAccounts(
                VoucherMethod::Cash,
                $voucher->lines
                    ->filter(fn (VoucherLine $line): bool => $line->method === VoucherMethod::Cash)
                    ->pluck('account_id')
                    ->all(),
            ),
            'bankAccounts' => $this->methodAccounts(
                VoucherMethod::Bank,
                $voucher->lines
                    ->filter(fn (VoucherLine $line): bool => $line->method === VoucherMethod::Bank)
                    ->pluck('account_id')
                    ->all(),
            ),
        ]);
    }

    public function update(Request $request, Voucher $voucher): RedirectResponse
    {
        $request->merge([
            'type' => $voucher->type->value,
        ]);

        $this->voucherBook->persist($voucher, $this->validatedAttributes($request));

        Toast::success(__('Voucher updated.'));

        return to_route('vouchers.index');
    }

    public function destroy(Voucher $voucher): RedirectResponse
    {
        $voucher->delete();

        Toast::success(__('Voucher deleted.'));

        return to_route('vouchers.index');
    }

    public function partyBalance(Request $request, Party $party): JsonResponse
    {
        $excludeId = $request->integer('exclude_voucher_id');
        $exclude = $excludeId > 0 ? Voucher::query()->find($excludeId) : null;

        return response()->json(PartyBalance::for($party, $exclude));
    }

    /**
     * @return array{
     *     type: string,
     *     party_id: int,
     *     date: string,
     *     notes: string|null,
     *     lines: list<array{
     *         method: string,
     *         account_id: int,
     *         amount: mixed,
     *         bank_name: string|null,
     *         account_no: string|null,
     *         holder_name: string|null,
     *         instrument_no: string|null
     *     }>
     * }
     */
    private function validatedAttributes(Request $request): array
    {
        $request->merge([
            'party_id' => $request->filled('party_id') ? $request->integer('party_id') : null,
        ]);

        $attributes = $request->validate([
            'type' => ['required', Rule::enum(VoucherType::class)],
            'party_id' => ['required', 'integer', Rule::exists(Party::class, 'id')],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.method' => ['required', Rule::enum(VoucherMethod::class)],
            'lines.*.account_id' => ['required', 'integer', Rule::exists(Account::class, 'id')],
            'lines.*.amount' => ['required', 'numeric', 'gt:0'],
            'lines.*.bank_name' => ['nullable', 'string', 'max:255'],
            'lines.*.account_no' => ['nullable', 'string', 'max:255'],
            'lines.*.holder_name' => ['nullable', 'string', 'max:255'],
            'lines.*.instrument_no' => ['nullable', 'string', 'max:255'],
        ]);

        return $attributes;
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
     * @param  list<int>  $includeAccountIds
     * @return Collection<int, Account>
     */
    private function methodAccounts(VoucherMethod $method, array $includeAccountIds = []): Collection
    {
        return SystemAccounts::childrenForMethod($method, $includeAccountIds);
    }
}
