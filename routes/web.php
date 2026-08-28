<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\PartyController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseOrderController;
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
