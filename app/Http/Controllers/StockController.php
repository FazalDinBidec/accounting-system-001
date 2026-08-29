<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Support\ProductStock;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('stock/index', [
            'products' => ProductStock::summaries(),
        ]);
    }

    public function show(Product $product): Response
    {
        return Inertia::render('stock/show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
            ],
            'movements' => ProductStock::history($product),
        ]);
    }
}
