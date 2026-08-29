<?php

namespace App\Http\Controllers;

use App\Enums\CategoryStatus;
use App\Models\Category;
use App\Support\Toast;
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
                ->paginate(10)
                ->withQueryString(),
            'parents' => $this->parentOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Category::query()->create($this->validatedAttributes($request));

        Toast::success(__('Category created.'));

        return back();
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $category->update($this->validatedAttributes($request, $category));

        Toast::success(__('Category updated.'));

        return back();
    }

    public function toggleStatus(Category $category): RedirectResponse
    {
        $category->update([
            'status' => $category->status === CategoryStatus::Active
                ? CategoryStatus::Inactive
                : CategoryStatus::Active,
        ]);

        Toast::success(__('Category status updated.'));

        return back();
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

    private function parentOptions(): Collection
    {
        return Category::query()
            ->orderBy('name')
            ->get(['id', 'name']);
    }
}
