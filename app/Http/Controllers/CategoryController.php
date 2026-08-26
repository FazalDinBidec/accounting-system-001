<?php

namespace App\Http\Controllers;

use App\Enums\CategoryStatus;
use App\Models\Category;
use App\Toast;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('categories/index', [
            'categories' => Category::query()
                ->with('parent:id,name')
                ->latest()
                ->paginate(15)
                ->withQueryString(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('categories/create', [
            'parents' => $this->parentOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Category::query()->create($this->validatedAttributes($request));

        Toast::success(__('Category created.'));

        return to_route('categories.index');
    }

    public function edit(Category $category): Response
    {
        return Inertia::render('categories/edit', [
            'category' => $category,
            'parents' => $this->parentOptions($category),
        ]);
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $category->update($this->validatedAttributes($request, $category));

        Toast::success(__('Category updated.'));

        return to_route('categories.index');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->children()->exists()) {
            Toast::error(__('Delete child categories first.'));

            return back();
        }

        $category->delete();

        Toast::success(__('Category deleted.'));

        return to_route('categories.index');
    }

    private function validatedAttributes(Request $request, ?Category $category = null): array
    {
        $request->merge([
            'parent_id' => $request->filled('parent_id') ? $request->integer('parent_id') : null,
        ]);

        $parentIdRules = ['nullable', 'integer', Rule::exists(Category::class, 'id')];

        if ($category !== null) {
            $parentIdRules[] = Rule::notIn([$category->id]);
        }

        $validated = $request->validate([
            'parent_id' => $parentIdRules,
            'name' => ['required', 'string', 'max:255'],
            'status' => ['required', Rule::enum(CategoryStatus::class)],
        ]);

        return $validated;
    }

    private function parentOptions(?Category $except = null): Collection
    {
        return Category::query()
            ->when($except, fn ($query, Category $except) => $query->whereKeyNot($except->id))
            ->orderBy('name')
            ->get(['id', 'name']);
    }
}
