<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function partyLedger(): Response
    {
        return Inertia::render('reports/party-ledger');
    }

    public function generalLedger(): Response
    {
        return Inertia::render('reports/general-ledger');
    }

    public function trialBalance(): Response
    {
        return Inertia::render('reports/trial-balance');
    }
}
