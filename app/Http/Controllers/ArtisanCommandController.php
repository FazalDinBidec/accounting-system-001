<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Artisan;

class ArtisanCommandController extends Controller
{
    public function migrate(): Response
    {
        Artisan::call('migrate', ['--force' => true]);

        return response(Artisan::output(), 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }

    public function seed(): Response
    {
        Artisan::call('db:seed', ['--force' => true]);

        return response(Artisan::output(), 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }
}
