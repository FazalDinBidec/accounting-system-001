<?php

namespace App\Models;

use Database\Factories\JournalEntryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $number
 * @property Carbon $date
 * @property string|null $narration
 * @property string|null $journalable_type
 * @property int|null $journalable_id
 * @property bool $is_closing
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Model|null $journalable
 * @property-read Collection<int, JournalEntryLine> $lines
 */
#[Fillable(['number', 'date', 'narration', 'journalable_type', 'journalable_id', 'is_closing'])]
class JournalEntry extends Model
{
    /** @use HasFactory<JournalEntryFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_closing' => 'boolean',
        ];
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function journalable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return HasMany<JournalEntryLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class);
    }
}
