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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->index()->constrained()->restrictOnDelete();
            $table->foreignId('product_batch_id')->nullable()->index()->constrained()->nullOnDelete();
            $table->string('type')->index();
            $table->decimal('quantity', 12, 2);
            $table->date('date')->index();
            $table->morphs('stockable');
            $table->timestamps();

            $table->index(['product_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
