# Validation & Forms Best Practices

## Validate Inline on the Request

Keep validation in the controller with `$request->validate()`. Do not create Form Request classes.

Incorrect:
```php
public function store(StorePostRequest $request)
{
    Post::create($request->validated());
}
```

Correct:
```php
public function store(Request $request)
{
    $validated = $request->validate([
        'title' => ['required', 'max:255'],
        'body' => ['required'],
    ]);

    Post::create($validated);
}
```

## Array vs. String Notation for Rules

Array syntax is more readable and composes cleanly with `Rule::` objects. Prefer it in new code, but match whatever notation nearby controllers already use.

```php
// Preferred for new code
'email' => ['required', 'email', Rule::unique('users')],

// Follow existing convention if nearby controllers use string notation
'email' => 'required|email|unique:users',
```

## Always Use Validated Data

Get only validated data. Never use `$request->all()` for mass operations.

Incorrect:
```php
Post::create($request->all());
```

Correct:
```php
$validated = $request->validate([
    'title' => ['required', 'max:255'],
    'body' => ['required'],
]);

Post::create($validated);
```

## Use `Rule::when()` for Conditional Validation

```php
'company_name' => [
    Rule::when($request->account_type === 'business', ['required', 'string', 'max:255']),
],
```
