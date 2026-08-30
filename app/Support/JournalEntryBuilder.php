<?php

namespace App\Support;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\Party;
use Carbon\CarbonInterface;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class JournalEntryBuilder
{
    private ?CarbonInterface $date = null;

    private ?string $narration = null;

    private ?Model $journalable = null;

    /**
     * @var list<array{account_id: int, party_id: int|null, debit: string, credit: string, narration: string|null}>
     */
    private array $lines = [];

    public static function make(): self
    {
        $builder = new self;
        $builder->date = today();

        return $builder;
    }

    public function date(DateTimeInterface|string $date): self
    {
        $this->date = Carbon::parse($date);

        return $this;
    }

    public function narration(string $narration): self
    {
        $this->narration = $narration;

        return $this;
    }

    public function journalable(Model $journalable): self
    {
        $this->journalable = $journalable;

        return $this;
    }

    public function debitCredit(
        Account $debit,
        Account $credit,
        int|float|string $amount,
        ?Party $party = null,
        ?Party $debitParty = null,
        ?Party $creditParty = null,
        ?string $narration = null,
        ?string $debitNarration = null,
        ?string $creditNarration = null,
    ): self {
        $this->debit(
            account: $debit,
            amount: $amount,
            party: $debitParty ?? $party,
            narration: $debitNarration ?? $narration,
        );
        $this->credit(
            account: $credit,
            amount: $amount,
            party: $creditParty ?? $party,
            narration: $creditNarration ?? $narration,
        );

        return $this;
    }

    public function debit(
        Account $account,
        int|float|string $amount,
        ?Party $party = null,
        ?string $narration = null,
    ): self {
        $this->lines[] = [
            'account_id' => $this->accountId($account),
            'party_id' => $party?->id,
            'debit' => $this->money($amount),
            'credit' => '0.00',
            'narration' => $narration,
        ];

        return $this;
    }

    public function credit(
        Account $account,
        int|float|string $amount,
        ?Party $party = null,
        ?string $narration = null,
    ): self {
        $this->lines[] = [
            'account_id' => $this->accountId($account),
            'party_id' => $party?->id,
            'debit' => '0.00',
            'credit' => $this->money($amount),
            'narration' => $narration,
        ];

        return $this;
    }

    public function post(): JournalEntry
    {
        $this->assertCanPost();

        return DB::transaction(function (): JournalEntry {
            $entry = new JournalEntry([
                'number' => now(),
                'date' => $this->date,
                'narration' => $this->narration,
            ]);

            if ($this->journalable !== null) {
                $entry->journalable()->associate($this->journalable);
            }

            $entry->save();
            $entry->lines()->createMany($this->lines);

            return $entry->load(['lines', 'journalable']);
        });
    }

    private function accountId(Account $account): int
    {
        if (! $account->is_active) {
            throw new InvalidArgumentException("Account [{$account->name}] is inactive.");
        }

        return $account->id;
    }

    private function money(int|float|string $amount): string
    {
        $normalized = bcadd((string) $amount, '0', 2);

        if (bccomp($normalized, '0', 2) !== 1) {
            throw new InvalidArgumentException('Amount must be greater than zero.');
        }

        return $normalized;
    }

    private function assertCanPost(): void
    {
        if ($this->lines === []) {
            throw new InvalidArgumentException('Add at least one debit and one credit line.');
        }

        $debitTotal = '0.00';
        $creditTotal = '0.00';

        foreach ($this->lines as $line) {
            $debitTotal = bcadd($debitTotal, $line['debit'], 2);
            $creditTotal = bcadd($creditTotal, $line['credit'], 2);
        }

        if (bccomp($debitTotal, '0', 2) !== 1 || bccomp($creditTotal, '0', 2) !== 1) {
            throw new InvalidArgumentException('Add at least one debit and one credit line.');
        }

        if (bccomp($debitTotal, $creditTotal, 2) !== 0) {
            throw new InvalidArgumentException("Debits [{$debitTotal}] must equal credits [{$creditTotal}].");
        }
    }
}
