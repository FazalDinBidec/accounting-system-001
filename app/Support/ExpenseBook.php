<?php

namespace App\Support;

use App\Enums\AccountType;
use App\Enums\VoucherMethod;
use App\Models\Account;
use App\Models\Expense;
use App\Models\ExpensePaymentLine;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ExpenseBook
{
    /**
     * @param  array{
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
     * }  $attributes
     */
    public function persist(?Expense $expense, array $attributes): Expense
    {
        return DB::transaction(function () use ($expense, $attributes): Expense {
            PeriodGuard::assertDateIsPostable($attributes['date']);

            if ($expense !== null) {
                PeriodGuard::assertDateIsPostable($expense->date->toDateString());
            }

            $expenseLineRows = [];
            $expenseTotal = '0.00';

            foreach ($attributes['expense_lines'] as $index => $line) {
                $account = Account::query()->findOrFail($line['account_id']);

                if (! self::isSelectableExpenseAccount($account)) {
                    throw ValidationException::withMessages([
                        "expense_lines.{$index}.account_id" => __('Select a valid expense account.'),
                    ]);
                }

                $amount = bcadd((string) $line['amount'], '0', 2);
                $expenseTotal = bcadd($expenseTotal, $amount, 2);

                $expenseLineRows[] = [
                    'account_id' => $account->id,
                    'amount' => $amount,
                    'narration' => filled($line['narration'] ?? null) ? $line['narration'] : null,
                ];
            }

            $paymentLineRows = [];
            $paymentTotal = '0.00';

            foreach ($attributes['payment_lines'] as $index => $line) {
                $method = VoucherMethod::from($line['method']);
                $account = Account::query()->findOrFail($line['account_id']);

                if (! SystemAccounts::accountBelongsToMethod($account, $method)) {
                    throw ValidationException::withMessages([
                        "payment_lines.{$index}.account_id" => $method === VoucherMethod::Cash
                            ? __('Select an account under Cash.')
                            : __('Select an account under Bank.'),
                    ]);
                }

                $amount = bcadd((string) $line['amount'], '0', 2);
                $paymentTotal = bcadd($paymentTotal, $amount, 2);

                $isBank = $method === VoucherMethod::Bank;

                $paymentLineRows[] = [
                    'method' => $method,
                    'account_id' => $account->id,
                    'amount' => $amount,
                    'bank_name' => $isBank ? ($line['bank_name'] ?? null) : null,
                    'account_no' => $isBank ? ($line['account_no'] ?? null) : null,
                    'holder_name' => $isBank ? ($line['holder_name'] ?? null) : null,
                    'instrument_no' => $isBank ? ($line['instrument_no'] ?? null) : null,
                ];
            }

            if (bccomp($expenseTotal, $paymentTotal, 2) !== 0) {
                throw ValidationException::withMessages([
                    'payment_lines' => __('Expense and payment totals must match.'),
                ]);
            }

            $payload = [
                'date' => $attributes['date'],
                'amount' => $expenseTotal,
                'notes' => $attributes['notes'] ?? null,
            ];

            if ($expense === null) {
                $expense = Expense::query()->create([
                    ...$payload,
                    'number' => 'DRAFT',
                ]);
                $expense->update([
                    'number' => 'EXP-'.str_pad((string) $expense->id, 5, '0', STR_PAD_LEFT),
                ]);
            } else {
                $expense->update($payload);
                $expense->expenseLines()->delete();
                $expense->paymentLines()->delete();
            }

            $expense->expenseLines()->createMany($expenseLineRows);
            $expense->paymentLines()->createMany($paymentLineRows);
            $expense->unsetRelation('expenseLines');
            $expense->unsetRelation('paymentLines');
            $expense->load(['expenseLines.account', 'paymentLines.account']);

            $this->syncJournal($expense);

            return $expense;
        });
    }

    public static function isSelectableExpenseAccount(Account $account): bool
    {
        if ($account->type !== AccountType::Expense) {
            return false;
        }

        if ($account->name === SystemAccounts::CostOfGoodsSold) {
            return false;
        }

        if ($account->name === SystemAccounts::GeneralExpense) {
            return true;
        }

        $generalExpense = SystemAccounts::generalExpense();

        return $account->parent_id === $generalExpense->id;
    }

    private function syncJournal(Expense $expense): void
    {
        DocumentJournal::forget($expense);

        if (bccomp((string) $expense->amount, '0', 2) !== 1) {
            return;
        }

        $builder = JournalEntryBuilder::make()
            ->date($expense->date)
            ->narration('Expense '.$expense->number)
            ->journalable($expense);

        foreach ($expense->expenseLines as $line) {
            $builder->debit(
                account: $line->account,
                amount: $line->amount,
                narration: $line->narration,
            );
        }

        foreach ($expense->paymentLines as $line) {
            $builder->credit(
                account: $line->account,
                amount: $line->amount,
                narration: $this->paymentLineNarration($line),
            );
        }

        $builder->post();
    }

    private function paymentLineNarration(ExpensePaymentLine $line): ?string
    {
        if ($line->method !== VoucherMethod::Bank) {
            return null;
        }

        $parts = array_filter([
            $line->bank_name,
            $line->instrument_no,
        ]);

        return $parts === [] ? null : implode(' / ', $parts);
    }
}
