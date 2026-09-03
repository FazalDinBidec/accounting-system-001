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
        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->index()->constrained()->restrictOnDelete();
            $table->string('batch_no');
            $table->decimal('quantity_on_hand', 12, 2);
            $table->date('purchased_at')->index();
            $table->timestamps();

            $table->unique(['product_id', 'batch_no']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_batches');
    }
};
