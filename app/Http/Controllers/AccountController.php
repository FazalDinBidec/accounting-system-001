<?php

namespace App\Http\Controllers;

use App\Enums\AccountType;
use App\Models\Account;
use App\Support\Toast;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('accounts/index', [
            'accounts' => Account::query()
                ->with('parent:id,name')
                ->latest()
                ->paginate(10)
                ->withQueryString(),
            'parents' => $this->parentOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Account::query()->create($this->validatedAttributes($request));

        Toast::success(__('Account created.'));

        return back();
    }

    public function update(Request $request, Account $account): RedirectResponse
    {
        if ($this->systemAccountBlocked($account)) {
            return back();
        }

        $account->update($this->validatedAttributes($request, $account));

        Toast::success(__('Account updated.'));

        return back();
    }

    public function toggleStatus(Account $account): RedirectResponse
    {
        if ($this->systemAccountBlocked($account)) {
            return back();
        }

        $account->update([
            'is_active' => ! $account->is_active,
        ]);

        Toast::success(__('Account status updated.'));

        return back();
    }

    public function destroy(Account $account): RedirectResponse
    {
        if ($this->systemAccountBlocked($account)) {
            return back();
        }

        if ($account->children()->exists()) {
            Toast::error(__('Delete child accounts first.'));

            return back();
        }

        if ($account->journalEntryLines()->exists()
            || $account->voucherLines()->exists()
            || $account->expenseLines()->exists()
            || $account->expensePaymentLines()->exists()) {
            Toast::error(__('This account is used on journals, vouchers, or expenses.'));

            return back();
        }

        $account->delete();

        Toast::success(__('Account deleted.'));

        return to_route('accounts.index');
    }

    /**
     * @return array{name: string, type: string, parent_id: int|null, is_active: bool}
     */
    private function validatedAttributes(Request $request, ?Account $account = null): array
    {
        $request->merge([
            'parent_id' => $request->filled('parent_id') ? $request->integer('parent_id') : null,
        ]);

        $parentIdRules = ['nullable', 'integer', Rule::exists(Account::class, 'id')];

        if ($account !== null) {
            $parentIdRules[] = Rule::notIn([$account->id]);
        }

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(AccountType::class)],
            'parent_id' => $parentIdRules,
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function parentOptions(): Collection
    {
        return Account::query()
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    private function systemAccountBlocked(Account $account): bool
    {
        if (! $account->is_system) {
            return false;
        }

        Toast::error(__('System accounts cannot be changed.'));

        return true;
    }
}
