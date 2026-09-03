<?php

namespace App\Http\Controllers;

use App\Models\FiscalPeriod;
use App\Models\FiscalYear;
use App\Support\FiscalPeriodCloser;
use App\Support\FiscalYearCloser;
use App\Support\FiscalYearGenerator;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FiscalYearController extends Controller
{
    public function __construct(
        private FiscalPeriodCloser $periodCloser,
        private FiscalYearCloser $yearCloser,
    ) {}

    public function index(): Response
    {
        return Inertia::render('fiscal-years/index', [
            'fiscalYears' => FiscalYear::query()
                ->with(['periods.allocations.party:id,name'])
                ->orderByDesc('start_date')
                ->get(),
            'suggested' => FiscalYearGenerator::suggestDates(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ]);

        if (FiscalYear::query()->where('is_active', true)->open()->exists()) {
            Toast::error(__('Close or deactivate the current fiscal year before creating another active year.'));

            return back();
        }

        FiscalYearGenerator::create(
            name: $validated['name'],
            startDate: $validated['start_date'],
            endDate: $validated['end_date'],
            activate: true,
        );

        Toast::success(__('Fiscal year created.'));

        return back();
    }

    public function activate(FiscalYear $fiscalYear): RedirectResponse
    {
        if ($fiscalYear->is_closed) {
            Toast::error(__('Closed fiscal years cannot be activated.'));

            return back();
        }

        FiscalYear::query()->where('is_active', true)->update(['is_active' => false]);
        $fiscalYear->update(['is_active' => true]);

        Toast::success(__('Fiscal year activated.'));

        return back();
    }

    public function closePeriod(Request $request, FiscalPeriod $fiscalPeriod): RedirectResponse
    {
        $validated = $request->validate([
            'close_date' => ['required', 'date'],
        ]);

        $this->periodCloser->close($fiscalPeriod, $validated['close_date']);

        Toast::success(__('Fiscal period closed.'));

        return back();
    }

    public function closeYear(FiscalYear $fiscalYear): RedirectResponse
    {
        $this->yearCloser->close($fiscalYear);

        Toast::success(__('Fiscal year closed. A new fiscal year has been opened.'));

        return back();
    }
}
