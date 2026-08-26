<?php

use App\Models\Category;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page from the categories index', function () {
    $this->get(route('categories.index'))
        ->assertRedirect(route('login'));
});

test('the categories index returns an empty paginator when no categories exist', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('categories.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('categories/index')
            ->has('categories.data', 0)
            ->where('categories.current_page', 1)
            ->where('categories.per_page', 15)
            ->where('categories.total', 0)
            ->where('categories.from', null)
            ->where('categories.to', null),
        );
});

test('the categories index shows fifteen categories on the first page', function () {
    $this->freezeTime();

    $user = User::factory()->create();
    Category::factory()->create([
        'name' => 'Oldest category',
        'created_at' => now()->subDay(),
    ]);
    Category::factory()->count(15)->create([
        'created_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('categories.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('categories/index')
            ->has('categories.data', 15)
            ->where('categories.current_page', 1)
            ->where('categories.per_page', 15)
            ->where('categories.last_page', 2)
            ->where('categories.total', 16)
            ->where('categories.from', 1)
            ->where('categories.to', 15),
        );
});

test('the categories index shows the oldest category on the second page', function () {
    $this->freezeTime();

    $user = User::factory()->create();
    $oldest = Category::factory()->create([
        'name' => 'Oldest category',
        'created_at' => now()->subDay(),
    ]);
    Category::factory()->count(15)->create([
        'created_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('categories.index', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('categories/index')
            ->has('categories.data', 1)
            ->where('categories.current_page', 2)
            ->where('categories.last_page', 2)
            ->where('categories.total', 16)
            ->where('categories.from', 16)
            ->where('categories.to', 16)
            ->where('categories.data.0.name', 'Oldest category')
            ->where('categories.data.0.id', $oldest->id),
        );
});
