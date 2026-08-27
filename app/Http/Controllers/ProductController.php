<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('products/index', [
            'products' => Product::query()
                ->latest()
                ->paginate(10)
                ->withQueryString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Product::query()->create($this->validatedAttributes($request));

        Toast::success(__('Product created.'));

        return back();
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $product->update($this->validatedAttributes($request));

        Toast::success(__('Product updated.'));

        return back();
    }

    public function toggleStatus(Product $product): RedirectResponse
    {
        $product->update([
            'is_active' => ! $product->is_active,
        ]);

        Toast::success(__('Product status updated.'));

        return back();
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        Toast::success(__('Product deleted.'));

        return to_route('products.index');
    }

    /**
     * @return array{name: string, description: string|null, is_active: bool}
     */
    private function validatedAttributes(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
        ]);
    }
}
