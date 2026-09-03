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
        Schema::create('sale_order_item_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_order_item_id')->index()->constrained('sale_order_items')->cascadeOnDelete();
            $table->foreignId('product_batch_id')->index()->constrained()->restrictOnDelete();
            $table->decimal('quantity', 12, 2);
            $table->timestamps();

            $table->unique(
                ['sale_order_item_id', 'product_batch_id'],
                'soib_item_batch_unique',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_order_item_batches');
    }
};
