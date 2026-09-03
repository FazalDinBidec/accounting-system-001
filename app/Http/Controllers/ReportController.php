<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\FiscalYear;
use App\Models\Party;
use App\Models\Product;
use App\Reports\BalanceSheetReport;
use App\Reports\CapitalBalanceReport;
use App\Reports\GeneralLedgerReport;
use App\Reports\PartyLedgerReport;
use App\Reports\ProfitAndLossReport;
use App\Reports\StockBatchReport;
use App\Reports\TrialBalanceReport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function partyLedger(Request $request): Response
    {
        $validated = $request->validate([
            'party_id' => ['nullable', 'integer', 'exists:parties,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $party = isset($validated['party_id'])
            ? Party::query()->find($validated['party_id'])
            : null;

        return Inertia::render('reports/party-ledger', [
            'parties' => Party::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'party_id' => $party?->id,
                'from' => $validated['from'] ?? null,
                'to' => $validated['to'] ?? null,
            ],
            'party' => $party !== null ? [
                'id' => $party->id,
                'name' => $party->name,
            ] : null,
            'report' => $party !== null
                ? PartyLedgerReport::for(
                    $party,
                    $validated['from'] ?? null,
                    $validated['to'] ?? null,
                )
                : null,
        ]);
    }

    public function generalLedger(Request $request): Response
    {
        $validated = $request->validate([
            'account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $account = isset($validated['account_id'])
            ? Account::query()->find($validated['account_id'])
            : null;

        return Inertia::render('reports/general-ledger', [
            'accounts' => Account::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'type']),
            'filters' => [
                'account_id' => $account?->id,
                'from' => $validated['from'] ?? null,
                'to' => $validated['to'] ?? null,
            ],
            'account' => $account !== null ? [
                'id' => $account->id,
                'name' => $account->name,
                'type' => $account->type->value,
            ] : null,
            'report' => $account !== null
                ? GeneralLedgerReport::for(
                    $account,
                    $validated['from'] ?? null,
                    $validated['to'] ?? null,
                )
                : null,
        ]);
    }

    public function trialBalance(Request $request): Response
    {
        $validated = $request->validate([
            'to' => ['nullable', 'date'],
        ]);

        $to = $validated['to'] ?? null;

        return Inertia::render('reports/trial-balance', [
            'filters' => [
                'to' => $to,
            ],
            'report' => TrialBalanceReport::for($to),
        ]);
    }

    public function profitAndLoss(Request $request): Response
    {
        $defaults = $this->fiscalYearDefaults();

        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = $validated['from'] ?? $defaults['from'];
        $to = $validated['to'] ?? $defaults['to'];

        return Inertia::render('reports/profit-and-loss', [
            'filters' => [
                'from' => $from,
                'to' => $to,
            ],
            'report' => ProfitAndLossReport::for($from, $to, excludeClosing: true),
        ]);
    }

    public function balanceSheet(Request $request): Response
    {
        $defaults = $this->fiscalYearDefaults();

        $validated = $request->validate([
            'to' => ['nullable', 'date'],
        ]);

        $to = $validated['to'] ?? $defaults['to'];

        return Inertia::render('reports/balance-sheet', [
            'filters' => [
                'to' => $to,
            ],
            'report' => BalanceSheetReport::for($to),
        ]);
    }

    public function capitalSummary(Request $request): Response
    {
        $defaults = $this->fiscalYearDefaults();

        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = $validated['from'] ?? $defaults['from'];
        $to = $validated['to'] ?? $defaults['to'];

        return Inertia::render('reports/capital-summary', [
            'filters' => [
                'from' => $from,
                'to' => $to,
            ],
            'report' => CapitalBalanceReport::for($from, $to),
        ]);
    }

    public function stockReport(Request $request): Response
    {
        $request->merge([
            'product_id' => $request->filled('product_id') ? $request->integer('product_id') : null,
            'party_id' => $request->filled('party_id') ? $request->integer('party_id') : null,
        ]);

        $validated = $request->validate([
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'party_id' => ['nullable', 'integer', 'exists:parties,id'],
        ]);

        $productId = isset($validated['product_id']) ? (int) $validated['product_id'] : null;
        $partyId = isset($validated['party_id']) ? (int) $validated['party_id'] : null;

        return Inertia::render('reports/stock-report', [
            'products' => Product::query()->orderBy('name')->get(['id', 'name']),
            'parties' => Party::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'product_id' => $productId,
                'party_id' => $partyId,
            ],
            'report' => StockBatchReport::for($productId, $partyId),
        ]);
    }

    /**
     * @return array{from: string|null, to: string|null}
     */
    private function fiscalYearDefaults(): array
    {
        $fiscalYear = FiscalYear::query()->active()->first();

        if ($fiscalYear === null) {
            return [
                'from' => null,
                'to' => null,
            ];
        }

        return [
            'from' => $fiscalYear->start_date->toDateString(),
            'to' => today()->toDateString(),
        ];
    }
}
