<?php

namespace App\Support;

use App\Enums\OpeningType;
use App\Models\PartyOpening;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class OpeningBook
{
    /**
     * @param  array{
     *     type: string,
     *     party_id: int,
     *     date: string,
     *     amount: mixed,
     *     notes: string|null
     * }  $attributes
     */
    public function persist(?PartyOpening $opening, array $attributes): PartyOpening
    {
        return DB::transaction(function () use ($opening, $attributes): PartyOpening {
            PeriodGuard::assertDateIsPostable($attributes['date']);

            if ($opening !== null) {
                PeriodGuard::assertDateIsPostable($opening->date->toDateString());
            }

            $type = OpeningType::from($attributes['type']);
            $amount = bcadd((string) $attributes['amount'], '0', 2);

            if (bccomp($amount, '0', 2) !== 1) {
                throw ValidationException::withMessages([
                    'amount' => __('Amount must be greater than zero.'),
                ]);
            }

            $this->assertUniquePartyType(
                partyId: (int) $attributes['party_id'],
                type: $type,
                exceptId: $opening?->id,
            );

            $payload = [
                'type' => $type,
                'party_id' => $attributes['party_id'],
                'date' => $attributes['date'],
                'amount' => $amount,
                'notes' => $attributes['notes'] ?? null,
            ];

            if ($opening === null) {
                $opening = PartyOpening::query()->create([
                    ...$payload,
                    'number' => 'DRAFT',
                ]);
                $prefix = $type === OpeningType::Receivable ? 'OPR-' : 'OPP-';
                $opening->update([
                    'number' => $prefix.str_pad((string) $opening->id, 5, '0', STR_PAD_LEFT),
                ]);
            } else {
                $opening->update($payload);
            }

            $opening->load('party');

            $this->syncJournal($opening);

            return $opening;
        });
    }

    private function assertUniquePartyType(int $partyId, OpeningType $type, ?int $exceptId): void
    {
        $exists = PartyOpening::query()
            ->where('party_id', $partyId)
            ->where('type', $type)
            ->when($exceptId !== null, fn ($query) => $query->whereKeyNot($exceptId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'party_id' => $type === OpeningType::Receivable
                    ? __('This party already has a receivable opening balance.')
                    : __('This party already has a payable opening balance.'),
            ]);
        }
    }

    private function syncJournal(PartyOpening $opening): void
    {
        DocumentJournal::forget($opening);

        if (bccomp((string) $opening->amount, '0', 2) !== 1) {
            return;
        }

        $builder = JournalEntryBuilder::make()
            ->date($opening->date)
            ->narration('Opening '.$opening->number)
            ->journalable($opening);

        $party = $opening->party;
        $equityAccount = SystemAccounts::openingBalanceEquity();

        if ($opening->type === OpeningType::Receivable) {
            $builder->debit(
                account: SystemAccounts::partyReceivables(),
                amount: $opening->amount,
                party: $party,
            )->credit(
                account: $equityAccount,
                amount: $opening->amount,
            );
        } else {
            $builder->debit(
                account: $equityAccount,
                amount: $opening->amount,
            )->credit(
                account: SystemAccounts::partyPayables(),
                amount: $opening->amount,
                party: $party,
            );
        }

        $builder->post();
    }
}
