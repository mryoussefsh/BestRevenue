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
        Schema::create('pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content');
            $table->boolean('show_in_public_footer')->default(false);
            $table->boolean('show_in_publisher_footer')->default(false);
            $table->boolean('show_in_landing_menu')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert initial Privacy Policy and Terms of Service pages
        \DB::table('pages')->insert([
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'title' => 'Privacy Policy',
                'slug' => 'privacy-policy',
                'content' => '<h2>Privacy Policy</h2><p>Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.</p><p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we are collecting it and how it will be used.</p><p>We do not share any personally identifying information publicly or with third-parties, except when required to by law.</p>',
                'show_in_public_footer' => true,
                'show_in_publisher_footer' => true,
                'show_in_landing_menu' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'title' => 'Terms of Service',
                'slug' => 'terms-of-service',
                'content' => '<h2>Terms of Service</h2><p>Welcome to our platform. By accessing our website, you agree to be bound by these Terms of Service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p><p>If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.</p><p>We reserve the right to review and amend any of these terms of service at our sole discretion. Upon doing so, we will update this page.</p>',
                'show_in_public_footer' => true,
                'show_in_publisher_footer' => true,
                'show_in_landing_menu' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
