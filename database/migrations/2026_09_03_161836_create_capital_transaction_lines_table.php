<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('capital_transaction_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('capital_transaction_id')->index()->constrained()->cascadeOnDelete();
            $table->string('method')->index();
            $table->foreignId('account_id')->index()->constrained()->restrictOnDelete();
            $table->decimal('amount', 15, 2);
            $table->string('bank_name')->nullable();
            $table->string('account_no')->nullable();
            $table->string('holder_name')->nullable();
            $table->string('instrument_no')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('capital_transaction_lines');
    }
};
