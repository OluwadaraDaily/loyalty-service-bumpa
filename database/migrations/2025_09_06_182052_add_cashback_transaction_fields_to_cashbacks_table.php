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
        Schema::table('cashbacks', function (Blueprint $table) {
            $table->string('idempotency_key')->unique()->after('currency');
            $table->string('transaction_reference')->nullable()->after('idempotency_key');
            $table->string('payment_provider')->default('mock')->after('transaction_reference');
            $table->integer('retry_count')->default(0)->after('payment_provider');
            $table->timestamp('last_retry_at')->nullable()->after('retry_count');
            $table->text('failure_reason')->nullable()->after('last_retry_at');
            $table->enum('status', ['initiated', 'processing', 'completed', 'failed', 'cancelled'])->default('initiated')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cashbacks', function (Blueprint $table) {
            $table->dropColumn([
                'idempotency_key',
                'transaction_reference', 
                'payment_provider',
                'retry_count',
                'last_retry_at',
                'failure_reason'
            ]);
            $table->enum('status', ['pending', 'approved', 'paid'])->default('pending')->change();
        });
    }
};
