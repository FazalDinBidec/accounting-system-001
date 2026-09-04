<?php

namespace App\Models;

use Database\Factories\PartyFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $phone
 * @property string|null $address
 * @property bool $is_active
 * @property bool $is_partner
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, JournalEntryLine> $journalEntryLines
 * @property-read Collection<int, Voucher> $vouchers
 * @property-read Collection<int, PurchaseOrder> $purchaseOrders
 * @property-read Collection<int, SaleOrder> $saleOrders
 * @property-read Collection<int, PartyOpening> $partyOpenings
 */
#[Fillable(['name', 'phone', 'address', 'is_active', 'is_partner'])]
class Party extends Model
{
    /** @use HasFactory<PartyFactory> */
    use HasFactory;

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_active' => true,
        'is_partner' => false,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_partner' => 'boolean',
        ];
    }

    /**
     * @return HasMany<JournalEntryLine, $this>
     */
    public function journalEntryLines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class);
    }

    /**
     * @return HasMany<PurchaseOrder, $this>
     */
    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }

    /**
     * @return HasMany<Voucher, $this>
     */
    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    /**
     * @return HasMany<CapitalTransaction, $this>
     */
    public function capitalTransactions(): HasMany
    {
        return $this->hasMany(CapitalTransaction::class);
    }

    /**
     * @return HasMany<SaleOrder, $this>
     */
    public function saleOrders(): HasMany
    {
        return $this->hasMany(SaleOrder::class);
    }

    /**
     * @return HasMany<PartyOpening, $this>
     */
    public function partyOpenings(): HasMany
    {
        return $this->hasMany(PartyOpening::class);
    }
}
