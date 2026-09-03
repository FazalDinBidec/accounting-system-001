<?php

namespace App\Support;

use App\Enums\CapitalTransactionType;
use App\Enums\VoucherMethod;
use App\Models\Account;
use App\Models\CapitalTransaction;
use App\Models\CapitalTransactionLine;
use App\Models\Party;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CapitalBook
{
    /**
     * @param  array{
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
     * }  $attributes
     */
    public function persist(?CapitalTransaction $transaction, array $attributes): CapitalTransaction
    {
        return DB::transaction(function () use ($transaction, $attributes): CapitalTransaction {
            PeriodGuard::assertDateIsPostable($attributes['date']);

            $type = CapitalTransactionType::from($attributes['type']);
            $party = Party::query()->findOrFail($attributes['party_id']);

            if (! $party->is_partner) {
                throw ValidationException::withMessages([
                    'party_id' => __('Select a partner.'),
                ]);
            }

            $lineRows = [];
            $total = '0.00';

            foreach ($attributes['lines'] as $index => $line) {
                $method = VoucherMethod::from($line['method']);
                $account = Account::query()->findOrFail($line['account_id']);

                if (! SystemAccounts::accountBelongsToMethod($account, $method)) {
                    throw ValidationException::withMessages([
                        "lines.{$index}.account_id" => $method === VoucherMethod::Cash
                            ? __('Select an account under Cash.')
                            : __('Select an account under Bank.'),
                    ]);
                }

                $amount = bcadd((string) $line['amount'], '0', 2);
                $total = bcadd($total, $amount, 2);

                $isBank = $method === VoucherMethod::Bank;

                $lineRows[] = [
                    'method' => $method,
                    'account_id' => $account->id,
                    'amount' => $amount,
                    'bank_name' => $isBank ? ($line['bank_name'] ?? null) : null,
                    'account_no' => $isBank ? ($line['account_no'] ?? null) : null,
                    'holder_name' => $isBank ? ($line['holder_name'] ?? null) : null,
                    'instrument_no' => $isBank ? ($line['instrument_no'] ?? null) : null,
                ];
            }

            if ($type === CapitalTransactionType::Withdrawal) {
                $exclude = $transaction;
                $balance = CapitalBalance::for($party);

                if ($exclude !== null && $exclude->exists) {
                    $balance = bcadd($balance, (string) $exclude->amount, 2);
                }

                if (bccomp($total, $balance, 2) === 1) {
                    throw ValidationException::withMessages([
                        'lines.0.amount' => __('Payout exceeds partner capital balance.'),
                    ]);
                }
            }

            $payload = [
                'type' => $type,
                'party_id' => $party->id,
                'date' => $attributes['date'],
                'amount' => $total,
                'notes' => $attributes['notes'] ?? null,
            ];

            if ($transaction === null) {
                $transaction = CapitalTransaction::query()->create([
                    ...$payload,
                    'number' => 'DRAFT',
                ]);
                $prefix = $type === CapitalTransactionType::Introduction ? 'CIN-' : 'CPY-';
                $transaction->update([
                    'number' => $prefix.str_pad((string) $transaction->id, 5, '0', STR_PAD_LEFT),
                ]);
            } else {
                PeriodGuard::assertDateIsPostable($transaction->date->toDateString());
                $transaction->update($payload);
                $transaction->lines()->delete();
            }

            $transaction->lines()->createMany($lineRows);
            $transaction->unsetRelation('lines');
            $transaction->load(['party', 'lines.account']);

            $this->syncJournal($transaction);

            return $transaction;
        });
    }

    private function syncJournal(CapitalTransaction $transaction): void
    {
        DocumentJournal::forget($transaction);

        if (bccomp((string) $transaction->amount, '0', 2) !== 1) {
            return;
        }

        $builder = JournalEntryBuilder::make()
            ->date($transaction->date)
            ->narration(
                ($transaction->type === CapitalTransactionType::Introduction ? 'Capital intro ' : 'Capital payout ')
                .$transaction->number,
            )
            ->journalable($transaction);

        $party = $transaction->party;
        $capitalAccount = SystemAccounts::partnersCapital();

        if ($transaction->type === CapitalTransactionType::Introduction) {
            foreach ($transaction->lines as $line) {
                $builder->debit(
                    account: $line->account,
                    amount: $line->amount,
                    narration: $this->lineNarration($line),
                );
            }

            $builder->credit(
                account: $capitalAccount,
                amount: $transaction->amount,
                party: $party,
            );
        } else {
            $builder->debit(
                account: $capitalAccount,
                amount: $transaction->amount,
                party: $party,
            );

            foreach ($transaction->lines as $line) {
                $builder->credit(
                    account: $line->account,
                    amount: $line->amount,
                    narration: $this->lineNarration($line),
                );
            }
        }

        $builder->post();
    }

    private function lineNarration(CapitalTransactionLine $line): ?string
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
