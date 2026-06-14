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
        Schema::create('faqs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('question');
            $table->string('question_ar')->nullable();
            $table->text('answer');
            $table->text('answer_ar')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed initial FAQs based on translation files
        \DB::table('faqs')->insert([
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'question' => 'Do I need my own Google Ad Manager (GAM) account to join?',
                'question_ar' => 'هل أحتاج إلى حساب Google Ad Manager (GAM) خاص بي للانضمام؟',
                'answer' => 'No, you do not need a personal GAM account. We manage the ad exchange bidding and setup. If you do have a GAM account, our platform can synchronize and deliver customized tags directly to your inventory.',
                'answer_ar' => 'لا، لا تحتاج إلى حساب GAM شخصي. نحن ندير عمليات المزايدة وإعداد الإعلانات. إذا كان لديك حساب GAM، فيمكن لمنصتنا المزامنة وتقديم إعلانات مخصصة مباشرة إلى مخزونك.',
                'sort_order' => 1,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'question' => 'What is the revenue-sharing ratio on BestRevenue?',
                'question_ar' => 'ما هي نسبة مشاركة الأرباح في BestRevenue؟',
                'answer' => 'Our standard revenue share is 80% to the publisher. For high-volume publishers, custom revenue-sharing ratios can be configured directly by administrators in the platform settings.',
                'answer_ar' => 'حصة الأرباح القياسية لدينا هي 80٪ للناشر. بالنسبة للناشرين ذوي الأحجام الكبيرة، يمكن لمسؤولي النظام تهيئة نسب مشاركة أرباح مخصصة مباشرة في إعدادات المنصة.',
                'sort_order' => 2,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'question' => 'When and how do I receive my earnings payouts?',
                'question_ar' => 'متى وكيف أستلم أرباحي؟',
                'answer' => 'Payouts are calculated at the end of each monthly period closing. Approved balances are paid out via your configured payment method (Wire Transfer, Crypto, PayPal) once they meet your payment method\'s minimum threshold.',
                'answer_ar' => 'يتم احتساب المدفوعات في نهاية كل إغلاق شهر. يتم دفع الأرصدة المعتمدة عبر طريقة الدفع المهيأة (تحويل بنكي، عملات رقمية، باي بال) بمجرد وصولها إلى الحد الأدنى لطريقة الدفع.',
                'sort_order' => 3,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'question' => 'How do I implement ads.txt on my websites?',
                'question_ar' => 'كيف يمكنني تفعيل ملف ads.txt على مواقعي؟',
                'answer' => 'Once your domain is approved, you can view and copy the ads.txt entries directly from your \'My Websites\' dashboard. Simply copy these lines and host them at yourdomain.com/ads.txt.',
                'answer_ar' => 'بمجرد الموافقة على نطاقك، يمكنك عرض ونسخ مدخلات ads.txt مباشرة من لوحة تحكم "مواقعي". ما عليك سوى نسخ هذه الأسطر واستضافتها على yourdomain.com/ads.txt.',
                'sort_order' => 4,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'question' => 'What ad formats and placements are supported?',
                'question_ar' => 'ما هي أشكال ومواضع الإعلانات المدعومة؟',
                'answer' => 'We support standard Banners, Interstitials, Reward ads, top/bottom Anchors, and highly customizable Floating ad formats with advanced display triggers and anti-tamper security configurations.',
                'answer_ar' => 'نحن ندعم الإعلانات الصورية القياسية (Banners)، الإعلانات البينية (Interstitials)، الإعلانات بمكافأة (Reward ads)، الإعلانات المثبتة في الأعلى/الأسفل (Anchors)، والإعلانات العائمة القابلة للتخصيص بدرجة كبيرة مع تكوينات أمان متقدمة ومضادة لحظر الإعلانات.',
                'sort_order' => 5,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('faqs');
    }
};
