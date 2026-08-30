<?php

namespace App\Support;

use App\Enums\VoucherMethod;
use App\Enums\VoucherType;
use App\Models\Account;
use App\Models\Voucher;
use App\Models\VoucherLine;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class VoucherBook
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
    public function persist(?Voucher $voucher, array $attributes): Voucher
    {
        return DB::transaction(function () use ($voucher, $attributes): Voucher {
            $type = VoucherType::from($attributes['type']);
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

            $payload = [
                'type' => $type,
                'party_id' => $attributes['party_id'],
                'date' => $attributes['date'],
                'amount' => $total,
                'notes' => $attributes['notes'] ?? null,
            ];

            if ($voucher === null) {
                $voucher = Voucher::query()->create([
                    ...$payload,
                    'number' => 'DRAFT',
                ]);
                $prefix = $type === VoucherType::Receipt ? 'RCP-' : 'PAY-';
                $voucher->update([
                    'number' => $prefix.str_pad((string) $voucher->id, 5, '0', STR_PAD_LEFT),
                ]);
            } else {
                $voucher->update($payload);
                $voucher->lines()->delete();
            }

            $voucher->lines()->createMany($lineRows);
            $voucher->unsetRelation('lines');
            $voucher->load(['party', 'lines.account']);

            $this->syncJournal($voucher);

            return $voucher;
        });
    }

    private function syncJournal(Voucher $voucher): void
    {
        DocumentJournal::forget($voucher);

        if (bccomp((string) $voucher->amount, '0', 2) !== 1) {
            return;
        }

        $builder = JournalEntryBuilder::make()
            ->date($voucher->date)
            ->narration(($voucher->type === VoucherType::Receipt ? 'Receipt ' : 'Payment ').$voucher->number)
            ->journalable($voucher);

        $party = $voucher->party;

        if ($voucher->type === VoucherType::Receipt) {
            foreach ($voucher->lines as $line) {
                $builder->debit(
                    account: $line->account,
                    amount: $line->amount,
                    narration: $this->lineNarration($line),
                );
            }

            $builder->credit(
                account: SystemAccounts::partyReceivables(),
                amount: $voucher->amount,
                party: $party,
            );
        } else {
            $builder->debit(
                account: SystemAccounts::partyPayables(),
                amount: $voucher->amount,
                party: $party,
            );

            foreach ($voucher->lines as $line) {
                $builder->credit(
                    account: $line->account,
                    amount: $line->amount,
                    narration: $this->lineNarration($line),
                );
            }
        }

        $builder->post();
    }

    private function lineNarration(VoucherLine $line): ?string
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
