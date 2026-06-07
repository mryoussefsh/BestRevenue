<?php

namespace Database\Seeders;

use App\Models\Translation;
use Illuminate\Database\Seeder;

class TranslationsSeeder extends Seeder
{
    public function run(): void
    {
        $translations = [
            // ── Navigation ─────────────────────────────────────────────
            ['key' => 'nav.dashboard',      'en' => 'Dashboard',        'ar' => 'لوحة التحكم'],
            ['key' => 'nav.publishers',     'en' => 'Publishers',       'ar' => 'الناشرون'],
            ['key' => 'nav.websites',       'en' => 'Websites',         'ar' => 'المواقع'],
            ['key' => 'nav.revenue',        'en' => 'Revenue',          'ar' => 'الإيرادات'],
            ['key' => 'nav.payouts',        'en' => 'Payouts',          'ar' => 'المدفوعات'],
            ['key' => 'nav.settings',       'en' => 'Settings',         'ar' => 'الإعدادات'],
            ['key' => 'nav.translations',   'en' => 'Translations',     'ar' => 'الترجمات'],
            ['key' => 'nav.sync_log',       'en' => 'Sync Log',         'ar' => 'سجل المزامنة'],
            ['key' => 'nav.audit_log',      'en' => 'Audit Log',        'ar' => 'سجل التدقيق'],
            ['key' => 'nav.my_websites',    'en' => 'My Websites',      'ar' => 'مواقعي'],
            ['key' => 'nav.my_earnings',    'en' => 'My Earnings',      'ar' => 'أرباحي'],
            ['key' => 'nav.my_payouts',     'en' => 'My Payouts',       'ar' => 'مدفوعاتي'],
            ['key' => 'nav.logout',         'en' => 'Logout',           'ar' => 'تسجيل الخروج'],

            // ── Auth ───────────────────────────────────────────────────
            ['key' => 'auth.login',         'en' => 'Sign In',          'ar' => 'تسجيل الدخول'],
            ['key' => 'auth.email',         'en' => 'Email Address',    'ar' => 'البريد الإلكتروني'],
            ['key' => 'auth.password',      'en' => 'Password',         'ar' => 'كلمة المرور'],
            ['key' => 'auth.failed',        'en' => 'Invalid credentials.', 'ar' => 'بيانات الدخول غير صحيحة.'],
            ['key' => 'auth.suspended',     'en' => 'Your account has been suspended.', 'ar' => 'تم تعليق حسابك.'],

            // ── Dashboard ──────────────────────────────────────────────
            ['key' => 'dashboard.this_month',       'en' => 'This Month',           'ar' => 'هذا الشهر'],
            ['key' => 'dashboard.last_month',       'en' => 'Last Month',           'ar' => 'الشهر الماضي'],
            ['key' => 'dashboard.total_earnings',   'en' => 'Total Earnings',       'ar' => 'إجمالي الأرباح'],
            ['key' => 'dashboard.total_impressions','en' => 'Total Impressions',    'ar' => 'إجمالي المشاهدات'],
            ['key' => 'dashboard.total_publishers', 'en' => 'Total Publishers',     'ar' => 'إجمالي الناشرين'],
            ['key' => 'dashboard.pending_payouts',  'en' => 'Pending Payouts',      'ar' => 'المدفوعات المعلقة'],

            // ── Revenue ────────────────────────────────────────────────
            ['key' => 'revenue.gross',          'en' => 'Gross Revenue',    'ar' => 'الإيراد الإجمالي'],
            ['key' => 'revenue.earnings',       'en' => 'Earnings',         'ar' => 'الأرباح'],
            ['key' => 'revenue.impressions',    'en' => 'Impressions',      'ar' => 'المشاهدات'],
            ['key' => 'revenue.clicks',         'en' => 'Clicks',           'ar' => 'النقرات'],
            ['key' => 'revenue.ctr',            'en' => 'CTR',              'ar' => 'نسبة النقر'],
            ['key' => 'revenue.cpm',            'en' => 'CPM',              'ar' => 'التكلفة لكل ألف'],
            ['key' => 'revenue.country',        'en' => 'Country',          'ar' => 'الدولة'],
            ['key' => 'revenue.date',           'en' => 'Date',             'ar' => 'التاريخ'],
            ['key' => 'revenue.ad_unit',        'en' => 'Ad Unit',          'ar' => 'وحدة الإعلان'],

            // ── Payouts ────────────────────────────────────────────────
            ['key' => 'payout.status.pending',  'en' => 'Pending',          'ar' => 'في الانتظار'],
            ['key' => 'payout.status.approved', 'en' => 'Approved',         'ar' => 'موافق عليه'],
            ['key' => 'payout.status.rejected', 'en' => 'Rejected',         'ar' => 'مرفوض'],
            ['key' => 'payout.status.paid',     'en' => 'Paid',             'ar' => 'مدفوع'],
            ['key' => 'payout.amount',          'en' => 'Amount',           'ar' => 'المبلغ'],
            ['key' => 'payout.period',          'en' => 'Period',           'ar' => 'الفترة'],
            ['key' => 'payout.approve',         'en' => 'Approve',          'ar' => 'موافقة'],
            ['key' => 'payout.reject',          'en' => 'Reject',           'ar' => 'رفض'],
            ['key' => 'payout.mark_paid',       'en' => 'Mark as Paid',     'ar' => 'تحديد كمدفوع'],
            ['key' => 'payout.threshold_alert', 'en' => 'Below minimum payout threshold', 'ar' => 'أقل من الحد الأدنى للدفع'],

            // ── Period Closing ─────────────────────────────────────────
            ['key' => 'closing.status.open',    'en' => 'Open',             'ar' => 'مفتوح'],
            ['key' => 'closing.status.closing', 'en' => 'Closing...',       'ar' => 'جاري الإغلاق...'],
            ['key' => 'closing.status.closed',  'en' => 'Closed',           'ar' => 'مغلق'],
            ['key' => 'closing.close_period',   'en' => 'Close Period',     'ar' => 'إغلاق الفترة'],
            ['key' => 'closing.confirm',        'en' => 'Confirm period close. This action is irreversible.', 'ar' => 'تأكيد إغلاق الفترة. هذا الإجراء لا يمكن التراجع عنه.'],

            // ── Common ─────────────────────────────────────────────────
            ['key' => 'common.save',            'en' => 'Save',             'ar' => 'حفظ'],
            ['key' => 'common.cancel',          'en' => 'Cancel',           'ar' => 'إلغاء'],
            ['key' => 'common.edit',            'en' => 'Edit',             'ar' => 'تعديل'],
            ['key' => 'common.delete',          'en' => 'Delete',           'ar' => 'حذف'],
            ['key' => 'common.add',             'en' => 'Add',              'ar' => 'إضافة'],
            ['key' => 'common.search',          'en' => 'Search',           'ar' => 'بحث'],
            ['key' => 'common.filter',          'en' => 'Filter',           'ar' => 'تصفية'],
            ['key' => 'common.export',          'en' => 'Export',           'ar' => 'تصدير'],
            ['key' => 'common.loading',         'en' => 'Loading...',       'ar' => 'جاري التحميل...'],
            ['key' => 'common.no_data',         'en' => 'No data available.','ar' => 'لا توجد بيانات.'],
            ['key' => 'common.active',          'en' => 'Active',           'ar' => 'نشط'],
            ['key' => 'common.suspended',       'en' => 'Suspended',        'ar' => 'موقوف'],
            ['key' => 'common.yes',             'en' => 'Yes',              'ar' => 'نعم'],
            ['key' => 'common.no',              'en' => 'No',               'ar' => 'لا'],
            ['key' => 'common.confirm',         'en' => 'Confirm',          'ar' => 'تأكيد'],
            ['key' => 'common.success',         'en' => 'Success',          'ar' => 'تم بنجاح'],
            ['key' => 'common.error',           'en' => 'An error occurred.','ar' => 'حدث خطأ.'],
        ];

        foreach ($translations as $item) {
            $key = $item['key'];
            // Determine group from key prefix (e.g. 'nav.dashboard' → 'nav')
            $group = explode('.', $key)[0];

            foreach (['en', 'ar'] as $locale) {
                Translation::updateOrCreate(
                    ['locale' => $locale, 'key' => $key],
                    [
                        'value'      => $item[$locale],
                        'group'      => $group,
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}
