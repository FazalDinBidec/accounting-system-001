<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CapitalController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\FiscalYearController;
use App\Http\Controllers\PartyController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleOrderController;
use App\Http\Controllers\SaleReturnController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\VoucherController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('categories')
        ->name('categories.')
        ->controller(CategoryController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::patch('/{category}/toggle-status', 'toggleStatus')->name('toggleStatus');
            Route::put('/{category}', 'update')->name('update');
            Route::delete('/{category}', 'destroy')->name('destroy');
        });

    Route::prefix('products')
        ->name('products.')
        ->controller(ProductController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::patch('/{product}/toggle-status', 'toggleStatus')->name('toggleStatus');
            Route::put('/{product}', 'update')->name('update');
            Route::delete('/{product}', 'destroy')->name('destroy');
        });

    Route::prefix('purchases')
        ->name('purchases.')
        ->controller(PurchaseOrderController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/create', 'create')->name('create');
            Route::post('/', 'store')->name('store');
            Route::get('/{purchaseOrder}/edit', 'edit')->name('edit');
            Route::put('/{purchaseOrder}', 'update')->name('update');
            Route::delete('/{purchaseOrder}', 'destroy')->name('destroy');
        });

    Route::prefix('sales')
        ->name('sales.')
        ->controller(SaleOrderController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/create', 'create')->name('create');
            Route::get('/suggest-batches', 'suggestBatches')->name('suggestBatches');
            Route::post('/', 'store')->name('store');
            Route::get('/{saleOrder}/edit', 'edit')->name('edit');
            Route::put('/{saleOrder}', 'update')->name('update');
            Route::delete('/{saleOrder}', 'destroy')->name('destroy');
        });

    Route::prefix('sale-returns')
        ->name('sale-returns.')
        ->controller(SaleReturnController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/create', 'create')->name('create');
            Route::get('/search-sales', 'searchSales')->name('searchSales');
            Route::get('/lookup/{saleOrder}', 'lookup')->name('lookup');
            Route::post('/', 'store')->name('store');
            Route::get('/{saleReturn}/edit', 'edit')->name('edit');
            Route::put('/{saleReturn}', 'update')->name('update');
            Route::delete('/{saleReturn}', 'destroy')->name('destroy');
        });

    Route::prefix('vouchers')
        ->name('vouchers.')
        ->controller(VoucherController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/create', 'create')->name('create');
            Route::get('/party-balance/{party}', 'partyBalance')->name('partyBalance');
            Route::post('/', 'store')->name('store');
            Route::get('/{voucher}/edit', 'edit')->name('edit');
            Route::put('/{voucher}', 'update')->name('update');
            Route::delete('/{voucher}', 'destroy')->name('destroy');
        });

    Route::prefix('stock')
        ->name('stock.')
        ->controller(StockController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/{product}', 'show')->name('show');
        });

    Route::prefix('parties')
        ->name('parties.')
        ->controller(PartyController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::patch('/{party}/toggle-status', 'toggleStatus')->name('toggleStatus');
            Route::put('/{party}', 'update')->name('update');
            Route::delete('/{party}', 'destroy')->name('destroy');
        });

    Route::prefix('capital')
        ->name('capital.')
        ->controller(CapitalController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/create', 'create')->name('create');
            Route::get('/partner-balance/{party}', 'partnerBalance')->name('partnerBalance');
            Route::post('/', 'store')->name('store');
            Route::get('/{capitalTransaction}/edit', 'edit')->name('edit');
            Route::put('/{capitalTransaction}', 'update')->name('update');
            Route::delete('/{capitalTransaction}', 'destroy')->name('destroy');
        });

    Route::prefix('fiscal-years')
        ->name('fiscal-years.')
        ->controller(FiscalYearController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::patch('/{fiscalYear}/activate', 'activate')->name('activate');
            Route::post('/periods/{fiscalPeriod}/close', 'closePeriod')->name('closePeriod');
            Route::post('/{fiscalYear}/close', 'closeYear')->name('closeYear');
        });

    Route::prefix('reports')
        ->name('reports.')
        ->controller(ReportController::class)
        ->group(function () {
            Route::get('/party-ledger', 'partyLedger')->name('partyLedger');
            Route::get('/general-ledger', 'generalLedger')->name('generalLedger');
            Route::get('/trial-balance', 'trialBalance')->name('trialBalance');
            Route::get('/profit-and-loss', 'profitAndLoss')->name('profitAndLoss');
            Route::get('/balance-sheet', 'balanceSheet')->name('balanceSheet');
            Route::get('/capital-summary', 'capitalSummary')->name('capitalSummary');
            Route::get('/stock-report', 'stockReport')->name('stockReport');
        });

    Route::prefix('accounts')
        ->name('accounts.')
        ->controller(AccountController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('/', 'store')->name('store');
            Route::patch('/{account}/toggle-status', 'toggleStatus')->name('toggleStatus');
            Route::put('/{account}', 'update')->name('update');
            Route::delete('/{account}', 'destroy')->name('destroy');
        });
});

require __DIR__.'/settings.php';
