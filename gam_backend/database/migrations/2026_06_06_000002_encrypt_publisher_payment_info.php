<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * FIX [SEC-12]: This migration re-encrypts existing payment_info JSON data.
 *
 * The Publisher model cast for payment_info is being changed from 'array' to
 * 'encrypted:array'. This migration ensures that any existing plaintext JSON
 * data in the payment_info column is re-encrypted using Laravel's encryption.
 *
 * IMPORTANT: This migration is NOT reversible in a standard sense because
 * decrypting and re-storing as plaintext would expose payment data again.
 * The down() method is intentionally a no-op.
 *
 * DATA SAFETY NOTE: If the APP_KEY changes after this migration runs, all
 * existing payment_info data becomes unreadable. Ensure APP_KEY is backed up.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Fetch all publishers with non-null payment_info
        $publishers = DB::table('publishers')
            ->whereNotNull('payment_info')
            ->select('id', 'payment_info')
            ->get();

        foreach ($publishers as $publisher) {
            try {
                // Detect if the data is already encrypted (Laravel encrypted values start with 'eyJ')
                // or if it's plain JSON (starts with '{' or '[')
                $raw = $publisher->payment_info;
                $isAlreadyEncrypted = false;

                // Attempt to json_decode: if it succeeds, it's still plaintext JSON
                $decoded = json_decode($raw, true);
                if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
                    // Not valid JSON — likely already encrypted or corrupted. Skip.
                    $isAlreadyEncrypted = true;
                }

                if (!$isAlreadyEncrypted && $decoded !== null) {
                    // Re-encrypt using Laravel's encryption
                    $encrypted = encrypt($decoded);
                    DB::table('publishers')
                        ->where('id', $publisher->id)
                        ->update(['payment_info' => $encrypted]);
                }
            } catch (\Exception $e) {
                Log::warning("Migration SEC-12: Could not re-encrypt payment_info for publisher {$publisher->id}: " . $e->getMessage());
            }
        }
    }

    public function down(): void
    {
        // Intentionally not reversing — reverting would expose payment data as plaintext.
        // To revert: manually re-cast the column to 'array' and handle decryption carefully.
    }
};
