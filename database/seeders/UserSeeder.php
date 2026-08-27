<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::query()->firstOrCreate(
            ['email' => 'admin@bidecsol.com'],
            [
                'name' => 'Admin',
                'password' => 'admin@bidecsol.com',
            ],
        );
    }
}
