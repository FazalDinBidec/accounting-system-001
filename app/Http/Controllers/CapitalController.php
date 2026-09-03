<?php

namespace App\Http\Controllers;

use App\Enums\CapitalTransactionType;
use App\Enums\VoucherMethod;
use App\Models\Account;
use App\Models\CapitalTransaction;
use App\Models\CapitalTransactionLine;
use App\Models\Party;
use App\Support\CapitalBalance;
use App\Support\CapitalBook;
use App\Support\PeriodGuard;
use App\Support\SystemAccounts;
use App\Support\Toast;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CapitalController extends Controller
{
    public function __construct(private CapitalBook $capitalBook) {}

    public function index(Request $request): Response
    {
        $type = $request->string('type')->toString();

        return Inertia::render('capital/index', [
            'filters' => [
                'type' => in_array($type, [CapitalTransactionType::Introduction->value, CapitalTransactionType::Withdrawal->value], true) ? $type : '',
            ],
            'transactions' => CapitalTransaction::query()
                ->with(['party:id,name', 'lines.account:id,name'])
                ->when(
                    $type === CapitalTransactionType::Introduction->value || $type === CapitalTransactionType::Withdrawal->value,
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
        return Inertia::render('capital/create', [
            'partners' => $this->partnerOptions(),
            'cashAccounts' => $this->methodAccounts(VoucherMethod::Cash),
            'bankAccounts' => $this->methodAccounts(VoucherMethod::Bank),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->capitalBook->persist(null, $this->validatedAttributes($request));

        Toast::success(__('Capital transaction created.'));

        return to_route('capital.index');
    }

    public function edit(CapitalTransaction $capitalTransaction): Response
    {
        $capitalTransaction->load('lines');

        return Inertia::render('capital/edit', [
            'transaction' => $capitalTransaction,
            'partners' => $this->partnerOptions($capitalTransaction->party_id),
            'cashAccounts' => $this->methodAccounts(
                VoucherMethod::Cash,
                $capitalTransaction->lines
                    ->filter(fn (CapitalTransactionLine $line): bool => $line->method === VoucherMethod::Cash)
                    ->pluck('account_id')
                    ->all(),
            ),
            'bankAccounts' => $this->methodAccounts(
                VoucherMethod::Bank,
                $capitalTransaction->lines
                    ->filter(fn (CapitalTransactionLine $line): bool => $line->method === VoucherMethod::Bank)
                    ->pluck('account_id')
                    ->all(),
            ),
        ]);
    }

    public function update(Request $request, CapitalTransaction $capitalTransaction): RedirectResponse
    {
        $request->merge([
            'type' => $capitalTransaction->type->value,
        ]);

        $this->capitalBook->persist($capitalTransaction, $this->validatedAttributes($request));

        Toast::success(__('Capital transaction updated.'));

        return to_route('capital.index');
    }

    public function destroy(CapitalTransaction $capitalTransaction): RedirectResponse
    {
        PeriodGuard::assertDateIsPostable($capitalTransaction->date->toDateString());
        $capitalTransaction->delete();

        Toast::success(__('Capital transaction deleted.'));

        return to_route('capital.index');
    }

    public function partnerBalance(Request $request, Party $party): JsonResponse
    {
        $excludeId = $request->integer('exclude_transaction_id');
        $exclude = $excludeId > 0 ? CapitalTransaction::query()->find($excludeId) : null;
        $balance = CapitalBalance::for($party);

        if ($exclude !== null && $exclude->exists && $exclude->type === CapitalTransactionType::Withdrawal) {
            $balance = bcadd($balance, (string) $exclude->amount, 2);
        }

        return response()->json([
            'balance' => $balance,
        ]);
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

        return $request->validate([
            'type' => ['required', Rule::enum(CapitalTransactionType::class)],
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
    }

    /**
     * @return Collection<int, Party>
     */
    private function partnerOptions(?int $includePartyId = null): Collection
    {
        return Party::query()
            ->where(function (Builder $query) use ($includePartyId): void {
                $query->where(function (Builder $inner): void {
                    $inner->where('is_active', true)->where('is_partner', true);
                });

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
