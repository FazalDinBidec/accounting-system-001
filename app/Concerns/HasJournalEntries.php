<?php

namespace App\Concerns;

use App\Models\JournalEntry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * @mixin Model
 */
trait HasJournalEntries
{
    /**
     * @return MorphMany<JournalEntry, $this>
     */
    public function journalEntries(): MorphMany
    {
        return $this->morphMany(JournalEntry::class, 'journalable');
    }

    protected static function bootHasJournalEntries(): void
    {
        static::deleting(function (Model $model): void {
            $model->journalEntries()->get()->each(function (JournalEntry $entry): void {
                $entry->delete();
            });
        });
    }
}
