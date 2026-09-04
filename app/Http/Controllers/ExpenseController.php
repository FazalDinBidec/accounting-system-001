<?php

namespace App\Http\Controllers;

use App\Enums\AccountType;
use App\Enums\VoucherMethod;
use App\Models\Account;
use App\Models\Expense;
use App\Models\ExpensePaymentLine;
use App\Support\ExpenseBook;
use App\Support\PeriodGuard;
use App\Support\SystemAccounts;
use App\Support\Toast;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function __construct(private ExpenseBook $expenseBook) {}

    public function index(): Response
    {
        return Inertia::render('expenses/index', [
            'expenses' => Expense::query()
                ->with([
                    'expenseLines.account:id,name',
                    'paymentLines.account:id,name',
                ])
                ->latest()
                ->paginate(10)
                ->withQueryString(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('expenses/create', [
            'expenseAccounts' => $this->expenseAccountOptions(),
            'cashAccounts' => $this->methodAccounts(VoucherMethod::Cash),
            'bankAccounts' => $this->methodAccounts(VoucherMethod::Bank),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->expenseBook->persist(null, $this->validatedAttributes($request));

        Toast::success(__('Expense created.'));

        return to_route('expenses.index');
    }

    public function edit(Expense $expense): Response
    {
        $expense->load(['expenseLines', 'paymentLines']);

        return Inertia::render('expenses/edit', [
            'expense' => $expense,
            'expenseAccounts' => $this->expenseAccountOptions(
                $expense->expenseLines->pluck('account_id')->all(),
            ),
            'cashAccounts' => $this->methodAccounts(
                VoucherMethod::Cash,
                $expense->paymentLines
                    ->filter(fn (ExpensePaymentLine $line): bool => $line->method === VoucherMethod::Cash)
                    ->pluck('account_id')
                    ->all(),
            ),
            'bankAccounts' => $this->methodAccounts(
                VoucherMethod::Bank,
                $expense->paymentLines
                    ->filter(fn (ExpensePaymentLine $line): bool => $line->method === VoucherMethod::Bank)
                    ->pluck('account_id')
                    ->all(),
            ),
        ]);
    }

    public function update(Request $request, Expense $expense): RedirectResponse
    {
        $this->expenseBook->persist($expense, $this->validatedAttributes($request));

        Toast::success(__('Expense updated.'));

        return to_route('expenses.index');
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        PeriodGuard::assertDateIsPostable($expense->date->toDateString());
        $expense->delete();

        Toast::success(__('Expense deleted.'));

        return to_route('expenses.index');
    }

    /**
     * @return array{
     *     date: string,
     *     notes: string|null,
     *     expense_lines: list<array{
     *         account_id: int,
     *         amount: mixed,
     *         narration: string|null
     *     }>,
     *     payment_lines: list<array{
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
        return $request->validate([
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'expense_lines' => ['required', 'array', 'min:1'],
            'expense_lines.*.account_id' => ['required', 'integer', Rule::exists(Account::class, 'id')],
            'expense_lines.*.amount' => ['required', 'numeric', 'gt:0'],
            'expense_lines.*.narration' => ['nullable', 'string', 'max:255'],
            'payment_lines' => ['required', 'array', 'min:1'],
            'payment_lines.*.method' => ['required', Rule::enum(VoucherMethod::class)],
            'payment_lines.*.account_id' => ['required', 'integer', Rule::exists(Account::class, 'id')],
            'payment_lines.*.amount' => ['required', 'numeric', 'gt:0'],
            'payment_lines.*.bank_name' => ['nullable', 'string', 'max:255'],
            'payment_lines.*.account_no' => ['nullable', 'string', 'max:255'],
            'payment_lines.*.holder_name' => ['nullable', 'string', 'max:255'],
            'payment_lines.*.instrument_no' => ['nullable', 'string', 'max:255'],
        ]);
    }

    /**
     * @param  list<int>  $includeAccountIds
     * @return Collection<int, Account>
     */
    private function expenseAccountOptions(array $includeAccountIds = []): Collection
    {
        $generalExpenseId = SystemAccounts::generalExpense()->id;

        return Account::query()
            ->where('type', AccountType::Expense)
            ->where(function (Builder $query) use ($generalExpenseId, $includeAccountIds): void {
                $query->where('parent_id', $generalExpenseId)
                    ->orWhere('name', SystemAccounts::GeneralExpense);

                if ($includeAccountIds !== []) {
                    $query->orWhereIn('id', $includeAccountIds);
                }
            })
            ->where(function (Builder $query) use ($includeAccountIds): void {
                $query->where('is_active', true);

                if ($includeAccountIds !== []) {
                    $query->orWhereIn('id', $includeAccountIds);
                }
            })
            ->where('name', '!=', SystemAccounts::CostOfGoodsSold)
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
