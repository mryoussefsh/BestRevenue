<?php

namespace Database\Seeders;

use App\Models\Translation;
use Illuminate\Database\Seeder;

class TranslationsSeeder extends Seeder
{
    public function run(): void
    {
        $translations = [
            ['key' => 'auth.account_under_review', 'en' => 'Your account is under review', 'ar' => 'حسابك تحت المراجعة حالياً'],
            ['key' => 'auth.already_have_account', 'en' => 'Already have an account?', 'ar' => 'هل لديك حساب بالفعل؟'],
            ['key' => 'auth.back_to_login', 'en' => 'Back to Login', 'ar' => 'العودة لتسجيل الدخول'],
            ['key' => 'auth.check_inbox', 'en' => 'Check your inbox', 'ar' => 'تحقق من صندوق الوارد'],
            ['key' => 'auth.confirm_new_password_placeholder', 'en' => 'Repeat your new password', 'ar' => 'كرر كلمة المرور الجديدة'],
            ['key' => 'auth.confirm_password_label', 'en' => 'Confirm Password', 'ar' => 'تأكيد كلمة المرور'],
            ['key' => 'auth.confirm_password_placeholder', 'en' => 'Repeat your password', 'ar' => 'كرر كلمة المرور'],
            ['key' => 'auth.contact_info_desc', 'en' => 'At least one contact method is required', 'ar' => 'يجب تقديم طريقة اتصال واحدة على الأقل'],
            ['key' => 'auth.contact_info_label', 'en' => 'Contact Information *', 'ar' => 'معلومات الاتصال *'],
            ['key' => 'auth.create_account', 'en' => 'Create Account', 'ar' => 'إنشاء حساب'],
            ['key' => 'auth.create_publisher_account', 'en' => 'Create a Publisher Account', 'ar' => 'إنشاء حساب ناشر'],
            ['key' => 'auth.create_publisher_account_btn', 'en' => 'Create Publisher Account', 'ar' => 'إنشاء حساب ناشر'],
            ['key' => 'auth.creating_account', 'en' => 'Creating Account…', 'ar' => 'جاري إنشاء الحساب…'],
            ['key' => 'auth.demo_admin', 'en' => 'Admin', 'ar' => 'مسؤول'],
            ['key' => 'auth.demo_credentials', 'en' => 'Demo Credentials', 'ar' => 'بيانات الدخول التجريبية'],
            ['key' => 'auth.email', 'en' => 'Email Address', 'ar' => 'البريد الإلكتروني'],
            ['key' => 'auth.email_label', 'en' => 'Email Address', 'ar' => 'عنوان البريد الإلكتروني'],
            ['key' => 'auth.email_placeholder', 'en' => 'you@example.com', 'ar' => 'you@example.com'],
            ['key' => 'auth.failed', 'en' => 'Invalid credentials.', 'ar' => 'بيانات الدخول غير صحيحة.'],
            ['key' => 'auth.error.contact_required', 'en' => 'Please fill in at least one contact method (Phone or Telegram).', 'ar' => 'يرجى تعبئة طريقة اتصال واحدة على الأقل (الهاتف أو تيليجرام).'],
            ['key' => 'auth.toast.welcome_signup', 'en' => 'Welcome to {site_name}! 🎉', 'ar' => 'مرحباً بك في {site_name}! 🎉'],
            ['key' => 'auth.error.pending_review', 'en' => 'Your account is pending admin review.', 'ar' => 'حسابك قيد مراجعة المسؤول.'],
            ['key' => 'auth.error.registration_failed', 'en' => 'Registration failed. Please try again.', 'ar' => 'فشل التسجيل. يرجى المحاولة مرة أخرى.'],
            ['key' => 'auth.error.passwords_do_not_match', 'en' => 'Passwords do not match.', 'ar' => 'كلمات المرور غير متطابقة.'],
            ['key' => 'auth.error.password_min_length', 'en' => 'Password must be at least 8 characters.', 'ar' => 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.'],
            ['key' => 'auth.toast.password_updated', 'en' => 'Password updated! Please log in.', 'ar' => 'تم تحديث كلمة المرور بنجاح! يرجى تسجيل الدخول.'],
            ['key' => 'auth.error.failed_reset_password', 'en' => 'Failed to reset password.', 'ar' => 'فشل إعادة تعيين كلمة المرور.'],
            ['key' => 'auth.toast.welcome_back', 'en' => 'Welcome back!', 'ar' => 'مرحباً بعودتك!'],
            ['key' => 'auth.error.invalid_credentials', 'en' => 'Invalid credentials. Please try again.', 'ar' => 'بيانات الاعتماد غير صحيحة. يرجى المحاولة مرة أخرى.'],
            ['key' => 'auth.toast.reset_link_sent', 'en' => 'Reset link sent!', 'ar' => 'تم إرسال رابط إعادة التعيين!'],
            ['key' => 'auth.error.failed_send_reset_email', 'en' => 'Failed to send reset email.', 'ar' => 'فشل إرسال بريد إعادة التعيين.'],
            ['key' => 'support.toast.fill_all_fields', 'en' => 'Please fill in all fields.', 'ar' => 'يرجى ملء جميع الحقول.'],
            ['key' => 'page.toast.not_found', 'en' => 'Page not found', 'ar' => 'الصفحة غير موجودة'],
            ['key' => 'auth.forgot_password', 'en' => 'Forgot Password', 'ar' => 'نسيت كلمة المرور'],
            ['key' => 'auth.forgot_password_desc', 'en' => 'Enter your email to receive a reset link', 'ar' => 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين'],
            ['key' => 'auth.forgot_password_link', 'en' => 'Forgot Password?', 'ar' => 'نسيت كلمة المرور؟'],
            ['key' => 'auth.forgot_password_sent_msg', 'en' => 'If an account with {email} exists, a password reset link has been sent. Please check your email (and spam folder).', 'ar' => 'إذا كان هناك حساب مسجل بالبريد {email}، فقد تم إرسال رابط إعادة تعيين كلمة المرور. يرجى التحقق من بريدك الإلكتروني (ومجلد الرسائل غير المرغوب فيها).'],
            ['key' => 'auth.full_name_label', 'en' => 'Full Name', 'ar' => 'الاسم الكامل'],
            ['key' => 'auth.full_name_placeholder', 'en' => 'Your full name', 'ar' => 'اسمك الكامل'],
            ['key' => 'auth.invalid_link', 'en' => 'Invalid Link', 'ar' => 'رابط غير صالح'],
            ['key' => 'auth.invalid_link_desc', 'en' => 'This reset link is missing required parameters.', 'ar' => 'رابط إعادة التعيين هذا يفتقر إلى المعلمات المطلوبة.'],
            ['key' => 'auth.join_and_monetize', 'en' => 'Join {site_name} and start monetizing your traffic', 'ar' => 'انضم إلى {site_name} وابدأ في تسييل حركات المرور الخاصة بك'],
            ['key' => 'auth.keep_me_signed_in', 'en' => 'Keep me signed in', 'ar' => 'بقائي قيد تسجيل الدخول'],
            ['key' => 'auth.login', 'en' => 'Sign In', 'ar' => 'تسجيل الدخول'],
            ['key' => 'auth.login_subtitle', 'en' => 'Sign in to your account', 'ar' => 'تسجيل الدخول إلى حسابك'],
            ['key' => 'auth.new_password_label', 'en' => 'New Password', 'ar' => 'كلمة المرور الجديدة'],
            ['key' => 'auth.new_to_platform', 'en' => 'New to {site_name}?', 'ar' => 'جديد في {site_name}؟'],
            ['key' => 'auth.password', 'en' => 'Password', 'ar' => 'كلمة المرور'],
            ['key' => 'auth.password_label', 'en' => 'Password *', 'ar' => 'كلمة المرور *'],
            ['key' => 'auth.password_min_8_chars', 'en' => 'Minimum 8 characters', 'ar' => 'الحد الأدنى 8 أحرف'],
            ['key' => 'auth.password_min_chars', 'en' => 'Min 8 characters', 'ar' => 'الحد الأدنى 8 أحرف'],
            ['key' => 'auth.password_placeholder', 'en' => '••••••••', 'ar' => '••••••••'],
            ['key' => 'auth.phone_label', 'en' => 'Phone / WhatsApp', 'ar' => 'الهاتف / واتساب'],
            ['key' => 'auth.phone_pill', 'en' => 'Phone', 'ar' => 'الهاتف'],
            ['key' => 'auth.registration_closed', 'en' => 'Registration Closed', 'ar' => 'التسجيل مغلق'],
            ['key' => 'auth.registration_closed_desc', 'en' => 'We are not accepting new publisher registrations at this time.', 'ar' => 'نحن لا نقبل تسجيل ناشرين جدد في الوقت الحالي.'],
            ['key' => 'auth.registration_received', 'en' => 'Registration Received!', 'ar' => 'تم استلام طلب التسجيل!'],
            ['key' => 'auth.request_new_link', 'en' => 'Request a New Link', 'ar' => 'طلب رابط جديد'],
            ['key' => 'auth.request_new_link_arrow', 'en' => 'Request a new reset link →', 'ar' => 'طلب رابط جديد لإعادة التعيين ←'],
            ['key' => 'auth.reset_password', 'en' => 'Reset Password', 'ar' => 'إعادة تعيين كلمة المرور'],
            ['key' => 'auth.reset_password_desc', 'en' => 'Choose a strong new password for {email}', 'ar' => 'اختر كلمة مرور قوية جديدة لـ {email}'],
            ['key' => 'auth.review_process_step1', 'en' => 'Our team will review your registration', 'ar' => 'سيقوم فريقنا بمراجعة معلومات تسجيلك'],
            ['key' => 'auth.review_process_step2', 'en' => 'Once approved, you\'ll be able to log in', 'ar' => 'بمجرد الموافقة، ستتمكن من تسجيل الدخول إلى حسابك'],
            ['key' => 'auth.review_process_step3', 'en' => 'You may be contacted via the contact info you provided', 'ar' => 'قد يتم التواصل معك عبر معلومات الاتصال التي قدمتها'],
            ['key' => 'auth.send_reset_link_btn', 'en' => 'Send Reset Link', 'ar' => 'إرسال رابط إعادة التعيين'],
            ['key' => 'auth.sending', 'en' => 'Sending…', 'ar' => 'جاري الإرسال…'],
            ['key' => 'auth.sign_in_here', 'en' => 'Sign in here', 'ar' => 'سجل الدخول من هنا'],
            ['key' => 'auth.signing_in', 'en' => 'Signing in…', 'ar' => 'جاري تسجيل الدخول…'],
            ['key' => 'auth.strength.excellent', 'en' => 'Excellent', 'ar' => 'ممتازة'],
            ['key' => 'auth.strength.fair', 'en' => 'Fair', 'ar' => 'مقبولة'],
            ['key' => 'auth.strength.good', 'en' => 'Good', 'ar' => 'جيدة'],
            ['key' => 'auth.strength.strong', 'en' => 'Strong', 'ar' => 'قوية'],
            ['key' => 'auth.strength.too_short', 'en' => 'Too short', 'ar' => 'قصيرة جداً'],
            ['key' => 'auth.strength.weak', 'en' => 'Weak', 'ar' => 'ضعيفة'],
            ['key' => 'auth.suspended', 'en' => 'Your account has been suspended.', 'ar' => 'تم تعليق حسابك.'],
            ['key' => 'auth.telegram_label', 'en' => 'Telegram Username', 'ar' => 'معرف تليجرام'],
            ['key' => 'auth.telegram_pill', 'en' => 'Telegram', 'ar' => 'تليجرام'],
            ['key' => 'auth.telegram_placeholder', 'en' => '@username', 'ar' => '@اسم المستخدم'],
            ['key' => 'auth.update_password_btn', 'en' => 'Update Password', 'ar' => 'تحديث كلمة المرور'],
            ['key' => 'auth.updating', 'en' => 'Updating…', 'ar' => 'جاري التحديث…'],
            ['key' => 'auth.what_happens_next', 'en' => 'What happens next?', 'ar' => 'ماذا سيحدث بعد ذلك؟'],
            ['key' => 'closing.close_period', 'en' => 'Close Period', 'ar' => 'إغلاق الفترة'],
            ['key' => 'closing.confirm', 'en' => 'Confirm period close. This action is irreversible.', 'ar' => 'تأكيد إغلاق الفترة. هذا الإجراء لا يمكن التراجع عنه.'],
            ['key' => 'closing.status.closed', 'en' => 'Closed', 'ar' => 'مغلق'],
            ['key' => 'closing.status.closing', 'en' => 'Closing...', 'ar' => 'جاري الإغلاق...'],
            ['key' => 'closing.status.open', 'en' => 'Open', 'ar' => 'مفتوح'],
            ['key' => 'common.access_dashboard', 'en' => 'Access Dashboard', 'ar' => 'الدخول للوحة التحكم'],
            ['key' => 'common.active', 'en' => 'Active', 'ar' => 'نشط'],
            ['key' => 'common.add', 'en' => 'Add', 'ar' => 'إضافة'],
            ['key' => 'common.all_rights', 'en' => 'All rights reserved.', 'ar' => 'جميع الحقوق محفوظة.'],
            ['key' => 'common.all_rights_reserved', 'en' => '© {year} {site_name}. All rights reserved.', 'ar' => '© {year} {site_name}. جميع الحقوق محفوظة.'],
            ['key' => 'common.cancel', 'en' => 'Cancel', 'ar' => 'إلغاء'],
            ['key' => 'common.clear', 'en' => 'Clear', 'ar' => 'مسح'],
            ['key' => 'common.close', 'en' => 'Close', 'ar' => 'إغلاق'],
            ['key' => 'common.confirm', 'en' => 'Confirm', 'ar' => 'تأكيد'],
            ['key' => 'common.copy_content', 'en' => 'Copy Content', 'ar' => 'نسخ المحتوى'],
            ['key' => 'common.create_free_account', 'en' => 'Create Free Account', 'ar' => 'إنشاء حساب مجاني'],
            ['key' => 'common.dashboard', 'en' => 'Dashboard', 'ar' => 'لوحة التحكم'],
            ['key' => 'common.delete', 'en' => 'Delete', 'ar' => 'حذف'],
            ['key' => 'common.edit', 'en' => 'Edit', 'ar' => 'تعديل'],
            ['key' => 'common.error', 'en' => 'An error occurred.', 'ar' => 'حدث خطأ.'],
            ['key' => 'common.exit', 'en' => 'Exit', 'ar' => 'خروج'],
            ['key' => 'common.export', 'en' => 'Export', 'ar' => 'تصدير'],
            ['key' => 'common.filter', 'en' => 'Filter', 'ar' => 'تصفية'],
            ['key' => 'common.gam_help', 'en' => 'Google Ad Manager Help', 'ar' => 'مساعدة Google Ad Manager'],
            ['key' => 'common.get_started', 'en' => 'Register', 'ar' => 'تسجيل حساب'],
            ['key' => 'common.get_started_now', 'en' => 'Get Started Now', 'ar' => 'ابدأ الآن'],
            ['key' => 'common.hide', 'en' => 'Hide', 'ar' => 'إخفاء'],
            ['key' => 'common.home_page', 'en' => 'Home Page', 'ar' => 'الصفحة الرئيسية'],
            ['key' => 'common.last_updated', 'en' => 'Last updated:', 'ar' => 'آخر تحديث:'],
            ['key' => 'common.loading', 'en' => 'Loading...', 'ar' => 'جاري التحميل...'],
            ['key' => 'common.loading_page', 'en' => 'Loading page…', 'ar' => 'جاري تحميل الصفحة…'],
            ['key' => 'common.months.apr', 'en' => 'April', 'ar' => 'أبريل'],
            ['key' => 'common.months.aug', 'en' => 'August', 'ar' => 'أغسطس'],
            ['key' => 'common.months.dec', 'en' => 'December', 'ar' => 'ديسمبر'],
            ['key' => 'common.months.feb', 'en' => 'February', 'ar' => 'فبراير'],
            ['key' => 'common.months.jan', 'en' => 'January', 'ar' => 'يناير'],
            ['key' => 'common.months.jul', 'en' => 'July', 'ar' => 'يوليو'],
            ['key' => 'common.months.jun', 'en' => 'June', 'ar' => 'يونيو'],
            ['key' => 'common.months.mar', 'en' => 'March', 'ar' => 'مارس'],
            ['key' => 'common.months.may', 'en' => 'May', 'ar' => 'مايو'],
            ['key' => 'common.months.nov', 'en' => 'November', 'ar' => 'نوفمبر'],
            ['key' => 'common.months.oct', 'en' => 'October', 'ar' => 'أكتوبر'],
            ['key' => 'common.months.sep', 'en' => 'September', 'ar' => 'سبتمبر'],
            ['key' => 'common.no', 'en' => 'No', 'ar' => 'لا'],
            ['key' => 'common.no_data', 'en' => 'No data available.', 'ar' => 'لا توجد بيانات.'],
            ['key' => 'common.registration_closed', 'en' => 'Registration Closed', 'ar' => 'التسجيل مغلق'],
            ['key' => 'common.reset', 'en' => 'Reset', 'ar' => 'إعادة تعيين'],
            ['key' => 'common.save', 'en' => 'Save', 'ar' => 'حفظ'],
            ['key' => 'common.search', 'en' => 'Search', 'ar' => 'بحث'],
            ['key' => 'common.sign_in', 'en' => 'Sign In', 'ar' => 'تسجيل الدخول'],
            ['key' => 'common.status.active', 'en' => 'Active', 'ar' => 'نشط'],
            ['key' => 'common.status.inactive', 'en' => 'Inactive', 'ar' => 'غير نشط'],
            ['key' => 'common.success', 'en' => 'Success', 'ar' => 'تم بنجاح'],
            ['key' => 'common.suspended', 'en' => 'Suspended', 'ar' => 'موقوف'],
            ['key' => 'common.viewing_as', 'en' => 'Viewing as', 'ar' => 'عرض كـ'],
            ['key' => 'common.yes', 'en' => 'Yes', 'ar' => 'نعم'],
            ['key' => 'dashboard.chart.earnings_trend', 'en' => 'Earnings Trend', 'ar' => 'اتجاه الأرباح'],
            ['key' => 'dashboard.chart.filtered_range', 'en' => 'Filtered Range', 'ar' => 'الفترة المحددة'],
            ['key' => 'dashboard.chart.no_data', 'en' => 'No earnings data for this selection', 'ar' => 'لا توجد بيانات أرباح لهذا الاختيار'],
            ['key' => 'dashboard.earnings_overview', 'en' => 'Earnings overview: {from} - {to}', 'ar' => 'نظرة عامة على الأرباح: {from} - {to}'],
            ['key' => 'dashboard.export_pdf', 'en' => 'Export PDF Statement', 'ar' => 'تصدير كشف حساب PDF'],
            ['key' => 'dashboard.filters.ad_unit', 'en' => 'Ad Unit', 'ar' => 'الوحدة الإعلانية'],
            ['key' => 'dashboard.filters.all_ad_units', 'en' => 'All Ad Units', 'ar' => 'جميع الوحدات الإعلانية'],
            ['key' => 'dashboard.filters.all_websites', 'en' => 'All Websites', 'ar' => 'جميع المواقع'],
            ['key' => 'dashboard.filters.custom_range', 'en' => 'Custom Range', 'ar' => 'فترة مخصصة'],
            ['key' => 'dashboard.filters.end_date', 'en' => 'End Date', 'ar' => 'تاريخ الانتهاء'],
            ['key' => 'dashboard.filters.hide', 'en' => 'Hide Filters', 'ar' => 'إخفاء الفلاتر'],
            ['key' => 'dashboard.filters.no_ad_units', 'en' => 'No ad units found', 'ar' => 'لم يتم العثور على وحدات إعلانية'],
            ['key' => 'dashboard.filters.no_websites', 'en' => 'No websites found', 'ar' => 'لم يتم العثور على مواقع'],
            ['key' => 'dashboard.filters.select_website_first', 'en' => 'Select a website first', 'ar' => 'اختر موقعاً أولاً'],
            ['key' => 'dashboard.filters.show', 'en' => 'Show Filters', 'ar' => 'عرض الفلاتر'],
            ['key' => 'dashboard.filters.start_date', 'en' => 'Start Date', 'ar' => 'تاريخ البدء'],
            ['key' => 'dashboard.filters.time_range', 'en' => 'Time Range', 'ar' => 'الفترة الزمنية'],
            ['key' => 'dashboard.filters.website', 'en' => 'Website', 'ar' => 'الموقع الإلكتروني'],
            ['key' => 'dashboard.greeting.afternoon', 'en' => 'Good afternoon', 'ar' => 'مساء الخير'],
            ['key' => 'dashboard.greeting.evening', 'en' => 'Good evening', 'ar' => 'مساء الخير'],
            ['key' => 'dashboard.greeting.morning', 'en' => 'Good morning', 'ar' => 'صباح الخير'],
            ['key' => 'dashboard.last_month', 'en' => 'Last Month', 'ar' => 'الشهر الماضي'],
            ['key' => 'dashboard.last_updated', 'en' => 'Last updated: {time}', 'ar' => 'آخر تحديث: {time}'],
            ['key' => 'dashboard.loading', 'en' => 'Loading dashboard metrics...', 'ar' => 'جاري تحميل مؤشرات لوحة التحكم...'],
            ['key' => 'dashboard.pending_payouts', 'en' => 'Pending Payouts', 'ar' => 'المدفوعات المعلقة'],
            ['key' => 'dashboard.presets.30d', 'en' => 'Last 30 Days', 'ar' => 'آخر 30 يوماً'],
            ['key' => 'dashboard.presets.7d', 'en' => 'Last 7 Days', 'ar' => 'آخر 7 أيام'],
            ['key' => 'dashboard.presets.last_month', 'en' => 'Last Month', 'ar' => 'الشهر الماضي'],
            ['key' => 'dashboard.presets.this_month', 'en' => 'This Month', 'ar' => 'هذا الشهر'],
            ['key' => 'dashboard.presets.today', 'en' => 'Today', 'ar' => 'اليوم'],
            ['key' => 'dashboard.presets.yesterday', 'en' => 'Yesterday', 'ar' => 'أمس'],
            ['key' => 'dashboard.stats.approved_earnings', 'en' => 'Approved Earnings', 'ar' => 'الأرباح المعتمدة'],
            ['key' => 'dashboard.stats.available_balance', 'en' => 'Available Balance', 'ar' => 'الرصيد المتاح'],
            ['key' => 'dashboard.stats.average_ctr', 'en' => 'Average CTR', 'ar' => 'متوسط نسبة النقر (CTR)'],
            ['key' => 'dashboard.stats.cpm_desc', 'en' => 'Earnings per 1k impressions', 'ar' => 'الأرباح لكل 1000 ظهور'],
            ['key' => 'dashboard.stats.cpm_tooltip', 'en' => 'Your net earnings per 1,000 served (monetized) impressions after the platform share has been applied.', 'ar' => 'صافي أرباحك لكل 1,000 ظهور إعلاني تم تمويله بعد تطبيق حصة المنصة.'],
            ['key' => 'dashboard.stats.ctr_desc', 'en' => 'Click-through rate', 'ar' => 'معدل النقر إلى الظهور'],
            ['key' => 'dashboard.stats.last_payout', 'en' => 'Last Payout', 'ar' => 'آخر دفعة مستلمة'],
            ['key' => 'dashboard.stats.measurable', 'en' => 'measurable', 'ar' => 'قابل للقياس'],
            ['key' => 'dashboard.stats.monetized_cpm', 'en' => 'Monetized CPM', 'ar' => 'سعر الألف ظهور الممول (CPM)'],
            ['key' => 'dashboard.stats.no_av_data', 'en' => 'No Active View data', 'ar' => 'لا توجد بيانات عرض نشطة'],
            ['key' => 'dashboard.stats.no_payouts_yet', 'en' => 'No payouts yet', 'ar' => 'لا توجد مدفوعات بعد'],
            ['key' => 'dashboard.stats.page_ad_loads', 'en' => 'Page ad loads', 'ar' => 'تحميلات إعلانات الصفحة'],
            ['key' => 'dashboard.stats.pending_earnings', 'en' => 'Pending Earnings', 'ar' => 'الأرباح المعلقة'],
            ['key' => 'dashboard.stats.selected_period', 'en' => 'Selected period', 'ar' => 'الفترة المحددة'],
            ['key' => 'dashboard.stats.total_clicks', 'en' => 'Total Clicks', 'ar' => 'إجمالي النقرات'],
            ['key' => 'dashboard.stats.total_impressions', 'en' => 'Total Impressions', 'ar' => 'إجمالي الظهور'],
            ['key' => 'dashboard.stats.unfilled_impressions', 'en' => 'Unfilled Impressions', 'ar' => 'ظهور غير ملبى'],
            ['key' => 'dashboard.stats.unserved_inventory', 'en' => 'Unserved inventory', 'ar' => 'مخزون غير معروض'],
            ['key' => 'dashboard.stats.viewability_rate', 'en' => 'Viewability Rate', 'ar' => 'معدل قابلية الرؤية'],
            ['key' => 'dashboard.status.approved', 'en' => 'Approved', 'ar' => 'معتمد'],
            ['key' => 'dashboard.status.holding', 'en' => 'Holding', 'ar' => 'قيد الحجز'],
            ['key' => 'dashboard.status.pending', 'en' => 'Pending', 'ar' => 'معلق'],
            ['key' => 'dashboard.table.approved', 'en' => 'Approved', 'ar' => 'معتمد'],
            ['key' => 'dashboard.table.clicks', 'en' => 'Clicks', 'ar' => 'النقرات'],
            ['key' => 'dashboard.table.cpm', 'en' => 'Monetized CPM', 'ar' => 'CPM الممول'],
            ['key' => 'dashboard.table.ctr', 'en' => 'CTR', 'ar' => 'نسبة النقر إلى الظهور'],
            ['key' => 'dashboard.table.daily_performance', 'en' => 'Daily Performance', 'ar' => 'الأداء اليومي'],
            ['key' => 'dashboard.table.date', 'en' => 'Date', 'ar' => 'التاريخ'],
            ['key' => 'dashboard.table.impressions', 'en' => 'Impressions', 'ar' => 'الظهور'],
            ['key' => 'dashboard.table.no_data', 'en' => 'No performance data for this selection', 'ar' => 'لا توجد بيانات أداء لهذا الاختيار'],
            ['key' => 'dashboard.table.pending', 'en' => 'Pending', 'ar' => 'معلق'],
            ['key' => 'dashboard.table.total_earnings', 'en' => 'Total Earnings', 'ar' => 'إجمالي الأرباح'],
            ['key' => 'dashboard.table.totals_days', 'en' => 'Totals ({days}d)', 'ar' => 'الإجماليات ({days} يوم)'],
            ['key' => 'dashboard.this_month', 'en' => 'This Month', 'ar' => 'هذا الشهر'],
            ['key' => 'dashboard.toast_adunits_failed', 'en' => 'Failed to load ad units', 'ar' => 'فشل تحميل الوحدات الإعلانية'],
            ['key' => 'dashboard.toast_failed', 'en' => 'Failed to load dashboard data', 'ar' => 'فشل تحميل بيانات لوحة التحكم'],
            ['key' => 'dashboard.toast_pdf_failed', 'en' => 'Failed to export PDF statement', 'ar' => 'فشل تصدير كشف حساب PDF'],
            ['key' => 'dashboard.toast_pdf_generating', 'en' => 'Generating PDF statement...', 'ar' => 'جاري إنشاء كشف حساب PDF...'],
            ['key' => 'dashboard.toast_pdf_success', 'en' => 'PDF downloaded successfully', 'ar' => 'تم تحميل ملف PDF بنجاح'],
            ['key' => 'dashboard.total_earnings', 'en' => 'Total Earnings', 'ar' => 'إجمالي الأرباح'],
            ['key' => 'dashboard.total_impressions', 'en' => 'Total Impressions', 'ar' => 'إجمالي المشاهدات'],
            ['key' => 'dashboard.total_publishers', 'en' => 'Total Publishers', 'ar' => 'إجمالي الناشرين'],
            ['key' => 'landing.calc.ads_per_page', 'en' => 'Ads Per Page', 'ar' => 'الإعلانات في الصفحة'],
            ['key' => 'landing.calc.avg_cpm', 'en' => 'Average Monetized CPM', 'ar' => 'متوسط سعر الألف ظهور (CPM)'],
            ['key' => 'landing.calc.daily_earnings', 'en' => 'Daily Earnings', 'ar' => 'الأرباح اليومية'],
            ['key' => 'landing.calc.daily_impressions', 'en' => 'Daily Impressions', 'ar' => 'الظهور اليومي المقدر'],
            ['key' => 'landing.calc.daily_views', 'en' => 'Daily Pageviews', 'ar' => 'مشاهدات الصفحة اليومية'],
            ['key' => 'landing.calc.est_monthly', 'en' => 'Estimated Monthly Earnings', 'ar' => 'الأرباح الشهرية المقدرة'],
            ['key' => 'landing.calc.note', 'en' => '*Estimates are calculated based on an 80% baseline revenue share. Actual CPMs and earnings depend on geographic traffic, niche, and content viewability.', 'ar' => '*تُحسب التقديرات بناءً على مشاركة أرباح أساسية بنسبة 80٪. تعتمد أسعار CPM والأرباح الفعلية على الموقع الجغرافي للزوار، ومجال الموقع، ومدى قابلية رؤية الإعلانات.'],
            ['key' => 'landing.calc.subtitle', 'en' => 'Slide the parameters to estimate how much revenue you can generate with our 80% baseline revenue share structure.', 'ar' => 'حرك المؤشرات لتقدير الإيرادات التي يمكنك تحقيقها من خلال هيكل مشاركة الأرباح الأساسي بنسبة 80٪.'],
            ['key' => 'landing.calc.tag', 'en' => 'Estimator', 'ar' => 'المخمن'],
            ['key' => 'landing.calc.title', 'en' => 'Calculate Your Revenue Potential', 'ar' => 'احسب أرباحك المحتملة'],
            ['key' => 'landing.calc.yearly_earnings', 'en' => 'Yearly Earnings', 'ar' => 'الأرباح السنوية'],
            ['key' => 'landing.cta.desc', 'en' => 'Sign up today to configure your websites, generate tags, and watch your monetization metrics climb.', 'ar' => 'سجل اليوم لتكوين مواقعك، وإنشاء الأكواد الإعلانية، ومراقبة ارتفاع مؤشرات أرباحك.'],
            ['key' => 'landing.cta.title', 'en' => 'Ready to Maximize Your Revenues?', 'ar' => 'جاهز لزيادة أرباحك إلى الحد الأقصى؟'],
            ['key' => 'landing.faq.a1', 'en' => 'No, you do not need a personal GAM account. We manage the ad exchange bidding and setup. If you do have a GAM account, our platform can synchronize and deliver customized tags directly to your inventory.', 'ar' => 'لا، لا تحتاج إلى حساب GAM شخصي. نحن ندير عمليات المزايدة وإعداد الإعلانات. إذا كان لديك حساب GAM، فيمكن لمنصتنا المزامنة وتقديم إعلانات مخصصة مباشرة إلى مخزونك.'],
            ['key' => 'landing.faq.a2', 'en' => 'Our standard revenue share is 80% to the publisher. For high-volume publishers, custom revenue-sharing ratios can be configured directly by administrators in the platform settings.', 'ar' => 'حصة الأرباح القياسية لدينا هي 80٪ للناشر. بالنسبة للناشرين ذوي الأحجام الكبيرة، يمكن لمسؤولي النظام تهيئة نسب مشاركة أرباح مخصصة مباشرة في إعدادات المنصة.'],
            ['key' => 'landing.faq.a3', 'en' => 'Payouts are calculated at the end of each monthly period closing. Approved balances are paid out via your configured payment method (Wire Transfer, Crypto, PayPal) once they meet your payment method\'s minimum threshold.', 'ar' => 'يتم احتساب المدفوعات في نهاية كل إغلاق شهر. يتم دفع الأرصدة المعتمدة عبر طريقة الدفع المهيأة (تحويل بنكي، عملات رقمية، باي بال) بمجرد وصولها إلى الحد الأدنى لطريقة الدفع.'],
            ['key' => 'landing.faq.a4', 'en' => 'Once your domain is approved, you can view and copy the ads.txt entries directly from your \'My Websites\' dashboard. Simply copy these lines and host them at yourdomain.com/ads.txt.', 'ar' => 'بمجرد الموافقة على نطاقك، يمكنك عرض ونسخ مدخلات ads.txt مباشرة من لوحة تحكم "مواقعي". ما عليك سوى نسخ هذه الأسطر واستضافتها على yourdomain.com/ads.txt.'],
            ['key' => 'landing.faq.a5', 'en' => 'We support standard Banners, Interstitials, Reward ads, top/bottom Anchors, and highly customizable Floating ad formats with advanced display triggers and anti-tamper security configurations.', 'ar' => 'نحن ندعم الإعلانات الصورية القياسية (Banners)، الإعلانات البينية (Interstitials)، الإعلانات بمكافأة (Reward ads)، الإعلانات المثبتة في الأعلى/الأسفل (Anchors)، والإعلانات العائمة القابلة للتخصيص بدرجة كبيرة مع تكوينات أمان متقدمة ومضادة لحظر الإعلانات.'],
            ['key' => 'landing.faq.q1', 'en' => 'Do I need my own Google Ad Manager (GAM) account to join?', 'ar' => 'هل أحتاج إلى حساب Google Ad Manager (GAM) خاص بي للانضمام؟'],
            ['key' => 'landing.faq.q2', 'en' => 'What is the revenue-sharing ratio on BestRevenue?', 'ar' => 'ما هي نسبة مشاركة الأرباح في BestRevenue؟'],
            ['key' => 'landing.faq.q3', 'en' => 'When and how do I receive my earnings payouts?', 'ar' => 'متى وكيف أستلم أرباحي؟'],
            ['key' => 'landing.faq.q4', 'en' => 'How do I implement ads.txt on my websites?', 'ar' => 'كيف يمكنني تفعيل ملف ads.txt على مواقعي؟'],
            ['key' => 'landing.faq.q5', 'en' => 'What ad formats and placements are supported?', 'ar' => 'ما هي أشكال ومواضع الإعلانات المدعومة؟'],
            ['key' => 'landing.faq.subtitle', 'en' => 'Everything you need to know about setting up, revenue ratios, payouts, and Google Ad Manager sync rules.', 'ar' => 'كل ما تحتاج لمعرفته حول الإعداد، ونسب الإيرادات، والمدفوعات، وقواعد المزامنة مع Google Ad Manager.'],
            ['key' => 'landing.faq.tag', 'en' => 'FAQ', 'ar' => 'الأسئلة الشائعة'],
            ['key' => 'landing.faq.title', 'en' => 'Frequently Asked Questions', 'ar' => 'الأسئلة الشائعة'],
            ['key' => 'landing.features.closings_desc', 'en' => 'Never worry about payment schedules. Verified earnings are locked at month-end, generating statements and clear billing PDFs.', 'ar' => 'لا تقلق أبداً بشأن جداول الدفع. يتم قفل الأرباح المعتمدة في نهاية الشهر، مما يولد كشوفات فواتير وملفات PDF واضحة.'],
            ['key' => 'landing.features.closings_title', 'en' => 'Automated Period Closings', 'ar' => 'إغلاق الفترات تلقائياً'],
            ['key' => 'landing.features.fraud_desc', 'en' => 'Comprehensive balance adjustments support deducting Invalid Traffic (IVT) or applying bonuses fairly with details logged in your portal.', 'ar' => 'دعم كامل لتعديل الرصيد واقتطاع حركة المرور غير الصالحة (IVT) أو تطبيق المكافآت بشكل عادل مع تسجيل التفاصيل في بوابتك.'],
            ['key' => 'landing.features.fraud_title', 'en' => 'Fraud & IVT Protection', 'ar' => 'الحماية من IVT والاحتيال'],
            ['key' => 'landing.features.notify_desc', 'en' => 'Receive updates on payouts, policy updates, and critical maintenance notices instantly via integrated announcements and emails.', 'ar' => 'احصل على تحديثات حول المدفوعات وتحديثات السياسة وإشعارات الصيانة الهامة فوراً عبر الإعلانات المدمجة ورسائل البريد الإلكتروني.'],
            ['key' => 'landing.features.notify_title', 'en' => 'Real-Time Notifications', 'ar' => 'إشعارات في الوقت الفعلي'],
            ['key' => 'landing.features.reports_desc', 'en' => 'Track daily metrics like CPM, CTR, and unfilled impressions. Dive deep into analytics filterable by website and specific ad units.', 'ar' => 'تتبع المؤشرات اليومية مثل CPM و CTR والمشاهدات غير الملباة. تعمق في التحليلات المصفاة حسب الموقع ووحدات إعلانية معينة.'],
            ['key' => 'landing.features.reports_title', 'en' => 'Granular Performance Reports', 'ar' => 'تقارير أداء تفصيلية'],
            ['key' => 'landing.features.subtitle', 'en' => 'Our platform offers industry-leading tools and seamless configurations so you can focus entirely on producing high-quality content.', 'ar' => 'تقدم منصتنا أدوات رائدة وتكوينات سلسة بحيث يمكنك التركيز بالكامل على إنتاج محتوى عالي الجودة.'],
            ['key' => 'landing.features.sync_desc', 'en' => 'Connect Google Ad Manager directly. Automatically fetch billing data, impressions, clicks, gross revenues, and views hourly.', 'ar' => 'اربط Google Ad Manager مباشرة. قم بجلب بيانات الفواتير، عدد الظهور، النقرات، إجمالي الإيرادات، والمشاهدات تلقائياً كل ساعة.'],
            ['key' => 'landing.features.sync_title', 'en' => 'GAM Auto-Sync', 'ar' => 'المزامنة التلقائية مع GAM'],
            ['key' => 'landing.features.tag', 'en' => 'Features', 'ar' => 'المميزات'],
            ['key' => 'landing.features.tag_desc', 'en' => 'Instantly generate clean GPT header and body codes. Customize refresh rates, anchor/float triggers, and anti-adblock tools.', 'ar' => 'قم بإنشاء أكواد GPT نظيفة للهيدر والبودي على الفور. قم بتخصيص معدلات التحديث، مشغلات التثبيت/العائمة، وأدوات مكافحة حظر الإعلانات.'],
            ['key' => 'landing.features.tag_title', 'en' => 'Anti-Tamper Tag Generator', 'ar' => 'مولد أكواد مانع للتلاعب'],
            ['key' => 'landing.features.title', 'en' => 'Built For Professional Publishers', 'ar' => 'مصممة للناشرين المحترفين'],
            ['key' => 'landing.footer.access', 'en' => 'Access', 'ar' => 'الوصول'],
            ['key' => 'landing.footer.all_rights', 'en' => 'All rights reserved.', 'ar' => 'جميع الحقوق محفوظة.'],
            ['key' => 'landing.footer.desc', 'en' => 'A premium, automated ad optimization suite for publishers using Google Ad Manager. Harness advanced tag generation, robust syncing, and instant payouts.', 'ar' => 'مجموعة أدوات تحسين إعلانات متميزة وتلقائية للناشرين الذين يستخدمون Google Ad Manager. استفد من إنشاء الأكواد المتقدم، والمزامنة القوية، والمدفوعات الفورية.'],
            ['key' => 'landing.footer.empowering', 'en' => 'Empowering publishers through transparent ad metrics.', 'ar' => 'تمكين الناشرين من خلال مقاييس إعلانية شفافة.'],
            ['key' => 'landing.footer.gam_help', 'en' => 'Google Ad Manager Help', 'ar' => 'مساعدة Google Ad Manager'],
            ['key' => 'landing.footer.info', 'en' => 'Information', 'ar' => 'المعلومات'],
            ['key' => 'landing.footer.information', 'en' => 'Information', 'ar' => 'المعلومات'],
            ['key' => 'landing.footer.platform', 'en' => 'Platform', 'ar' => 'المنصة'],
            ['key' => 'landing.footer.subtext', 'en' => 'Empowering publishers through transparent ad metrics.', 'ar' => 'تمكين الناشرين من خلال مقاييس إعلانية شفافة.'],
            ['key' => 'landing.footer.support_hub', 'en' => 'Support Hub', 'ar' => 'مركز الدعم'],
            ['key' => 'landing.get_started', 'en' => 'Get Started', 'ar' => 'البدء'],
            ['key' => 'landing.hero.badge', 'en' => 'Automated Google Ad Manager Optimization', 'ar' => 'تحسين تلقائي لإعلانات Google Ad Manager'],
            ['key' => 'landing.hero.desc', 'en' => 'A premium, high-performance platform for smart publishers. Seamlessly synchronize with Google Ad Manager, generate secure GPT codes, track real-time analytics, and secure payouts.', 'ar' => 'منصة متميزة وعالية الأداء للناشرين الأذكياء. قم بمزامنة إعلاناتك بسلاسة مع Google Ad Manager، وإنشاء رموز GPT آمنة، وتتبع التحليلات في الوقت الفعلي، وتأمين مدفوعاتك.'],
            ['key' => 'landing.hero.title_part1', 'en' => 'Scale Your Publisher Earnings', 'ar' => 'ضاعف أرباحك كناشر'],
            ['key' => 'landing.hero.title_part2', 'en' => 'With', 'ar' => 'مع'],
            ['key' => 'landing.modal.certified', 'en' => 'Transaction Certified', 'ar' => 'معاملة معتمدة'],
            ['key' => 'landing.modal.close', 'en' => 'Close Receipt', 'ar' => 'إغلاق الإيصال'],
            ['key' => 'landing.modal.date', 'en' => 'Issue Date:', 'ar' => 'تاريخ الإصدار:'],
            ['key' => 'landing.modal.note', 'en' => 'This payout was verified via banking network records and signed by {site_name} Treasury.', 'ar' => 'تم التحقق من هذه الدفعة عبر سجلات الشبكة المصرفية وموقعة من قبل خزينة {site_name}.'],
            ['key' => 'landing.modal.recipient', 'en' => 'Recipient:', 'ar' => 'المستلم:'],
            ['key' => 'landing.modal.route', 'en' => 'Payment Route:', 'ar' => 'طريقة الدفع:'],
            ['key' => 'landing.modal.title', 'en' => 'Payment Receipt', 'ar' => 'إيصال الدفع'],
            ['key' => 'landing.modal.total', 'en' => 'Total Disbursed:', 'ar' => 'إجمالي المدفوع:'],
            ['key' => 'landing.nav.calculator', 'en' => 'Calculator', 'ar' => 'الحاسبة'],
            ['key' => 'landing.nav.faqs', 'en' => 'FAQs', 'ar' => 'الأسئلة الشائعة'],
            ['key' => 'landing.nav.features', 'en' => 'Features', 'ar' => 'المميزات'],
            ['key' => 'landing.nav.how_it_works', 'en' => 'How it Works', 'ar' => 'كيف يعمل'],
            ['key' => 'landing.nav.payouts_proof', 'en' => 'Payouts Proof', 'ar' => 'إثباتات الدفع'],
            ['key' => 'landing.nav.support', 'en' => 'Support Hub', 'ar' => 'مركز الدعم'],
            ['key' => 'landing.proof.method_wire', 'en' => 'Wire Transfer', 'ar' => 'تحويل بنكي'],
            ['key' => 'landing.proof.pub1', 'en' => 'AlphaMedia Group (US)', 'ar' => 'مجموعة ألفا ميديا (أمريكا)'],
            ['key' => 'landing.proof.pub2', 'en' => 'Cairo Tech Blog (EG)', 'ar' => 'مدونة كايرو تك (مصر)'],
            ['key' => 'landing.proof.pub3', 'en' => 'ByteDev Solutions (UK)', 'ar' => 'بايت ديف للحلول (بريطانيا)'],
            ['key' => 'landing.proof.pub4', 'en' => 'Riyadh News Hub (SA)', 'ar' => 'مركز أخبار الرياضة (السعودية)'],
            ['key' => 'landing.proof.pub5', 'en' => 'Munich Auto Forum (DE)', 'ar' => 'منتدى ميونخ للسيارات (ألمانيا)'],
            ['key' => 'landing.proofs.amount', 'en' => 'Amount', 'ar' => 'المبلغ'],
            ['key' => 'landing.proofs.date', 'en' => 'Date', 'ar' => 'التاريخ'],
            ['key' => 'landing.proofs.paid', 'en' => 'Paid', 'ar' => 'مدفوع'],
            ['key' => 'landing.proofs.publisher', 'en' => 'Publisher', 'ar' => 'الناشر'],
            ['key' => 'landing.proofs.status', 'en' => 'Status', 'ar' => 'الحالة'],
            ['key' => 'landing.proofs.subtitle', 'en' => 'Transparency is our core value. View the ledger of our most recent publisher payouts processed during the monthly closing cycles.', 'ar' => 'الشفافية هي قيمتنا الأساسية. اعرض قائمة بأحدث مدفوعات الناشرين التي تمت معالجتها خلال دورات الإغلاق الشهرية.'],
            ['key' => 'landing.proofs.tag', 'en' => 'Transfers', 'ar' => 'التحويلات الدورية'],
            ['key' => 'landing.proofs.title', 'en' => 'Verified Payout Proofs', 'ar' => 'إثباتات دفع معتمدة'],
            ['key' => 'landing.registration_closed', 'en' => 'Registration Closed', 'ar' => 'التسجيل مغلق'],
            ['key' => 'landing.stats.impressions', 'en' => 'Ad Impressions Served', 'ar' => 'ظهور الإعلانات المقدمة'],
            ['key' => 'landing.stats.publishers', 'en' => 'Active Global Publishers', 'ar' => 'الناشرون النشطون عالمياً'],
            ['key' => 'landing.stats.total_paid', 'en' => 'Total Paid to Publishers', 'ar' => 'إجمالي ما تم دفعه للناشرين'],
            ['key' => 'landing.stats.websites', 'en' => 'Approved Domains', 'ar' => 'النطاقات المعتمدة'],
            ['key' => 'landing.steps.step1_desc', 'en' => 'Register a publisher account and submit your domains for approval checks.', 'ar' => 'سجل حساب ناشر وقدم نطاقات مواقعك لمراجعتها والموافقة عليها.'],
            ['key' => 'landing.steps.step1_title', 'en' => 'Join Platform', 'ar' => 'انضم للمنصة'],
            ['key' => 'landing.steps.step2_desc', 'en' => 'Copy our structured lines to your domain\'s ads.txt directory to authenticate the inventory.', 'ar' => 'انسخ الأسطر المنظمة لملف ads.txt الخاص بنطاقك للتحقق من ملكية موقعك.'],
            ['key' => 'landing.steps.step2_title', 'en' => 'Deploy Ads.txt', 'ar' => 'انشر ملف Ads.txt'],
            ['key' => 'landing.steps.step3_desc', 'en' => 'Pick your desired ad placements and inject the secure scripts into your page templates.', 'ar' => 'اختر مواضع الإعلانات المطلوبة وضع الأكواد البرمجية الآمنة في قوالب صفحاتك.'],
            ['key' => 'landing.steps.step3_title', 'en' => 'Generate GPT Codes', 'ar' => 'أنشئ أكواد GPT'],
            ['key' => 'landing.steps.step4_desc', 'en' => 'Monitor performance daily. Receive payments at period close directly to your bank account.', 'ar' => 'راقب الأداء يومياً. استلم دفعاتك عند إغلاق الفترة مباشرة إلى حسابك المصرفي.'],
            ['key' => 'landing.steps.step4_title', 'en' => 'Collect Payouts', 'ar' => 'استلم الأرباح'],
            ['key' => 'landing.steps.subtitle', 'en' => 'Getting set up is incredibly simple. You can transition from registration to fully monetized traffic within a matter of minutes.', 'ar' => 'الإعداد بسيط للغاية. يمكنك الانتقال من التسجيل إلى تحقيق الأرباح من موقعك في غضون دقائق معدودة.'],
            ['key' => 'landing.steps.tag', 'en' => 'Pipeline', 'ar' => 'خطوات العمل'],
            ['key' => 'landing.steps.title', 'en' => 'Start Monetizing In 4 Steps', 'ar' => 'ابدأ تحقيق الأرباح في 4 خطوات'],
            ['key' => 'nav.audit_log', 'en' => 'Audit Log', 'ar' => 'سجلات التدقيق'],
            ['key' => 'nav.dashboard', 'en' => 'Dashboard', 'ar' => 'لوحة التحكم'],
            ['key' => 'nav.logout', 'en' => 'Logout', 'ar' => 'تسجيل الخروج'],
            ['key' => 'nav.main_menu', 'en' => 'Main Menu', 'ar' => 'القائمة الرئيسية'],
            ['key' => 'nav.my_earnings', 'en' => 'My Earnings', 'ar' => 'أرباحي'],
            ['key' => 'nav.my_payouts', 'en' => 'My Payouts', 'ar' => 'مدفوعاتي'],
            ['key' => 'nav.my_websites', 'en' => 'My Websites', 'ar' => 'مواقعي'],
            ['key' => 'nav.payouts', 'en' => 'Payouts', 'ar' => 'المدفوعات'],
            ['key' => 'nav.publisher_account', 'en' => 'Publisher Account', 'ar' => 'حساب الناشر'],
            ['key' => 'nav.publisher_portal', 'en' => 'Publisher Portal', 'ar' => 'بوابة الناشر'],
            ['key' => 'nav.publishers', 'en' => 'Publishers', 'ar' => 'الناشرون'],
            ['key' => 'nav.revenue', 'en' => 'Revenue', 'ar' => 'الإيرادات'],
            ['key' => 'nav.settings', 'en' => 'Settings', 'ar' => 'الإعدادات'],
            ['key' => 'nav.sync_log', 'en' => 'Sync Log', 'ar' => 'سجل المزامنة'],
            ['key' => 'nav.translations', 'en' => 'Translations', 'ar' => 'الترجمات'],
            ['key' => 'nav.websites', 'en' => 'Websites', 'ar' => 'المواقع'],
            ['key' => 'page_url', 'en' => '${siteUrl}', 'ar' => '${siteUrl}'],
            ['key' => 'pages.toast_load_fail', 'en' => 'Failed to load pages', 'ar' => 'فشل تحميل الصفحات'],
            ['key' => 'pages.title_required', 'en' => 'Title is required', 'ar' => 'العنوان مطلوب'],
            ['key' => 'pages.slug_required', 'en' => 'Slug is required', 'ar' => 'المعرف (Slug) مطلوب'],
            ['key' => 'pages.content_required', 'en' => 'Content is required', 'ar' => 'المحتوى مطلوب'],
            ['key' => 'pages.toast_updated', 'en' => 'Page updated successfully', 'ar' => 'تم تحديث الصفحة بنجاح'],
            ['key' => 'pages.toast_created', 'en' => 'Page created successfully', 'ar' => 'تم إنشاء الصفحة بنجاح'],
            ['key' => 'pages.toast_save_fail', 'en' => 'Failed to save page', 'ar' => 'فشل حفظ الصفحة'],
            ['key' => 'pages.confirm_delete', 'en' => 'Are you sure you want to delete this page? This action cannot be undone.', 'ar' => 'هل أنت متأكد من حذف هذه الصفحة؟ لا يمكن التراجع عن هذا الإجراء.'],
            ['key' => 'pages.toast_deleted', 'en' => 'Page deleted successfully', 'ar' => 'تم حذف الصفحة بنجاح'],
            ['key' => 'pages.toast_delete_fail', 'en' => 'Failed to delete page', 'ar' => 'فشل حذف الصفحة'],
            ['key' => 'pages.loading', 'en' => 'Loading pages…', 'ar' => 'جاري تحميل الصفحات…'],
            ['key' => 'pages.title', 'en' => 'Page Management', 'ar' => 'إدارة الصفحات'],
            ['key' => 'pages.subtitle', 'en' => 'Add and edit dynamic pages (Privacy Policy, Terms, etc.) and specify where they appear', 'ar' => 'إضافة وتعديل الصفحات الديناميكية (سياسة الخصوصية، الشروط، إلخ) وتحديد مكان ظهورها'],
            ['key' => 'pages.new_page_btn', 'en' => 'New Page', 'ar' => 'صفحة جديدة'],
            ['key' => 'pages.no_pages', 'en' => 'No custom pages created yet', 'ar' => 'لم يتم إنشاء أي صفحات مخصصة بعد'],
            ['key' => 'pages.no_pages_hint', 'en' => 'Click "New Page" to create one', 'ar' => 'انقر على "صفحة جديدة" لإنشاء واحدة'],
            ['key' => 'pages.col_slug', 'en' => 'Slug', 'ar' => 'المعرف (Slug)'],
            ['key' => 'pages.col_display_locations', 'en' => 'Display Locations', 'ar' => 'أماكن العرض'],
            ['key' => 'pages.public_footer', 'en' => 'Public Footer', 'ar' => 'تذييل الصفحة العام'],
            ['key' => 'pages.publisher_footer', 'en' => 'Publisher Footer', 'ar' => 'تذييل صفحة الناشر'],
            ['key' => 'pages.landing_menu', 'en' => 'Landing Menu', 'ar' => 'قائمة الهبوط'],
            ['key' => 'pages.hidden', 'en' => 'Hidden', 'ar' => 'مخفية'],
            ['key' => 'pages.edit_page', 'en' => 'Edit Page', 'ar' => 'تعديل الصفحة'],
            ['key' => 'pages.new_page', 'en' => 'New Page', 'ar' => 'صفحة جديدة'],
            ['key' => 'pages.page_title_label', 'en' => 'Page Title (English)', 'ar' => 'عنوان الصفحة (بالإنجليزي)'],
            ['key' => 'pages.page_title_ar_label', 'en' => 'Page Title (Arabic)', 'ar' => 'عنوان الصفحة (بالعربي)'],
            ['key' => 'pages.title_placeholder', 'en' => 'e.g. Privacy Policy', 'ar' => 'مثال: Privacy Policy'],
            ['key' => 'pages.title_ar_placeholder', 'en' => 'e.g. سياسة الخصوصية', 'ar' => 'مثال: سياسة الخصوصية'],
            ['key' => 'pages.slug_label', 'en' => 'Slug', 'ar' => 'المعرف (Slug)'],
            ['key' => 'pages.url_path', 'en' => 'URL path identifier', 'ar' => 'معرف مسار الرابط'],
            ['key' => 'pages.slug_placeholder', 'en' => 'e.g. privacy-policy', 'ar' => 'مثال: privacy-policy'],
            ['key' => 'pages.content_label', 'en' => 'Page Content (English)', 'ar' => 'محتوى الصفحة (بالإنجليزي)'],
            ['key' => 'pages.content_ar_label', 'en' => 'Page Content (Arabic)', 'ar' => 'محتوى الصفحة (بالعربي)'],
            ['key' => 'pages.placement_visibility', 'en' => 'Placement & Visibility', 'ar' => 'أماكن الظهور والظهور العام'],
            ['key' => 'pages.show_in_public_footer', 'en' => 'Show in Public Footer (Landing & Support Pages)', 'ar' => 'عرض في تذييل الصفحة العام (صفحات الهبوط والدعم)'],
            ['key' => 'pages.show_in_publisher_footer', 'en' => 'Show in Publisher Dashboard Footer', 'ar' => 'عرض في تذييل لوحة تحكم الناشر'],
            ['key' => 'pages.show_in_landing_menu', 'en' => 'Show in Landing Page Navigation Menu', 'ar' => 'عرض في قائمة التنقل لصفحة الهبوط'],
            ['key' => 'pages.is_active', 'en' => 'Page is Active and Published', 'ar' => 'الصفحة نشطة ومنشورة'],
            ['key' => 'pages.update_page', 'en' => 'Update Page', 'ar' => 'تحديث الصفحة'],
            ['key' => 'pages.create_page', 'en' => 'Create Page', 'ar' => 'إنشاء الصفحة'],
            ['key' => 'support.hero_desc', 'en' => 'Have a question about Google Ad Manager setup, payment channels, or custom layouts? Send us a message or connect directly via Telegram or WhatsApp.', 'ar' => 'هل لديك سؤال حول إعداد Google Ad Manager أو قنوات الدفع أو التخطيطات المخصصة؟ أرسل لنا رسالة أو تواصل معنا مباشرة عبر تليجرام أو واتساب.'],
            ['key' => 'support.send_message', 'en' => 'Send Message', 'ar' => 'إرسال رسالة'],
            ['key' => 'support.form_desc', 'en' => 'Fill in the details below to open a ticket. Your request will be routed directly to our administration team.', 'ar' => 'املأ التفاصيل أدناه لفتح تذكرة دعم. سيتم توجيه طلبك مباشرة إلى فريق الإدارة لدينا.'],
            ['key' => 'support.full_name', 'en' => 'Full Name', 'ar' => 'الاسم الكامل'],
            ['key' => 'support.name_placeholder', 'en' => 'Enter your name', 'ar' => 'أدخل اسمك'],
            ['key' => 'support.subject', 'en' => 'Subject', 'ar' => 'الموضوع'],
            ['key' => 'support.subject_placeholder', 'en' => 'Ad unit generation, Payments delay, etc.', 'ar' => 'إنشاء الوحدات الإعلانية، تأخر الدفع، إلخ.'],
            ['key' => 'support.message_details', 'en' => 'Message Details', 'ar' => 'تفاصيل الرسالة'],
            ['key' => 'support.message_placeholder', 'en' => 'Describe your issue or question in details...', 'ar' => 'صف مشكلتك أو سؤالك بالتفصيل...'],
            ['key' => 'support.dispatching', 'en' => 'Dispatching message…', 'ar' => 'جاري إرسال الرسالة…'],
            ['key' => 'support.submit_ticket', 'en' => 'Submit Ticket', 'ar' => 'إرسال التذكرة'],
            ['key' => 'support.thank_you', 'en' => 'Thank You!', 'ar' => 'شكرًا لك!'],
            ['key' => 'support.success_desc', 'en' => 'Your message has been sent successfully. Our support desk will reach out to you at the email provided shortly.', 'ar' => 'تم إرسال رسالتك بنجاح. سيتواصل معك مكتب الدعم الفني لدينا على البريد الإلكتروني المقدم قريبًا.'],
            ['key' => 'support.send_another', 'en' => 'Send Another Message', 'ar' => 'إرسال رسالة أخرى'],
            ['key' => 'support.live_channels', 'en' => 'Live Channels', 'ar' => 'القنوات المباشرة'],
            ['key' => 'support.telegram_channel', 'en' => 'Telegram Channel', 'ar' => 'قناة تليجرام'],
            ['key' => 'support.telegram_value', 'en' => '@BestRevenueSupport', 'ar' => '@BestRevenueSupport'],
            ['key' => 'support.open_telegram', 'en' => 'Open Telegram ↗', 'ar' => 'افتح تليجرام ↗'],
            ['key' => 'support.whatsapp_support', 'en' => 'WhatsApp Support', 'ar' => 'دعم واتساب'],
            ['key' => 'support.whatsapp_value', 'en' => 'Direct Chat Integration', 'ar' => 'محادثة مباشرة'],
            ['key' => 'support.start_chatting', 'en' => 'Start Chatting ↗', 'ar' => 'ابدأ المحادثة ↗'],
            ['key' => 'support.official_email', 'en' => 'Official Email', 'ar' => 'البريد الإلكتروني الرسمي'],
            ['key' => 'support.send_mail', 'en' => 'Send Mail ↗', 'ar' => 'إرسال بريد ↗'],
            ['key' => 'payout.amount', 'en' => 'Amount', 'ar' => 'المبلغ'],
            ['key' => 'payout.approve', 'en' => 'Approve', 'ar' => 'موافقة'],
            ['key' => 'payout.mark_paid', 'en' => 'Mark as Paid', 'ar' => 'تحديد كمدفوع'],
            ['key' => 'payout.period', 'en' => 'Period', 'ar' => 'الفترة'],
            ['key' => 'payout.reject', 'en' => 'Reject', 'ar' => 'رفض'],
            ['key' => 'payout.status.approved', 'en' => 'Approved', 'ar' => 'موافق عليه'],
            ['key' => 'payout.status.paid', 'en' => 'Paid', 'ar' => 'مدفوع'],
            ['key' => 'payout.status.pending', 'en' => 'Pending', 'ar' => 'في الانتظار'],
            ['key' => 'payout.status.rejected', 'en' => 'Rejected', 'ar' => 'مرفوض'],
            ['key' => 'payout.threshold_alert', 'en' => 'Below minimum payout threshold', 'ar' => 'أقل من الحد الأدنى للدفع'],
            ['key' => 'payouts.count', 'en' => '{count} payouts', 'ar' => '{count} دفعات'],
            ['key' => 'payouts.count_filtered', 'en' => '{filtered} of {total} payouts', 'ar' => '{filtered} من {total} دفعات'],
            ['key' => 'payouts.filters.month', 'en' => 'Month', 'ar' => 'الشهر'],
            ['key' => 'payouts.filters.year', 'en' => 'Year', 'ar' => 'السنة'],
            ['key' => 'payouts.months.all', 'en' => 'All Months', 'ar' => 'كل الشهور'],
            ['key' => 'payouts.rejection_reason', 'en' => 'Reason:', 'ar' => 'السبب:'],
            ['key' => 'payouts.stats.available_sub', 'en' => 'Approved & awaiting next payment cycle', 'ar' => 'معتمد وبانتظار دورة الدفع القادمة'],
            ['key' => 'payouts.stats.paid_count', 'en' => '{count} paid payouts', 'ar' => '{count} دفعات مكتملة'],
            ['key' => 'payouts.stats.total_paid', 'en' => 'Total Paid Out', 'ar' => 'إجمالي ما تم دفعه'],
            ['key' => 'payouts.status.rejected', 'en' => 'Rejected', 'ar' => 'مرفوض'],
            ['key' => 'payouts.table.adjustment', 'en' => 'Adjustment', 'ar' => 'التعديل'],
            ['key' => 'payouts.table.base_amount', 'en' => 'Base Amount', 'ar' => 'المبلغ الأساسي'],
            ['key' => 'payouts.table.final_amount', 'en' => 'Final Amount', 'ar' => 'المبلغ النهائي'],
            ['key' => 'payouts.table.method', 'en' => 'Method / Account', 'ar' => 'طريقة الدفع / الحساب'],
            ['key' => 'payouts.table.no_data', 'en' => 'No payouts yet', 'ar' => 'لا توجد مدفوعات بعد'],
            ['key' => 'payouts.table.no_data_desc', 'en' => 'Payouts are generated at end of each month', 'ar' => 'يتم إنشاء المدفوعات في نهاية كل شهر'],
            ['key' => 'payouts.table.paid_at', 'en' => 'Paid At', 'ar' => 'تاريخ الدفع'],
            ['key' => 'payouts.table.period', 'en' => 'Period', 'ar' => 'الفترة'],
            ['key' => 'payouts.table.reference', 'en' => 'Reference', 'ar' => 'المرجع'],
            ['key' => 'payouts.table.status', 'en' => 'Status', 'ar' => 'الحالة'],
            ['key' => 'payouts.table.totals_count', 'en' => 'Totals ({count})', 'ar' => 'الإجماليات ({count})'],
            ['key' => 'payouts.title', 'en' => 'My Payouts', 'ar' => 'مدفوعاتي'],
            ['key' => 'payouts.toast_failed', 'en' => 'Failed to load payouts', 'ar' => 'فشل تحميل المدفوعات'],
            ['key' => 'payouts.total_paid', 'en' => 'total paid', 'ar' => 'إجمالي المدفوع'],
            ['key' => 'payouts.years.all', 'en' => 'All Years', 'ar' => 'كل السنوات'],
            ['key' => 'revenue.ad_unit', 'en' => 'Ad Unit', 'ar' => 'وحدة الإعلان'],
            ['key' => 'revenue.clicks', 'en' => 'Clicks', 'ar' => 'النقرات'],
            ['key' => 'revenue.country', 'en' => 'Country', 'ar' => 'الدولة'],
            ['key' => 'revenue.cpm', 'en' => 'CPM', 'ar' => 'التكلفة لكل ألف'],
            ['key' => 'revenue.ctr', 'en' => 'CTR', 'ar' => 'نسبة النقر'],
            ['key' => 'revenue.date', 'en' => 'Date', 'ar' => 'التاريخ'],
            ['key' => 'revenue.earnings', 'en' => 'Earnings', 'ar' => 'الأرباح'],
            ['key' => 'revenue.export_pdf', 'en' => 'Export PDF', 'ar' => 'تصدير PDF'],
            ['key' => 'revenue.filters.status', 'en' => 'Status', 'ar' => 'الحالة'],
            ['key' => 'revenue.gross', 'en' => 'Gross Revenue', 'ar' => 'الإيراد الإجمالي'],
            ['key' => 'revenue.impressions', 'en' => 'Impressions', 'ar' => 'المشاهدات'],
            ['key' => 'revenue.stats.total_earnings', 'en' => 'Total Earnings', 'ar' => 'إجمالي الأرباح'],
            ['key' => 'revenue.status.all', 'en' => 'All Statuses', 'ar' => 'جميع الحالات'],
            ['key' => 'revenue.status.closed', 'en' => 'Closed', 'ar' => 'مغلق'],
            ['key' => 'revenue.subtitle', 'en' => '{count} records', 'ar' => '{count} سجلات'],
            ['key' => 'revenue.table.ad_unit', 'en' => 'Ad Unit', 'ar' => 'الوحدة الإعلانية'],
            ['key' => 'revenue.table.cpm', 'en' => 'My CPM', 'ar' => 'معدل الألف ظهور الخاص بي'],
            ['key' => 'revenue.table.ctr', 'en' => 'CTR', 'ar' => 'نسبة النقر إلى الظهور'],
            ['key' => 'revenue.table.date', 'en' => 'Date', 'ar' => 'التاريخ'],
            ['key' => 'revenue.table.earnings', 'en' => 'My Earnings', 'ar' => 'أرباحي'],
            ['key' => 'revenue.table.impressions', 'en' => 'Impressions', 'ar' => 'الظهور'],
            ['key' => 'revenue.table.no_data', 'en' => 'No revenue for this period', 'ar' => 'لا توجد إيرادات لهذه الفترة'],
            ['key' => 'revenue.table.status', 'en' => 'Status', 'ar' => 'الحالة'],
            ['key' => 'revenue.table.totals', 'en' => 'Totals', 'ar' => 'الإجماليات'],
            ['key' => 'revenue.title', 'en' => 'My Revenue', 'ar' => 'أرباحي'],
            ['key' => 'revenue.toast_failed', 'en' => 'Failed to load revenue', 'ar' => 'فشل تحميل الإيرادات'],
            ['key' => 'settings.active_payout_title', 'en' => 'Active Payout Setup', 'ar' => 'إعدادات الدفع النشطة'],
            ['key' => 'settings.change_password_btn', 'en' => 'Change Password', 'ar' => 'تغيير كلمة المرور'],
            ['key' => 'settings.changing_password', 'en' => 'Changing Password...', 'ar' => 'جاري تغيير كلمة المرور...'],
            ['key' => 'settings.confirm_password_label', 'en' => 'Confirm New Password', 'ar' => 'تأكيد كلمة المرور الجديدة'],
            ['key' => 'settings.contact_fail', 'en' => 'Failed to update contact info.', 'ar' => 'فشل تحديث معلومات الاتصال.'],
            ['key' => 'settings.contact_success', 'en' => 'Contact information updated successfully!', 'ar' => 'تم تحديث معلومات الاتصال بنجاح!'],
            ['key' => 'settings.country_label', 'en' => 'Country (Read-only)', 'ar' => 'الدولة (للقراءة فقط)'],
            ['key' => 'settings.country_lock_title', 'en' => 'Country cannot be changed', 'ar' => 'لا يمكن تغيير الدولة'],
            ['key' => 'settings.current_password_label', 'en' => 'Current Password', 'ar' => 'كلمة المرور الحالية'],
            ['key' => 'settings.destination_details_title', 'en' => 'Destination Details', 'ar' => 'تفاصيل الحساب المستلم'],
            ['key' => 'settings.email_label', 'en' => 'Email Address (Read-only)', 'ar' => 'عنوان البريد الإلكتروني (للقراءة فقط)'],
            ['key' => 'settings.email_lock_title', 'en' => 'Email address cannot be changed', 'ar' => 'لا يمكن تغيير البريد الإلكتروني'],
            ['key' => 'settings.fullname_label', 'en' => 'Full Name / Company Name', 'ar' => 'الاسم الكامل / اسم الشركة'],
            ['key' => 'settings.fullname_placeholder', 'en' => 'Enter your name', 'ar' => 'أدخل اسمك'],
            ['key' => 'settings.min_threshold', 'en' => 'Minimum Threshold:', 'ar' => 'الحد الأدنى للدفع:'],
            ['key' => 'settings.min_threshold_label', 'en' => 'Min. Threshold:', 'ar' => 'الحد الأدنى للدفع:'],
            ['key' => 'settings.new_password_label', 'en' => 'New Password', 'ar' => 'كلمة المرور الجديدة'],
            ['key' => 'settings.new_password_placeholder', 'en' => '•••••••• (Min. 8 characters)', 'ar' => '•••••••• (الحد الأدنى 8 أحرف)'],
            ['key' => 'settings.no_payment_configured', 'en' => 'No Payment Method Configured', 'ar' => 'لم يتم إعداد طريقة دفع'],
            ['key' => 'settings.no_payment_configured_desc', 'en' => 'Please configure your payment details on the left to receive payouts.', 'ar' => 'يرجى تهيئة تفاصيل الدفع الخاصة بك على اليسار لتلقي مستحقاتك.'],
            ['key' => 'settings.password_fail', 'en' => 'Failed to change password.', 'ar' => 'فشل تغيير كلمة المرور.'],
            ['key' => 'settings.password_match_fail', 'en' => 'New password and confirmation do not match.', 'ar' => 'كلمة المرور الجديدة وتأكيدها غير متطابقين.'],
            ['key' => 'settings.password_success', 'en' => 'Password changed successfully!', 'ar' => 'تم تغيير كلمة المرور بنجاح!'],
            ['key' => 'settings.payment_card_title', 'en' => 'Payment Account Information', 'ar' => 'معلومات حساب الدفع'],
            ['key' => 'settings.payment_destination_label', 'en' => 'Payment Destination Account details', 'ar' => 'تفاصيل حساب استلام الدفع'],
            ['key' => 'settings.payment_destination_placeholder', 'en' => 'Enter bank account info, IBAN, PayPal email, or crypto address details exactly as required by the platform instructions.', 'ar' => 'أدخل تفاصيل الحساب البنكي، أو رقم الآيبان IBAN، أو بريد باي بال الإلكتروني، أو عنوان العملة الرقمية بدقة كما هو مطلوب.'],
            ['key' => 'settings.payment_fail', 'en' => 'Failed to update payment settings.', 'ar' => 'فشل تحديث إعدادات الدفع.'],
            ['key' => 'settings.payment_method_label', 'en' => 'Preferred Payout Method', 'ar' => 'طريقة الدفع المفضلة'],
            ['key' => 'settings.payment_method_tab', 'en' => 'Payment Method', 'ar' => 'طريقة الدفع'],
            ['key' => 'settings.payment_required', 'en' => 'Both payment method and account details are required.', 'ar' => 'كل من طريقة الدفع وتفاصيل الحساب مطلوبة.'],
            ['key' => 'settings.payment_success', 'en' => 'Payment method settings updated!', 'ar' => 'تم تحديث إعدادات طريقة الدفع!'],
            ['key' => 'settings.payout_method_title', 'en' => 'Payout Method', 'ar' => 'طريقة الدفع'],
            ['key' => 'settings.payouts_info_tip', 'en' => 'Payouts are processed automatically according to our schedule once your available balance meets the minimum threshold.', 'ar' => 'تتم معالجة المدفوعات تلقائياً وفقاً لجدولنا بمجرد أن يلبي رصيدك المتاح الحد الأدنى للدفع.'],
            ['key' => 'settings.phone_label', 'en' => 'Phone / WhatsApp', 'ar' => 'الهاتف / واتساب'],
            ['key' => 'settings.profile_card_title', 'en' => 'Profile & Contact Details', 'ar' => 'الملف الشخصي وبيانات الاتصال'],
            ['key' => 'settings.profile_info_tab', 'en' => 'Profile Info', 'ar' => 'معلومات الملف الشخصي'],
            ['key' => 'settings.save_profile_btn', 'en' => 'Save Profile', 'ar' => 'حفظ الملف الشخصي'],
            ['key' => 'settings.saving_payment', 'en' => 'Saving Settings...', 'ar' => 'جاري حفظ الإعدادات...'],
            ['key' => 'settings.saving_profile', 'en' => 'Saving Changes...', 'ar' => 'جاري حفظ التغييرات...'],
            ['key' => 'settings.search_country_placeholder', 'en' => 'Search country...', 'ar' => 'البحث عن دولة...'],
            ['key' => 'settings.security_card_title', 'en' => 'Security & Password Preferences', 'ar' => 'تفضيلات الأمان وكلمة المرور'],
            ['key' => 'settings.security_tab', 'en' => 'Security', 'ar' => 'الأمان'],
            ['key' => 'settings.select_method_placeholder', 'en' => 'Select a payment method...', 'ar' => 'اختر طريقة دفع...'],
            ['key' => 'settings.subtitle', 'en' => 'Manage your profile contact details, payment information, and security preferences.', 'ar' => 'إدارة بيانات الاتصال، معلومات الدفع، وتفضيلات الأمان.'],
            ['key' => 'settings.telegram_label', 'en' => 'Telegram Handle', 'ar' => 'معرف تليجرام'],
            ['key' => 'settings.telegram_placeholder', 'en' => 'e.g. @myhandle', 'ar' => 'مثال: myhandle@'],
            ['key' => 'settings.title', 'en' => 'Settings', 'ar' => 'الإعدادات'],
            ['key' => 'settings.update_payment_btn', 'en' => 'Update Payment Info', 'ar' => 'تحديث معلومات الدفع'],
            ['key' => 'support.dispatching', 'en' => 'Dispatching message…', 'ar' => 'جاري إرسال الرسالة…'],
            ['key' => 'support.enter_name', 'en' => 'Enter your name', 'ar' => 'أدخل اسمك'],
            ['key' => 'support.form_desc', 'en' => 'Fill in the details below to open a ticket. Your request will be routed directly to our administration team.', 'ar' => 'املأ التفاصيل أدناه لفتح تذكرة. سيتم توجيه طلبك مباشرة إلى فريق الإدارة لدينا.'],
            ['key' => 'support.hero_desc', 'en' => 'Have a question about Google Ad Manager setup, payment channels, or custom layouts? Send us a message or connect directly via Telegram or WhatsApp.', 'ar' => 'هل لديك سؤال حول إعداد Google Ad Manager، أو قنوات الدفع، أو التنسيقات المخصصة؟ أرسل لنا رسالة أو تواصل مباشرة عبر تليجرام أو واتساب.'],
            ['key' => 'support.live_channels', 'en' => 'Live Channels', 'ar' => 'قنوات الدعم المباشر'],
            ['key' => 'support.message_details', 'en' => 'Message Details', 'ar' => 'تفاصيل الرسالة'],
            ['key' => 'support.message_placeholder', 'en' => 'Describe your issue or question in details...', 'ar' => 'صف مشكلتك أو سؤالك بالتفصيل...'],
            ['key' => 'support.official_email', 'en' => 'Official Email', 'ar' => 'البريد الإلكتروني الرسمي'],
            ['key' => 'support.open_telegram', 'en' => 'Open Telegram ↗', 'ar' => 'افتح تليجرام ↗'],
            ['key' => 'support.send_another', 'en' => 'Send Another Message', 'ar' => 'إرسال رسالة أخرى'],
            ['key' => 'support.send_mail', 'en' => 'Send Mail ↗', 'ar' => 'إرسال بريد إلكتروني ↗'],
            ['key' => 'support.send_message', 'en' => 'Send Message', 'ar' => 'أرسل رسالة'],
            ['key' => 'support.start_chatting', 'en' => 'Start Chatting ↗', 'ar' => 'ابدأ الدردشة ↗'],
            ['key' => 'support.subject', 'en' => 'Subject', 'ar' => 'الموضوع'],
            ['key' => 'support.subject_placeholder', 'en' => 'Ad unit generation, Payments delay, etc.', 'ar' => 'توليد الوحدات الإعلانية، تأخير الدفع، إلخ.'],
            ['key' => 'support.submit_ticket', 'en' => 'Submit Ticket', 'ar' => 'تقديم التذكرة'],
            ['key' => 'support.submitted_desc', 'en' => 'Your message has been sent successfully. Our support desk will reach out to you at the email provided shortly.', 'ar' => 'تم إرسال رسالتك بنجاح. سيتواصل معك مكتب الدعم الخاص بنا على البريد الإلكتروني المقدم قريباً.'],
            ['key' => 'support.telegram_channel', 'en' => 'Telegram Channel', 'ar' => 'قناة تليجرام'],
            ['key' => 'support.thank_you', 'en' => 'Thank You!', 'ar' => 'شكراً لك!'],
            ['key' => 'support.whatsapp_desc', 'en' => 'Direct Chat Integration', 'ar' => 'تكامل دردشة مباشر'],
            ['key' => 'support.whatsapp_support', 'en' => 'WhatsApp Support', 'ar' => 'دعم واتساب'],
            ['key' => 'tickets.active_warning', 'en' => 'You have an active support ticket. You must close or resolve it before you can open a new one.', 'ar' => 'لديك تذكرة دعم نشطة حالياً. يجب عليك إغلاقها أو حلها قبل فتح تذكرة جديدة.'],
            ['key' => 'tickets.already_active_title', 'en' => 'You already have an active ticket', 'ar' => 'لديك تذكرة نشطة بالفعل'],
            ['key' => 'tickets.assigned_agent_label', 'en' => 'Assigned Agent:', 'ar' => 'العميل المخصص للمتابعة:'],
            ['key' => 'tickets.back_btn', 'en' => 'Back to Support Tickets', 'ar' => 'العودة لتذاكر الدعم'],
            ['key' => 'tickets.cancel_btn', 'en' => 'Cancel', 'ar' => 'إلغاء'],
            ['key' => 'tickets.category_billing', 'en' => 'Billing', 'ar' => 'الفواتير والحسابات'],
            ['key' => 'tickets.category_billing_option', 'en' => 'Billing Inquiry', 'ar' => 'استفسار مالي / فواتير'],
            ['key' => 'tickets.category_gam', 'en' => 'GAM Sync', 'ar' => 'مزامنة GAM'],
            ['key' => 'tickets.category_gam_option', 'en' => 'Google Ad Manager Sync', 'ar' => 'مزامنة Google Ad Manager'],
            ['key' => 'tickets.category_label', 'en' => 'Category', 'ar' => 'القسم'],
            ['key' => 'tickets.category_other', 'en' => 'Other', 'ar' => 'أخرى'],
            ['key' => 'tickets.category_other_option', 'en' => 'Other Question', 'ar' => 'سؤال آخر'],
            ['key' => 'tickets.category_prefix', 'en' => 'Category:', 'ar' => 'القسم:'],
            ['key' => 'tickets.category_technical', 'en' => 'Technical', 'ar' => 'مشكلة تقنية'],
            ['key' => 'tickets.category_technical_option', 'en' => 'Technical Issue', 'ar' => 'مشكلة تقنية'],
            ['key' => 'tickets.close_ticket_btn', 'en' => 'Close Ticket', 'ar' => 'إغلاق التذكرة'],
            ['key' => 'tickets.closed_message_warning', 'en' => 'This ticket is closed. Please open a new ticket if you need more help or have other problems.', 'ar' => 'هذه التذكرة مغلقة. يرجى فتح تذكرة جديدة إذا كنت بحاجة إلى مزيد من المساعدة أو واجهت مشاكل أخرى.'],
            ['key' => 'tickets.confirm_close', 'en' => 'Are you sure you want to close this ticket?', 'ar' => 'هل أنت متأكد أنك تريد إغلاق هذه التذكرة؟'],
            ['key' => 'tickets.empty_subtitle', 'en' => 'If you have any questions, feel free to open a ticket above.', 'ar' => 'إذا كان لديك أي سؤال، فلا تتردد في فتح تذكرة جديدة أعلاه.'],
            ['key' => 'tickets.empty_title', 'en' => 'No support tickets found', 'ar' => 'لم يتم العثور على تذاكر دعم'],
            ['key' => 'tickets.filter_all', 'en' => 'All Tickets', 'ar' => 'جميع التذاكر'],
            ['key' => 'tickets.filter_status_label', 'en' => 'Filter Status', 'ar' => 'تصفية حسب الحالة'],
            ['key' => 'tickets.hide_filters', 'en' => 'Hide Filters', 'ar' => 'إخفاء الفلاتر'],
            ['key' => 'tickets.message_label', 'en' => 'Message Details', 'ar' => 'تفاصيل الرسالة'],
            ['key' => 'tickets.message_placeholder', 'en' => 'Please describe your problem or question in detail so we can assist you quickly...', 'ar' => 'يرجى وصف المشكلة بالتفصيل لمساعدتك بأسرع ما يمكن...'],
            ['key' => 'tickets.modal_title', 'en' => 'Create Support Ticket', 'ar' => 'إنشاء تذكرة دعم جديدة'],
            ['key' => 'tickets.open_ticket_btn', 'en' => 'Open Support Ticket', 'ar' => 'فتح تذكرة دعم فني'],
            ['key' => 'tickets.open_ticket_title', 'en' => 'Open a new ticket', 'ar' => 'افتح تذكرة جديدة'],
            ['key' => 'tickets.opened_by_prefix', 'en' => 'Opened by:', 'ar' => 'بواسطة:'],
            ['key' => 'tickets.priority_high', 'en' => 'High', 'ar' => 'عالية'],
            ['key' => 'tickets.priority_high_option', 'en' => 'High', 'ar' => 'عالية'],
            ['key' => 'tickets.priority_label', 'en' => 'Priority', 'ar' => 'الأولية'],
            ['key' => 'tickets.priority_low', 'en' => 'Low', 'ar' => 'منخفضة'],
            ['key' => 'tickets.priority_low_option', 'en' => 'Low', 'ar' => 'منخفضة'],
            ['key' => 'tickets.priority_medium', 'en' => 'Medium', 'ar' => 'متوسطة'],
            ['key' => 'tickets.priority_medium_option', 'en' => 'Medium', 'ar' => 'متوسطة'],
            ['key' => 'tickets.priority_prefix', 'en' => 'Priority:', 'ar' => 'الأولية:'],
            ['key' => 'tickets.priority_urgent', 'en' => 'Urgent', 'ar' => 'عاجلة'],
            ['key' => 'tickets.priority_urgent_option', 'en' => 'Urgent', 'ar' => 'عاجلة'],
            ['key' => 'tickets.reply_btn', 'en' => 'Reply', 'ar' => 'إرسال الرد'],
            ['key' => 'tickets.reply_placeholder', 'en' => 'Type your response here...', 'ar' => 'اكتب ردك هنا...'],
            ['key' => 'tickets.sending', 'en' => 'Sending...', 'ar' => 'جاري الإرسال...'],
            ['key' => 'tickets.show_filters', 'en' => 'Show Filters', 'ar' => 'عرض الفلاتر'],
            ['key' => 'tickets.status_closed', 'en' => 'Closed', 'ar' => 'مغلقة'],
            ['key' => 'tickets.status_in_progress', 'en' => 'In Progress', 'ar' => 'قيد المتابعة'],
            ['key' => 'tickets.status_open', 'en' => 'Open', 'ar' => 'مفتوحة'],
            ['key' => 'tickets.status_prefix', 'en' => 'Status:', 'ar' => 'الحالة:'],
            ['key' => 'tickets.status_resolved', 'en' => 'Resolved', 'ar' => 'تم حلها'],
            ['key' => 'tickets.subject_label', 'en' => 'Subject', 'ar' => 'الموضوع'],
            ['key' => 'tickets.subject_placeholder', 'en' => 'e.g. Google Ad Manager sync failing, Payout issue', 'ar' => 'مثال: فشل مزامنة إعلانات جوجل، مشكلة في المدفوعات'],
            ['key' => 'tickets.submit_btn', 'en' => 'Submit Ticket', 'ar' => 'تقديم التذكرة'],
            ['key' => 'tickets.submitting', 'en' => 'Submitting...', 'ar' => 'جاري التقديم...'],
            ['key' => 'tickets.subtitle', 'en' => 'Need help? Open a ticket to reach our administration team directly.', 'ar' => 'هل تحتاج لمساعدة؟ افتح تذكرة تواصل مباشرة مع فريق الإدارة.'],
            ['key' => 'tickets.support_expert', 'en' => 'Support Expert', 'ar' => 'خبير الدعم'],
            ['key' => 'tickets.table_agent', 'en' => 'Assigned Agent', 'ar' => 'العميل المخصص'],
            ['key' => 'tickets.table_category', 'en' => 'Category', 'ar' => 'القسم'],
            ['key' => 'tickets.table_priority', 'en' => 'Priority', 'ar' => 'الأولية'],
            ['key' => 'tickets.table_status', 'en' => 'Status', 'ar' => 'الحالة'],
            ['key' => 'tickets.table_subject', 'en' => 'Ticket Subject', 'ar' => 'موضوع التذكرة'],
            ['key' => 'tickets.table_updated', 'en' => 'Last Update', 'ar' => 'آخر تحديث'],
            ['key' => 'tickets.title', 'en' => 'Support Tickets', 'ar' => 'تذاكر الدعم الفني'],
            ['key' => 'tickets.toast_already_active', 'en' => 'You already have an active support ticket. Please resolve or close it before opening a new one.', 'ar' => 'لديك بالفعل تذكرة دعم نشطة. يرجى حلها أو إغلاقها قبل فتح تذكرة جديدة.'],
            ['key' => 'tickets.toast_close_fail', 'en' => 'Failed to close ticket.', 'ar' => 'فشل إغلاق التذكرة.'],
            ['key' => 'tickets.toast_close_success', 'en' => 'Ticket marked as closed.', 'ar' => 'تم وضع علامة على التذكرة كمغلقة.'],
            ['key' => 'tickets.toast_create_fail', 'en' => 'Failed to open ticket.', 'ar' => 'فشل فتح تذكرة دعم جديدة.'],
            ['key' => 'tickets.toast_detail_load_fail', 'en' => 'Failed to load ticket details', 'ar' => 'فشل تحميل تفاصيل التذكرة'],
            ['key' => 'tickets.toast_load_fail', 'en' => 'Failed to load tickets', 'ar' => 'فشل تحميل تذاكر الدعم'],
            ['key' => 'tickets.toast_reply_fail', 'en' => 'Failed to send reply.', 'ar' => 'فشل إرسال الرد.'],
            ['key' => 'tickets.toast_reply_success', 'en' => 'Message sent successfully!', 'ar' => 'تم إرسال الرسالة بنجاح!'],
            ['key' => 'tickets.toast_required_fields', 'en' => 'Subject and message details are required.', 'ar' => 'الموضوع وتفاصيل الرسالة مطلوبان.'],
            ['key' => 'tickets.toast_success', 'en' => 'Support ticket opened successfully!', 'ar' => 'تم فتح تذكرة الدعم بنجاح!'],
            ['key' => 'tickets.unassigned', 'en' => 'Unassigned', 'ar' => 'غير مخصص بعد'],
            ['key' => 'tickets.you', 'en' => 'You', 'ar' => 'أنت'],
            ['key' => 'websites.ad_units', 'en' => 'Ad Units', 'ar' => 'الوحدات الإعلانية'],
            ['key' => 'websites.contact_manager', 'en' => 'Contact your account manager to get started', 'ar' => 'اتصل بمدير حسابك للبدء'],
            ['key' => 'websites.get_code', 'en' => 'Get Code', 'ar' => 'الحصول على الكود'],
            ['key' => 'websites.loading_ad_units', 'en' => 'Loading ad units…', 'ar' => 'جاري تحميل الوحدات الإعلانية…'],
            ['key' => 'websites.modal.ad_type', 'en' => 'Ad Type:', 'ar' => 'نوع الإعلان:'],
            ['key' => 'websites.modal.ads_txt_desc', 'en' => 'Copy the entries below and append them to your site\'s root {code} file:', 'ar' => 'انسخ الأسطر أدناه وأضفها إلى ملف {code} في المجلد الرئيسي لموقعك:'],
            ['key' => 'websites.modal.ads_txt_title', 'en' => 'Ads.txt for {domain}', 'ar' => 'ملف Ads.txt لـ {domain}'],
            ['key' => 'websites.modal.body_code_desc', 'en' => '2. Body Code (Place where the ad should render)', 'ar' => '2. كود البودي (Body Code) - ضعه في المكان الذي تريد عرض الإعلان فيه:'],
            ['key' => 'websites.modal.code_title', 'en' => 'Ad Unit Code: {name}', 'ar' => 'كود الوحدة الإعلانية: {name}'],
            ['key' => 'websites.modal.copy_code', 'en' => 'Copy Code', 'ar' => 'نسخ الكود'],
            ['key' => 'websites.modal.copy_full', 'en' => 'Copy Full Block', 'ar' => 'نسخ الكود بالكامل'],
            ['key' => 'websites.modal.header_code_desc', 'en' => '1. Header Code (Place inside the {tag} section of your HTML page)', 'ar' => '1. كود الهيدر (Header Code) - ضعه داخل وسم {tag} في صفحتك:'],
            ['key' => 'websites.modal.toast_block_copied', 'en' => 'Code block copied!', 'ar' => 'تم نسخ الكود بالكامل!'],
            ['key' => 'websites.modal.toast_body_copied', 'en' => 'Body code copied!', 'ar' => 'تم نسخ كود البودي!'],
            ['key' => 'websites.modal.toast_copied', 'en' => 'Ads.txt copied to clipboard!', 'ar' => 'تم نسخ أسطر ads.txt إلى الحافظة!'],
            ['key' => 'websites.modal.toast_header_copied', 'en' => 'Header code copied!', 'ar' => 'تم نسخ كود الهيدر!'],
            ['key' => 'websites.no_ad_units', 'en' => 'No ad units yet', 'ar' => 'لا توجد وحدات إعلانية بعد'],
            ['key' => 'websites.no_websites', 'en' => 'No websites assigned yet', 'ar' => 'لم يتم تعيين أي مواقع بعد'],
            ['key' => 'websites.show_ads_txt', 'en' => 'Show ads.txt', 'ar' => 'عرض ملف ads.txt'],
            ['key' => 'websites.subtitle', 'en' => '{count} websites assigned to you', 'ar' => '{count} من المواقع المخصصة لك'],
            ['key' => 'websites.table.actions', 'en' => 'Actions', 'ar' => 'الإجراءات'],
            ['key' => 'websites.table.name', 'en' => 'Ad Unit Name', 'ar' => 'اسم الوحدة الإعلانية'],
            ['key' => 'websites.table.status', 'en' => 'Status', 'ar' => 'الحالة'],
            ['key' => 'websites.title', 'en' => 'My Websites', 'ar' => 'مواقعي الإلكترونية'],
            ['key' => 'websites.toast_adunits_failed', 'en' => 'Failed to load ad units', 'ar' => 'فشل تحميل الوحدات الإعلانية'],
            ['key' => 'websites.toast_failed', 'en' => 'Failed to load websites', 'ar' => 'فشل تحميل المواقع'],

            // Settings Page Keys
            ['key' => 'admin.settings.title', 'en' => 'Settings', 'ar' => 'الإعدادات'],
            ['key' => 'admin.settings.subtitle', 'en' => 'Global platform configuration', 'ar' => 'تكوين المنصة العام'],
            ['key' => 'admin.settings.unsaved_changes', 'en' => 'Unsaved changes', 'ar' => 'تعديلات غير محفوظة'],
            ['key' => 'admin.settings.clear', 'en' => 'Clear', 'ar' => 'مسح'],
            ['key' => 'admin.settings.asset_url_placeholder', 'en' => 'Or paste asset URL here...', 'ar' => 'أو الصق رابط الأصل هنا...'],
            ['key' => 'admin.settings.upload_file', 'en' => 'Upload File', 'ar' => 'تحميل ملف'],
            ['key' => 'admin.settings.payment_methods.desc', 'en' => 'Configure the payout methods publishers can choose from.', 'ar' => 'تكوين طرق الدفع التي يمكن للناشرين الاختيار من بينها.'],
            ['key' => 'admin.settings.payment_methods.method_number', 'en' => 'Method #{number}', 'ar' => 'طريقة #{number}'],
            ['key' => 'admin.settings.payment_methods.min_amount', 'en' => 'min ${amount}', 'ar' => 'الحد الأدنى ${amount}'],
            ['key' => 'admin.settings.payment_methods.number_badge', 'en' => '#{number}', 'ar' => '#{رقم}'],
            ['key' => 'admin.settings.payment_methods.remove', 'en' => 'Remove', 'ar' => 'إزالة'],
            ['key' => 'admin.settings.payment_methods.fields.name', 'en' => 'Payment Name (English)', 'ar' => 'اسم طريقة الدفع (بالإنجليزي)'],
            ['key' => 'admin.settings.payment_methods.fields.name_ar', 'en' => 'Payment Name (Arabic)', 'ar' => 'اسم طريقة الدفع (بالعربي)'],
            ['key' => 'admin.settings.payment_methods.fields.name_placeholder', 'en' => 'e.g. Bank Transfer, PayPal…', 'ar' => 'مثال: Bank Transfer, PayPal…'],
            ['key' => 'admin.settings.payment_methods.fields.name_ar_placeholder', 'en' => 'e.g. تحويل بنكي، بايبال…', 'ar' => 'مثال: تحويل بنكي، بايبال…'],
            ['key' => 'admin.settings.payment_methods.fields.min_payout', 'en' => 'Min Payout ($)', 'ar' => 'الحد الأدنى للدفع ($)'],
            ['key' => 'admin.settings.payment_methods.fields.min_payout_placeholder', 'en' => 'e.g. 50', 'ar' => 'مثال: 50'],
            ['key' => 'admin.settings.payment_methods.fields.guidance', 'en' => 'Guidance Text (English)', 'ar' => 'نص التعليمات (بالإنجليزي)'],
            ['key' => 'admin.settings.payment_methods.fields.guidance_ar', 'en' => 'Guidance Text (Arabic)', 'ar' => 'نص التعليمات (بالعربي)'],
            ['key' => 'admin.settings.payment_methods.fields.guidance_placeholder', 'en' => 'Instructions shown to the publisher when selecting this method…', 'ar' => 'التعليمات التي تظهر للناشر عند اختيار هذه الطريقة (بالإنجليزي)...'],
            ['key' => 'admin.settings.payment_methods.fields.guidance_ar_placeholder', 'en' => 'Instructions shown in Arabic…', 'ar' => 'التعليمات التي تظهر للناشر عند اختيار هذه الطريقة (بالعربي)...'],
            ['key' => 'admin.settings.payment_methods.add_btn', 'en' => 'Add Payment Method', 'ar' => 'إضافة طريقة دفع'],
            ['key' => 'admin.settings.gam_sizes.card_title', 'en' => '{type} Sizes', 'ar' => 'أحجام {type}'],
            ['key' => 'admin.settings.gam_sizes.empty', 'en' => 'No preselected sizes configured', 'ar' => 'لم يتم تكوين أحجام محددة مسبقاً'],
            ['key' => 'admin.settings.gam_sizes.input_placeholder', 'en' => 'Add size (e.g. 300x250)...', 'ar' => 'إضافة حجم (مثال: 300x250)...'],
            ['key' => 'admin.settings.gam_sizes.add_btn', 'en' => 'Add', 'ar' => 'إضافة'],
            ['key' => 'admin.settings.registration_status.open', 'en' => 'Open — Anyone can register', 'ar' => 'مفتوح — يمكن لأي شخص التسجيل'],
            ['key' => 'admin.settings.registration_status.closed', 'en' => 'Closed — Registrations are disabled', 'ar' => 'مغلق — التسجيل معطل'],
            ['key' => 'admin.settings.publisher_registration_status.active', 'en' => 'Active — Publisher can log in immediately', 'ar' => 'نشط — يمكن للناشر تسجيل الدخول على الفور'],
            ['key' => 'admin.settings.publisher_registration_status.pending', 'en' => 'Pending — Wait for admin approval', 'ar' => 'معلق — بانتظار موافقة المسؤول'],
            ['key' => 'admin.settings.publisher_registration_status.pending_help', 'en' => 'New publishers will see a "pending review" message after registration and cannot log in until activated.', 'ar' => 'سيرى الناشرون الجدد رسالة "قيد المراجعة" بعد التسجيل ولا يمكنهم تسجيل الدخول حتى يتم تفعيلهم.'],
            ['key' => 'admin.settings.publisher_registration_status.active_help', 'en' => 'New publishers will be automatically activated and can log in right after registering.', 'ar' => 'سيتم تفعيل الناشرين الجدد تلقائياً ويمكنهم تسجيل الدخول مباشرة بعد التسجيل.'],
            ['key' => 'admin.settings.publisher_pending_message.placeholder', 'en' => 'Message shown to publisher after registration when status is pending…', 'ar' => 'الرسالة المعروضة للناشر بعد التسجيل عندما تكون الحالة معلقة...'],
            ['key' => 'admin.settings.publisher_pending_message.help', 'en' => 'This message is shown to the publisher on the registration confirmation screen when their account requires admin approval.', 'ar' => 'تظهر هذه الرسالة للناشر في شاشة تأكيد التسجيل عندما يتطلب حسابه موافقة المسؤول.'],
            ['key' => 'admin.settings.publisher_pending_message_ar.placeholder', 'en' => 'Message shown to publisher after registration when status is pending (Arabic)…', 'ar' => 'الرسالة المعروضة للناشر بعد التسجيل عندما تكون الحالة معلقة (بالعربي)...'],
            ['key' => 'admin.settings.publisher_pending_message_ar.help', 'en' => 'This message is shown to the publisher on the registration confirmation screen when their account requires admin approval (Arabic version).', 'ar' => 'تظهر هذه الرسالة للناشر في شاشة تأكيد التسجيل عندما يتطلب حسابه موافقة المسؤول (النسخة العربية).'],
            ['key' => 'admin.settings.mail_mailer.log', 'en' => 'Log (Local File)', 'ar' => 'سجل (ملف محلي)'],
            ['key' => 'admin.settings.status.enabled', 'en' => 'Enabled', 'ar' => 'مفعل'],
            ['key' => 'admin.settings.status.disabled', 'en' => 'Disabled', 'ar' => 'معطل'],
            ['key' => 'admin.settings.gam_sync_interval.hourly_placeholder', 'en' => 'Interval in hours (e.g. 1, 2, 6)', 'ar' => 'الفترة بالساعات (مثال: 1، 2، 6)'],
            ['key' => 'admin.settings.gam_sync_interval.minutes_placeholder', 'en' => 'Interval in minutes (e.g. 10, 15, 30)', 'ar' => 'الفترة بالدقائق (مثال: 10، 15، 30)'],
            ['key' => 'admin.settings.gam_sync_interval.daily_placeholder', 'en' => 'Not applicable for daily sync', 'ar' => 'غير قابل للتطبيق للمزامنة اليومية'],
            ['key' => 'admin.settings.saving', 'en' => 'Saving...', 'ar' => 'جاري الحفظ...'],
            ['key' => 'admin.settings.save_group_btn', 'en' => 'Save {group} Settings', 'ar' => 'حفظ إعدادات {group}'],
            ['key' => 'admin.settings.cron.title', 'en' => 'Production Task Scheduler (Cron Job) Setup', 'ar' => 'إعداد جدولة المهام في الإنتاج (Cron Job)'],
            ['key' => 'admin.settings.cron.desc', 'en' => 'Laravel\'s task scheduler requires a system-level trigger to execute the dynamic auto-sync settings configured above in production. Configure one of the following methods:', 'ar' => 'يتطلب مجدول مهام Laravel مشغلاً على مستوى النظام لتنفيذ إعدادات المزامنة التابعية الديناميكية المهيأة أعلاه في الإنتاج. قم بتكوين إحدى الطرق التالية:'],
            ['key' => 'admin.settings.cron.linux_title', 'en' => '1. Linux Server (Production Cron)', 'ar' => '1. خادم لينكس (كرون الإنتاج)'],
            ['key' => 'admin.settings.cron.linux_desc', 'en' => 'Add this entry to your server\'s crontab:', 'ar' => 'أضف هذا الإدخال إلى crontab لخادمك:'],
            ['key' => 'admin.settings.cron.shared_title', 'en' => '2. Shared Hosting (Hostinger, cPanel, etc.)', 'ar' => '2. استضافة مشتركة (Hostinger، cPanel، إلخ.)'],
            ['key' => 'admin.settings.cron.shared_desc_1', 'en' => 'Go to the', 'ar' => 'انتقل إلى قسم'],
            ['key' => 'admin.settings.cron.shared_desc_2', 'en' => 'Cron Jobs', 'ar' => 'مهام كرون'],
            ['key' => 'admin.settings.cron.shared_desc_3', 'en' => 'section in your hosting control panel. Select the', 'ar' => 'في لوحة تحكم الاستضافة الخاصة بك. حدد خيار'],
            ['key' => 'admin.settings.cron.shared_desc_4', 'en' => 'Custom', 'ar' => 'مخصص'],
            ['key' => 'admin.settings.cron.shared_desc_5', 'en' => 'option, set the frequency to', 'ar' => 'واضبط التكرار على'],
            ['key' => 'admin.settings.cron.shared_desc_6', 'en' => 'every 1 minute ( * * * * * )', 'ar' => 'كل دقيقة واحدة ( * * * * * )'],
            ['key' => 'admin.settings.cron.shared_desc_7', 'en' => ', and configure the command:', 'ar' => '، وقم بتكوين الأمر:'],
            ['key' => 'admin.settings.cron.note', 'en' => 'Note: Replace {projectPath} with your actual absolute server directory path. If the default PHP binary doesn\'t work, try /usr/local/bin/php.', 'ar' => 'ملاحظة: استبدل {projectPath} بمسار دليل الخادم المطلق الفعلي. إذا لم يعمل ملف PHP الثنائي الافتراضي، فجرب /usr/local/bin/php.'],
            ['key' => 'admin.settings.email_test.title', 'en' => 'Test SMTP Configuration', 'ar' => 'اختبار تكوين SMTP'],
            ['key' => 'admin.settings.email_test.desc', 'en' => 'Before using SMTP in production, send a test email to verify your mail server credentials.', 'ar' => 'قبل استخدام SMTP في الإنتاج، أرسل بريداً إلكترونياً تجريبياً للتحقق من بيانات اعتماد خادم البريد الخاص بك.'],
            ['key' => 'admin.settings.email_test.placeholder', 'en' => 'Recipient email address…', 'ar' => 'عنوان البريد الإلكتروني للمستلم...'],
            ['key' => 'admin.settings.email_test.send_btn', 'en' => 'Send Test Email', 'ar' => 'إرسال بريد تجريبي'],
            ['key' => 'admin.settings.group.main_settings', 'en' => 'Main Settings', 'ar' => 'الإعدادات الرئيسية'],
            ['key' => 'admin.settings.group.branding', 'en' => 'Branding Settings', 'ar' => 'إعدادات الهوية البصرية'],
            ['key' => 'admin.settings.group.payout', 'en' => 'Payout Settings', 'ar' => 'إعدادات الدفع'],
            ['key' => 'admin.settings.group.gam', 'en' => 'GAM Sync Settings', 'ar' => 'إعدادات مزامنة GAM'],
            ['key' => 'admin.settings.group.payment', 'en' => 'Payment Methods', 'ar' => 'طرق الدفع'],
            ['key' => 'admin.settings.group.registration', 'en' => 'Registration Rules', 'ar' => 'قواعد التسجيل'],
            ['key' => 'admin.settings.group.email', 'en' => 'SMTP Mail Server', 'ar' => 'خادم بريد SMTP'],
            ['key' => 'admin.settings.group.seo', 'en' => 'SEO Configuration', 'ar' => 'تكوين تحسين محركات البحث'],
            ['key' => 'admin.settings.group.support', 'en' => 'Support & Helpdesk', 'ar' => 'الدعم الفني والمساعدة'],
            ['key' => 'admin.settings.group.social', 'en' => 'Social Media', 'ar' => 'وسائل التواصل الاجتماعي'],
            ['key' => 'admin.settings.gam_sync_frequency.daily', 'en' => 'Daily', 'ar' => 'يومي'],
            ['key' => 'admin.settings.gam_sync_frequency.hourly', 'en' => 'Hourly', 'ar' => 'ساعي'],
            ['key' => 'admin.settings.gam_sync_frequency.minutes', 'en' => 'Every X Minutes', 'ar' => 'كل X دقيقة'],
            ['key' => 'admin.settings.gam_sizes.types.banner', 'en' => 'Banner', 'ar' => 'صوري (Banner)'],
            ['key' => 'admin.settings.gam_sizes.types.reward', 'en' => 'Reward', 'ar' => 'بمكافأة (Reward)'],
            ['key' => 'admin.settings.gam_sizes.types.interstitial', 'en' => 'Interstitial', 'ar' => 'بيني (Interstitial)'],
            ['key' => 'admin.settings.gam_sizes.types.anchor', 'en' => 'Anchor', 'ar' => 'مثبت (Anchor)'],
            ['key' => 'admin.settings.gam_sizes.types.float_top', 'en' => 'Float Top', 'ar' => 'عائم علوي (Float Top)'],
            ['key' => 'admin.settings.gam_sizes.types.float_bottom', 'en' => 'Float Bottom', 'ar' => 'عائم سفلي (Float Bottom)'],
            ['key' => 'admin.settings.gam_sizes.types.float_fullscreen', 'en' => 'Float Full Screen', 'ar' => 'عائم شاشة كاملة (Float Full Screen)'],
            ['key' => 'admin.settings.keys.site_name', 'en' => 'Platform Name', 'ar' => 'اسم الموقع'],
            ['key' => 'admin.settings.keys.site_name_ar', 'en' => 'Platform Name (Arabic)', 'ar' => 'اسم الموقع (بالعربي)'],
            ['key' => 'admin.settings.keys.site_description', 'en' => 'Website Description', 'ar' => 'وصف الموقع'],
            ['key' => 'admin.settings.keys.site_description_ar', 'en' => 'Website Description (Arabic)', 'ar' => 'وصف الموقع (بالعربي)'],
            ['key' => 'admin.settings.keys.platform_timezone', 'en' => 'Platform Default Timezone', 'ar' => 'المنطقة الزمنية للمنصة'],
            ['key' => 'admin.settings.keys.default_currency', 'en' => 'Display Currency', 'ar' => 'العملة الافتراضية'],
            ['key' => 'admin.settings.keys.site_logo', 'en' => 'Platform Logo Image URL', 'ar' => 'شعار الموقع'],
            ['key' => 'admin.settings.keys.site_favicon', 'en' => 'Platform Favicon URL', 'ar' => 'أيقونة الموقع'],
            ['key' => 'admin.settings.keys.og_image', 'en' => 'OG Image URL (SEO Social Share)', 'ar' => 'صورة مشاركة الرابط (OG Image)'],
            ['key' => 'admin.settings.keys.gam_timezone', 'en' => 'GAM Report Timezone', 'ar' => 'المنطقة الزمنية لـ GAM'],
            ['key' => 'admin.settings.keys.gam_sync_days_back', 'en' => 'GAM Sync — Days to Re-sync Each Run', 'ar' => 'أيام المزامنة السابقة لـ GAM'],
            ['key' => 'admin.settings.keys.gam_sync_frequency', 'en' => 'GAM Sync Frequency (daily, hourly, minutes)', 'ar' => 'تكرار مزامنة GAM'],
            ['key' => 'admin.settings.keys.gam_sync_interval', 'en' => 'GAM Sync Interval (Hours or Minutes multiplier)', 'ar' => 'فترة مزامنة GAM'],
            ['key' => 'admin.settings.keys.google_client_id', 'en' => 'Google OAuth Client ID', 'ar' => 'معرف عميل جوجل'],
            ['key' => 'admin.settings.keys.google_client_secret', 'en' => 'Google OAuth Client Secret', 'ar' => 'سر عميل جوجل'],
            ['key' => 'admin.settings.keys.ad_type_preselected_sizes', 'en' => 'Preselected Sizes per Ad Type', 'ar' => 'أحجام الإعلانات المحددة مسبقاً'],
            ['key' => 'admin.settings.keys.payment_methods', 'en' => 'Available Payment Methods', 'ar' => 'طرق الدفع المتاحة للناشرين'],
            ['key' => 'admin.settings.keys.payout_threshold', 'en' => 'Minimum Payout Threshold (USD)', 'ar' => 'الحد الأدنى لدفع الأرباح (USD)'],
            ['key' => 'admin.settings.keys.payout_day', 'en' => 'Auto Payout Day of Month (1–28)', 'ar' => 'يوم الدفع التلقائي من الشهر (1-28)'],
            ['key' => 'admin.settings.keys.close_period_day', 'en' => 'Auto-Close Period Day of Next Month (1–28)', 'ar' => 'يوم الإغلاق التلقائي للفترة من الشهر التالي (1-28)'],
            ['key' => 'admin.settings.keys.payout_auto_enabled', 'en' => 'Enable Automatic Monthly Payout Generation', 'ar' => 'تفعيل إنشاء عمليات الدفع الشهرية التلقائية'],
            ['key' => 'admin.settings.keys.approve_earnings_day', 'en' => 'Approve Earnings Day of Next Month (1–28)', 'ar' => 'يوم الموافقة على الأرباح من الشهر التالي (1-28)'],
            ['key' => 'admin.settings.keys.meta_title', 'en' => 'SEO Meta Title', 'ar' => 'عنوان SEO (Meta Title)'],
            ['key' => 'admin.settings.keys.meta_title_ar', 'en' => 'SEO Meta Title (Arabic)', 'ar' => 'عنوان SEO (بالعربي)'],
            ['key' => 'admin.settings.keys.meta_description', 'en' => 'SEO Meta Description', 'ar' => 'وصف SEO (Meta Description)'],
            ['key' => 'admin.settings.keys.meta_description_ar', 'en' => 'SEO Meta Description (Arabic)', 'ar' => 'وصف SEO (بالعربي)'],
            ['key' => 'admin.settings.keys.meta_keywords', 'en' => 'SEO Meta Keywords', 'ar' => 'الكلمات المفتاحية لـ SEO (Meta Keywords)'],
            ['key' => 'admin.settings.keys.meta_keywords_ar', 'en' => 'SEO Meta Keywords (Arabic)', 'ar' => 'الكلمات المفتاحية لـ SEO (بالعربي)'],

            // Browser Page Titles
            ['key' => 'title.home', 'en' => 'Maximize your revenue with {siteName}', 'ar' => 'ضاعف أرباحك مع {siteName}'],
            ['key' => 'title.login', 'en' => 'Login', 'ar' => 'تسجيل الدخول'],
            ['key' => 'title.register', 'en' => 'Register', 'ar' => 'إنشاء حساب'],
            ['key' => 'title.forgot_password', 'en' => 'Forgot Password', 'ar' => 'نسيت كلمة المرور'],
            ['key' => 'title.reset_password', 'en' => 'Reset Password', 'ar' => 'إعادة تعيين كلمة المرور'],
            ['key' => 'title.support', 'en' => 'Support', 'ar' => 'الدعم الفني'],
            ['key' => 'title.design_system', 'en' => 'Design System', 'ar' => 'نظام التصميم'],
            ['key' => 'title.admin_dashboard', 'en' => 'Dashboard', 'ar' => 'لوحة التحكم'],
            ['key' => 'title.admin_finance', 'en' => 'Finance Dashboard', 'ar' => 'اللوحة المالية'],
            ['key' => 'title.admin_adops', 'en' => 'Ad Ops Dashboard', 'ar' => 'لوحة العمليات الإعلانية'],
            ['key' => 'title.admin_support', 'en' => 'Support Dashboard', 'ar' => 'لوحة الدعم الفني'],
            ['key' => 'title.admin_content', 'en' => 'Content Dashboard', 'ar' => 'لوحة المحتوى'],
            ['key' => 'title.admin_publishers', 'en' => 'Publishers', 'ar' => 'الناشرون'],
            ['key' => 'title.admin_publisher_profile', 'en' => 'Publisher Profile', 'ar' => 'ملف الناشر الشخصي'],
            ['key' => 'title.admin_websites', 'en' => 'Websites', 'ar' => 'المواقع الإلكترونية'],
            ['key' => 'title.admin_revenue', 'en' => 'Revenue', 'ar' => 'الأرباح'],
            ['key' => 'title.admin_closings', 'en' => 'Period Closings', 'ar' => 'إغلاق الفترات'],
            ['key' => 'title.admin_payouts', 'en' => 'Payouts', 'ar' => 'المدفوعات'],
            ['key' => 'title.admin_adjustments', 'en' => 'Adjustments', 'ar' => 'التسويات'],
            ['key' => 'title.admin_settings', 'en' => 'Settings', 'ar' => 'الإعدادات'],
            ['key' => 'title.admin_profile', 'en' => 'Profile', 'ar' => 'الملف الشخصي'],
            ['key' => 'title.admin_translations', 'en' => 'Translations', 'ar' => 'الترجمات'],
            ['key' => 'title.admin_audit_logs', 'en' => 'Audit Logs', 'ar' => 'سجلات التدقيق'],
            ['key' => 'title.admin_gam_accounts', 'en' => 'GAM Accounts', 'ar' => 'حسابات GAM'],
            ['key' => 'title.admin_gam_sync', 'en' => 'GAM Sync', 'ar' => 'مزامنة GAM'],
            ['key' => 'title.admin_announcements', 'en' => 'Announcements', 'ar' => 'الإعلانات الإدارية'],
            ['key' => 'title.admin_pages', 'en' => 'Pages', 'ar' => 'الصفحات'],
            ['key' => 'title.admin_email_templates', 'en' => 'Email Templates', 'ar' => 'قوالب البريد الإلكتروني'],
            ['key' => 'title.admin_tickets', 'en' => 'Support Tickets', 'ar' => 'تذاكر الدعم'],
            ['key' => 'title.admin_admins', 'en' => 'Admins', 'ar' => 'المسؤولون'],
            ['key' => 'title.admin_ticket_detail', 'en' => 'Ticket Detail', 'ar' => 'تفاصيل التذكرة'],
            ['key' => 'title.publisher_dashboard', 'en' => 'Dashboard', 'ar' => 'لوحة التحكم'],
            ['key' => 'title.publisher_websites', 'en' => 'Websites', 'ar' => 'مواقعي الإلكترونية'],
            ['key' => 'title.publisher_revenue', 'en' => 'Revenue', 'ar' => 'الأرباح والمشاركة'],
            ['key' => 'title.publisher_payouts', 'en' => 'Payouts', 'ar' => 'المدفوعات والأرباح'],
            ['key' => 'title.publisher_settings', 'en' => 'Settings', 'ar' => 'الإعدادات'],
            ['key' => 'title.publisher_tickets', 'en' => 'Support Tickets', 'ar' => 'تذاكر الدعم الفني'],
            ['key' => 'title.publisher_ticket_detail', 'en' => 'Ticket Detail', 'ar' => 'تفاصيل التذكرة'],
            ['key' => 'admin.settings.keys.registration_status', 'en' => 'Publisher Self-Registration Status (open or closed)', 'ar' => 'حالة التسجيل الذاتي للناشر (مفتوح أو مغلق)'],
            ['key' => 'admin.settings.keys.publisher_registration_status', 'en' => 'New Publisher Default Status (active or pending)', 'ar' => 'حالة الناشر الجديد الافتراضية (نشط أو معلق)'],
            ['key' => 'admin.settings.keys.publisher_pending_message', 'en' => 'Pending Registration Message (shown after sign-up)', 'ar' => 'رسالة التسجيل المعلق (تظهر بعد التسجيل)'],
            ['key' => 'admin.settings.keys.publisher_pending_message_ar', 'en' => 'Pending Registration Message (Arabic)', 'ar' => 'رسالة التسجيل المعلق (بالعربي)'],
            ['key' => 'admin.settings.keys.publisher_default_ratio', 'en' => 'Default Revenue Ratio % (e.g. 70 for 70%)', 'ar' => 'نسبة مشاركة الإيرادات الافتراضية %'],
            ['key' => 'admin.settings.keys.support_email', 'en' => 'Support Destination & Contact Email', 'ar' => 'البريد الإلكتروني للدعم الفني والتواصل'],
            ['key' => 'admin.settings.keys.support_telegram', 'en' => 'Support Telegram Link', 'ar' => 'رابط الدعم الفني على تيليجرام'],
            ['key' => 'admin.settings.keys.support_whatsapp', 'en' => 'Support WhatsApp Link', 'ar' => 'رابط الدعم الفني على واتساب'],

            // Publisher Profile Page Keys
            ['key' => 'admin.publisher_profile.toast.load_failed', 'en' => 'Failed to load publisher profile details', 'ar' => 'فشل تحميل تفاصيل ملف الناشر الشخصي'],
            ['key' => 'admin.publisher_profile.confirm.delete', 'en' => 'Delete publisher "{name}"? This cannot be undone.', 'ar' => 'هل تريد حذف الناشر "{name}"؟ لا يمكن التراجع عن هذا الإجراء.'],
            ['key' => 'admin.publisher_profile.toast.deleted', 'en' => 'Publisher deleted successfully', 'ar' => 'تم حذف الناشر بنجاح'],
            ['key' => 'admin.publisher_profile.toast.delete_failed', 'en' => 'Delete failed', 'ar' => 'فشل الحذف'],
            ['key' => 'admin.publisher_profile.confirm.toggle_status', 'en' => 'Are you sure you want to {action} publisher "{name}"?', 'ar' => 'هل أنت متأكد أنك تريد {action} الناشر "{name}"؟'],
            ['key' => 'admin.publisher_profile.toast.suspended', 'en' => 'Publisher suspended', 'ar' => 'تم تعليق الناشر'],
            ['key' => 'admin.publisher_profile.toast.activated', 'en' => 'Publisher activated', 'ar' => 'تم تفعيل الناشر'],
            ['key' => 'admin.publisher_profile.toast.toggle_status_failed', 'en' => 'Failed to {action} publisher', 'ar' => 'فشل في {action} الناشر'],
            ['key' => 'admin.publisher_profile.confirm.impersonate', 'en' => 'Log in as publisher "{name}"?', 'ar' => 'هل تريد تسجيل الدخول بصفتك الناشر "{name}"؟'],
            ['key' => 'admin.publisher_profile.toast.impersonate_success', 'en' => 'Logged in as {name}', 'ar' => 'تم تسجيل الدخول باسم {name}'],
            ['key' => 'admin.publisher_profile.toast.impersonate_failed', 'en' => 'Failed to impersonate publisher', 'ar' => 'فشل تقمص شخصية الناشر'],
            ['key' => 'admin.publisher_profile.loading', 'en' => 'Loading profile…', 'ar' => 'جاري تحميل الملف الشخصي...'],
            ['key' => 'admin.publisher_profile.not_found', 'en' => 'Publisher not found', 'ar' => 'الناشر غير موجود'],
            ['key' => 'admin.publisher_profile.return_to_list', 'en' => 'Return to list', 'ar' => 'العودة للقائمة'],
            ['key' => 'admin.publisher_profile.back_to_list', 'en' => '← Back to Publishers List', 'ar' => '← العودة إلى قائمة الناشرين'],
            ['key' => 'admin.publisher_profile.filters.hide', 'en' => 'Hide Filters', 'ar' => 'إخفاء الفلاتر'],
            ['key' => 'admin.publisher_profile.filters.show', 'en' => 'Show Filters', 'ar' => 'عرض الفلاتر'],
            ['key' => 'admin.publisher_profile.filters.by_website', 'en' => 'Filter by Website', 'ar' => 'تصفية حسب الموقع'],
            ['key' => 'admin.publisher_profile.filters.all_websites', 'en' => 'All Websites', 'ar' => 'جميع المواقع'],
            ['key' => 'admin.publisher_profile.filters.date_from', 'en' => 'Date From', 'ar' => 'التاريخ من'],
            ['key' => 'admin.publisher_profile.filters.date_to', 'en' => 'Date To', 'ar' => 'التاريخ إلى'],
            ['key' => 'admin.publisher_profile.filters.clear', 'en' => 'Clear Filters', 'ar' => 'مسح الفلاتر'],
            ['key' => 'admin.publisher_profile.actions.edit_profile', 'en' => 'Edit Profile', 'ar' => 'تعديل الملف الشخصي'],
            ['key' => 'admin.publisher_profile.actions.adjust_balance', 'en' => 'Adjust Balance', 'ar' => 'تعديل الرصيد'],
            ['key' => 'admin.publisher_profile.actions.manual_payout_disabled_tooltip', 'en' => 'Cannot record a manual payout because the publisher has no approved balance', 'ar' => 'لا يمكن تسجيل دفعة يدوية لأن الناشر ليس لديه رصيد معتمد'],
            ['key' => 'admin.publisher_profile.actions.manual_payout', 'en' => 'Manual Payout', 'ar' => 'دفعة يدوية'],
            ['key' => 'admin.publisher_profile.actions.generate_ad_units', 'en' => 'Generate Ad Units', 'ar' => 'توليد وحدات إعلانية'],
            ['key' => 'admin.publisher_profile.actions.login', 'en' => 'Log In', 'ar' => 'تسجيل الدخول'],
            ['key' => 'admin.publisher_profile.actions.suspend_btn', 'en' => 'Suspend', 'ar' => 'تعليق'],
            ['key' => 'admin.publisher_profile.actions.approve_btn', 'en' => 'Approve', 'ar' => 'موافقة'],
            ['key' => 'admin.publisher_profile.actions.activate_btn', 'en' => 'Activate', 'ar' => 'تفعيل'],
            ['key' => 'admin.publisher_profile.actions.delete_btn', 'en' => 'Delete', 'ar' => 'حذف'],
            ['key' => 'admin.publisher_profile.stats.ready_for_payout', 'en' => 'Ready for Payout', 'ar' => 'جاهز للدفع'],
            ['key' => 'admin.publisher_profile.stats.ready_for_payout_sub', 'en' => 'Total wallet balance', 'ar' => 'إجمالي رصيد المحفظة'],
            ['key' => 'admin.publisher_profile.stats.approved_balance', 'en' => 'Approved Balance', 'ar' => 'الرصيد المعتمد'],
            ['key' => 'admin.publisher_profile.stats.approved_balance_sub', 'en' => 'Filtered for period', 'ar' => 'مصفى للفترة'],
            ['key' => 'admin.publisher_profile.stats.pending_balance', 'en' => 'Pending Balance', 'ar' => 'الرصيد المعلق'],
            ['key' => 'admin.publisher_profile.stats.pending_balance_sub', 'en' => 'Holding period', 'ar' => 'فترة الحجز'],
            ['key' => 'admin.publisher_profile.stats.upcoming_adjustment', 'en' => 'Upcoming Adjustment', 'ar' => 'التعديل القادم'],
            ['key' => 'admin.publisher_profile.stats.upcoming_adjustment_sub', 'en' => 'Pending balance adjust', 'ar' => 'تعديل الرصيد المعلق'],
            ['key' => 'admin.publisher_profile.stats.total_payouts_paid', 'en' => 'Total Payouts Paid', 'ar' => 'إجمالي المدفوعات المدفوعة'],
            ['key' => 'admin.publisher_profile.stats.total_payouts_paid_sub', 'en' => 'Paid to date', 'ar' => 'مدفوع حتى اليوم'],
            ['key' => 'admin.publisher_profile.info.title', 'en' => 'Contact & System Info', 'ar' => 'معلومات الاتصال والنظام'],
            ['key' => 'admin.publisher_profile.info.phone', 'en' => 'Phone / WhatsApp', 'ar' => 'الهاتف / واتساب'],
            ['key' => 'admin.publisher_profile.info.not_set', 'en' => 'Not Set', 'ar' => 'لم يحدد'],
            ['key' => 'admin.publisher_profile.info.telegram', 'en' => 'Telegram Username', 'ar' => 'اسم مستخدم تليجرام'],
            ['key' => 'admin.publisher_profile.info.revenue_ratio', 'en' => 'Revenue Ratio Split', 'ar' => 'نسبة تقسيم الإيرادات'],
            ['key' => 'admin.publisher_profile.info.registration_ip', 'en' => 'Registration IP', 'ar' => 'IP التسجيل'],
            ['key' => 'admin.publisher_profile.info.last_login_ip', 'en' => 'Last Login IP', 'ar' => 'IP آخر تسجيل دخول'],
            ['key' => 'admin.publisher_profile.info.created_account', 'en' => 'Created Account', 'ar' => 'تاريخ إنشاء الحساب'],
            ['key' => 'admin.publisher_profile.info.country', 'en' => 'Country', 'ar' => 'البلد'],
            ['key' => 'admin.publisher_profile.info.payment_method', 'en' => 'Payment Method', 'ar' => 'طريقة الدفع'],
            ['key' => 'admin.publisher_profile.info.payment_account', 'en' => 'Payment Account', 'ar' => 'حساب الدفع'],
            ['key' => 'admin.publisher_profile.toast.copied', 'en' => 'Copied to clipboard!', 'ar' => 'تم النسخ إلى الحافظة!'],
            ['key' => 'admin.publisher_profile.info.copy_tooltip', 'en' => 'Copy account details', 'ar' => 'نسخ تفاصيل الحساب'],
            ['key' => 'admin.publisher_profile.info.copy_btn', 'en' => 'Copy', 'ar' => 'نسخ'],
            ['key' => 'admin.publisher_profile.notes.title', 'en' => '📝 Internal Notes (Admin Only)', 'ar' => '📝 ملاحظات داخلية (للمسؤولين فقط)'],
            ['key' => 'admin.publisher_profile.notes.empty', 'en' => 'No internal notes added.', 'ar' => 'لم يتم إضافة ملاحظات داخلية.'],
            ['key' => 'admin.publisher_profile.tabs.websites', 'en' => 'Websites & Ad Units', 'ar' => 'المواقع والوحدات الإعلانية'],
            ['key' => 'admin.publisher_profile.tabs.payouts', 'en' => 'Payouts History', 'ar' => 'سجل المدفوعات'],
            ['key' => 'admin.publisher_profile.tabs.revenue', 'en' => 'Revenue Logs', 'ar' => 'سجلات الأرباح'],
            ['key' => 'admin.publisher_profile.tabs.ratio', 'en' => 'Ratio Changes', 'ar' => 'تغييرات النسب'],
            ['key' => 'admin.publisher_profile.websites.empty', 'en' => 'No websites linked', 'ar' => 'لا توجد مواقع مرتبطة'],
            ['key' => 'admin.publisher_profile.websites.empty_sub', 'en' => 'Add websites to this publisher', 'ar' => 'إضافة مواقع لهذا الناشر'],
            ['key' => 'admin.publisher_profile.websites.add_btn', 'en' => 'Add Website', 'ar' => 'إضافة موقع'],
            ['key' => 'admin.publisher_profile.websites.active', 'en' => 'Active', 'ar' => 'نشط'],
            ['key' => 'admin.publisher_profile.websites.inactive', 'en' => 'Inactive', 'ar' => 'غير نشط'],
            ['key' => 'admin.publisher_profile.websites.gam_account_label', 'en' => 'GAM Account: {account}', 'ar' => 'حساب GAM: {account}'],
            ['key' => 'admin.publisher_profile.websites.not_linked', 'en' => 'Not Linked', 'ar' => 'غير مرتبط'],
            ['key' => 'admin.publisher_profile.websites.network_label', 'en' => '(Network: {code})', 'ar' => '(الشبكة: {code})'],
            ['key' => 'admin.publisher_profile.websites.ratio_override', 'en' => 'Ratio Override: {ratio}', 'ar' => 'تجاوز النسبة: {ratio}'],
            ['key' => 'admin.publisher_profile.websites.edit_btn', 'en' => 'Edit', 'ar' => 'تعديل'],
            ['key' => 'admin.publisher_profile.confirm.delete_website', 'en' => 'Are you sure you want to delete website "{domain}"? This will also delete all its mapped ad units.', 'ar' => 'هل أنت متأكد أنك تريد حذف الموقع "{domain}"؟ سيؤدي ذلك أيضاً إلى حذف جميع الوحدات الإعلانية المرتبطة به.'],
            ['key' => 'admin.publisher_profile.toast.website_deleted', 'en' => 'Website deleted successfully', 'ar' => 'تم حذف الموقع بنجاح'],
            ['key' => 'admin.publisher_profile.toast.website_delete_failed', 'en' => 'Failed to delete website', 'ar' => 'فشل حذف الموقع'],
            ['key' => 'admin.publisher_profile.websites.delete_btn', 'en' => 'Delete', 'ar' => 'حذف'],
            ['key' => 'admin.publisher_profile.ad_units.title', 'en' => 'Ad Units ({count})', 'ar' => 'الوحدات الإعلانية ({count})'],
            ['key' => 'admin.publisher_profile.ad_units.add_btn', 'en' => 'Add Existing Ad Unit', 'ar' => 'إضافة وحدة إعلانية موجودة'],
            ['key' => 'admin.publisher_profile.ad_units.empty', 'en' => 'No ad units added to this website.', 'ar' => 'لم يتم إضافة وحدات إعلانية لهذا الموقع.'],
            ['key' => 'admin.publisher_profile.ad_units.table.gam_name', 'en' => 'Ad Unit Name (GAM)', 'ar' => 'اسم الوحدة الإعلانية (GAM)'],
            ['key' => 'admin.publisher_profile.ad_units.table.display_name', 'en' => 'Display Name', 'ar' => 'الاسم المعروض'],
            ['key' => 'admin.publisher_profile.ad_units.table.ratio_split', 'en' => 'Ratio Split', 'ar' => 'تقسيم النسبة'],
            ['key' => 'admin.publisher_profile.ad_units.table.actions', 'en' => 'Actions', 'ar' => 'الإجراءات'],
            ['key' => 'admin.publisher_profile.ad_units.ratio_override_val', 'en' => '{ratio} (Override)', 'ar' => '{ratio} (تخصيص)'],
            ['key' => 'admin.publisher_profile.ad_units.ratio_inherited', 'en' => 'Inherited', 'ar' => 'موروث'],
            ['key' => 'admin.publisher_profile.ad_units.delete_platform_tooltip', 'en' => 'Delete from platform only (keep in GAM)', 'ar' => 'حذف من المنصة فقط (الاحتفاظ به في GAM)'],
            ['key' => 'admin.publisher_profile.confirm.delete_ad_unit_platform', 'en' => 'Delete ad unit "{name}" from platform only? It will NOT be archived in Google Ad Manager.', 'ar' => 'هل تريد حذف الوحدة الإعلانية "{name}" من المنصة فقط؟ لن يتم أرشفتها في Google Ad Manager.'],
            ['key' => 'admin.publisher_profile.toast.ad_unit_deleted', 'en' => 'Ad unit deleted successfully', 'ar' => 'تم حذف الوحدة الإعلانية بنجاح'],
            ['key' => 'admin.publisher_profile.toast.ad_unit_delete_failed', 'en' => 'Failed to delete ad unit', 'ar' => 'فشل حذف الوحدة الإعلانية'],
            ['key' => 'admin.publisher_profile.ad_units.delete_archive_tooltip', 'en' => 'Delete from platform and archive in GAM', 'ar' => 'حذف من المنصة وأرشفة في GAM'],
            ['key' => 'admin.publisher_profile.confirm.delete_ad_unit_archive', 'en' => 'Delete ad unit "{name}" from platform and archive it in Google Ad Manager?', 'ar' => 'هل تريد حذف الوحدة الإعلانية "{name}" من المنصة وأرشفتها في Google Ad Manager؟'],
            ['key' => 'admin.publisher_profile.payouts.empty', 'en' => 'No payout records yet', 'ar' => 'لا توجد سجلات دفع بعد'],
            ['key' => 'admin.publisher_profile.payouts.empty_sub', 'en' => 'Payouts are generated when closing a monthly period', 'ar' => 'يتم توليد المدفوعات عند إغلاق الفترة الشهرية'],
            ['key' => 'admin.publisher_profile.payouts.table.period', 'en' => 'Period', 'ar' => 'الفترة'],
            ['key' => 'admin.publisher_profile.payouts.table.base_amount', 'en' => 'Base Amount', 'ar' => 'المبلغ الأساسي'],
            ['key' => 'admin.publisher_profile.payouts.table.adjustment', 'en' => 'Adjustment', 'ar' => 'التعديل'],
            ['key' => 'admin.publisher_profile.payouts.table.final_amount', 'en' => 'Final Amount', 'ar' => 'المبلغ النهائي'],
            ['key' => 'admin.publisher_profile.payouts.table.status', 'en' => 'Status', 'ar' => 'الحالة'],
            ['key' => 'admin.publisher_profile.payouts.table.paid_at', 'en' => 'Paid At', 'ar' => 'تاريخ الدفع'],
            ['key' => 'admin.publisher_profile.payouts.table.totals', 'en' => 'Totals ({count})', 'ar' => 'الإجماليات ({count})'],
            ['key' => 'admin.publisher_profile.revenue.empty', 'en' => 'No revenue logs found', 'ar' => 'لم يتم العثور على سجلات أرباح'],
            ['key' => 'admin.publisher_profile.revenue.empty_sub', 'en' => 'Revenue records will appear once synchronized from Google Ad Manager', 'ar' => 'ستظهر سجلات الأرباح بمجرد مزامنتها من Google Ad Manager'],
            ['key' => 'admin.publisher_profile.revenue.table.date', 'en' => 'Date', 'ar' => 'التاريخ'],
            ['key' => 'admin.publisher_profile.revenue.table.ad_unit_website', 'en' => 'Ad Unit / Website', 'ar' => 'الوحدة الإعلانية / الموقع'],
            ['key' => 'admin.publisher_profile.revenue.table.impressions', 'en' => 'Impressions', 'ar' => 'عدد الظهور'],
            ['key' => 'admin.publisher_profile.revenue.table.gross_rev', 'en' => 'Gross Rev.', 'ar' => 'إجمالي الربح'],
            ['key' => 'admin.publisher_profile.revenue.table.pub_share', 'en' => 'Pub. Share', 'ar' => 'حصة الناشر'],
            ['key' => 'admin.publisher_profile.revenue.table.status', 'en' => 'Status', 'ar' => 'الحالة'],
            ['key' => 'admin.publisher_profile.revenue.status.closed', 'en' => 'closed', 'ar' => 'مغلق'],
            ['key' => 'admin.publisher_profile.revenue.status.approved', 'en' => 'approved', 'ar' => 'معتمد'],
            ['key' => 'admin.publisher_profile.revenue.status.pending', 'en' => 'pending', 'ar' => 'معلق'],
            ['key' => 'admin.publisher_profile.revenue.table.totals', 'en' => 'Totals {all_logs}', 'ar' => 'الإجماليات {all_logs}'],
            ['key' => 'admin.publisher_profile.revenue.table.all_logs_count', 'en' => '(all {count} logs)', 'ar' => '(كل {count} سجل)'],
            ['key' => 'admin.publisher_profile.revenue.table.showing_latest_50', 'en' => 'Showing latest 50 records. See all under the Revenue page.', 'ar' => 'عرض أحدث 50 سجلاً. عرض الكل تحت صفحة الأرباح.'],
            ['key' => 'admin.publisher_profile.ratio.empty', 'en' => 'No ratio changes logged', 'ar' => 'لم يتم تسجيل أي تغييرات في النسب'],
            ['key' => 'admin.publisher_profile.ratio.empty_sub', 'en' => 'Revenue ratio change logs will show up here', 'ar' => 'ستظهر سجلات تغيير نسبة الإيرادات هنا'],
            ['key' => 'admin.publisher_profile.ratio.table.date_changed', 'en' => 'Date Changed', 'ar' => 'تاريخ التغيير'],
            ['key' => 'admin.publisher_profile.ratio.table.target', 'en' => 'Target', 'ar' => 'الهدف'],
            ['key' => 'admin.publisher_profile.ratio.table.old_ratio', 'en' => 'Old Ratio', 'ar' => 'النسبة القديمة'],
            ['key' => 'admin.publisher_profile.ratio.table.new_ratio', 'en' => 'New Ratio', 'ar' => 'النسبة الجديدة'],
            ['key' => 'admin.publisher_profile.ratio.table.changed_by', 'en' => 'Changed By', 'ar' => 'تم التغيير بواسطة'],
            ['key' => 'admin.publisher_profile.ratio.general_profile', 'en' => 'General Profile', 'ar' => 'الملف التعريفي العام'],
            ['key' => 'admin.publisher_profile.ratio.admin_system', 'en' => 'Admin/System', 'ar' => 'المسؤول/النظام'],
            ['key' => 'admin.publisher_profile.impersonate_modal.title', 'en' => 'Log In as Publisher', 'ar' => 'تسجيل الدخول كأنه الناشر'],
            ['key' => 'admin.publisher_profile.impersonate_modal.message', 'en' => 'You are about to log in as publisher {name} ({email}).', 'ar' => 'أنت على وشك تسجيل الدخول كأنك الناشر {name} ({email}).'],
            ['key' => 'admin.publisher_profile.impersonate_modal.sub_message', 'en' => 'Choose whether to open the publisher dashboard in a new tab or redirect the current tab.', 'ar' => 'اختر ما إذا كنت تريد فتح لوحة تحكم الناشر في علامة تبويب جديدة أو إعادة توجيه علامة التبويب الحالية.'],
            ['key' => 'admin.publisher_profile.impersonate_modal.cancel_btn', 'en' => 'Cancel', 'ar' => 'إلغاء'],
            ['key' => 'admin.publisher_profile.impersonate_modal.current_tab_btn', 'en' => 'Open in Current Tab', 'ar' => 'فتح في علامة التبويب الحالية'],
            ['key' => 'admin.publisher_profile.impersonate_modal.logging_in', 'en' => 'Logging in…', 'ar' => 'جاري الدخول...'],
            ['key' => 'admin.publisher_profile.impersonate_modal.new_tab_btn', 'en' => 'Open in New Tab', 'ar' => 'فتح في علامة تبويب جديدة'],
            ['key' => 'admin.publisher_profile.toast.impersonate_new_tab', 'en' => 'Logged in as {name} in a new tab', 'ar' => 'تم تسجيل الدخول باسم {name} في علامة تبويب جديدة'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.toast.invalid_amount', 'en' => 'Please enter a valid payout amount', 'ar' => 'يرجى إدخال مبلغ دفع صالح'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.toast.exceeds_balance', 'en' => 'Payout amount cannot exceed the publisher\'s approved wallet balance', 'ar' => 'لا يمكن أن يتجاوز مبلغ الدفعة رصيد المحفظة المعتمد للناشر'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.toast.success', 'en' => 'Manual payment recorded successfully!', 'ar' => 'تم تسجيل الدفعة اليدوية بنجاح!'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.toast.failed', 'en' => 'Failed to create manual payment', 'ar' => 'فشل إنشاء الدفعة اليدوية'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.title', 'en' => 'Record Manual Payment', 'ar' => 'تسجيل دفعة يدوية'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.help_text', 'en' => 'This will record an out-of-cycle manual payout request for {name} without affecting monthly period closings or locking revenue records. The request will enter the queue as a Pending payout. Once approved by an admin, it can then be processed or marked as paid via the standard payout workflow (similar to auto payouts). The amount is deducted from their approved wallet balance immediately.', 'ar' => 'سيؤدي ذلك إلى تسجيل طلب دفع يدوي خارج الدورة لـ {name} دون التأثير على إغلاق الفترات الشهرية أو قفل سجلات الأرباح. سيدخل الطلب في قائمة الانتظار كدفعة معلقة. بمجرد موافقة المسؤول، يمكن معالجتها أو تحديدها كمدفوعة عبر سير عمل الدفع القياسي (على غرار المدفوعات التلقائية). يتم اقتطاع المبلغ من رصيد المحفظة المعتمد لديهم على الفور.'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.amount_label', 'en' => 'Payout Amount ($) *', 'ar' => 'مبلغ الدفعة ($) *'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.wallet_balance_label', 'en' => 'Current approved wallet balance:', 'ar' => 'رصيد المحفظة المعتمد الحالي:'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.reference_label', 'en' => 'Reference ID (optional)', 'ar' => 'معرف المرجع (اختياري)'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.reference_placeholder', 'en' => 'Transaction hash or ID', 'ar' => 'معرف أو هاش المعاملة'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.note_label', 'en' => 'Admin Note / Memo (internal)', 'ar' => 'ملاحظة المسؤول / مذكرة (داخلية)'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.note_placeholder', 'en' => 'e.g. Special manual payout request override…', 'ar' => 'مثال: تجاوز طلب دفع يدوي خاص...'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.cancel_btn', 'en' => 'Cancel', 'ar' => 'إلغاء'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.recording', 'en' => 'Recording…', 'ar' => 'جاري التسجيل...'],
            ['key' => 'admin.publisher_profile.manual_payout_modal.record_btn', 'en' => 'Record Payment', 'ar' => 'تسجيل الدفعة'],

            // Translations Page Keys
            ['key' => 'admin.translations.toast.load_failed', 'en' => 'Failed to load translations', 'ar' => 'فشل تحميل الترجمات'],
            ['key' => 'admin.translations.toast.saved', 'en' => 'Translation saved!', 'ar' => 'تم حفظ الترجمة!'],
            ['key' => 'admin.translations.toast.save_failed', 'en' => 'Failed to save translation', 'ar' => 'فشل حفظ الترجمة'],
            ['key' => 'admin.translations.title', 'en' => 'Translations', 'ar' => 'الترجمات'],
            ['key' => 'admin.translations.subtitle', 'en' => 'Edit UI strings for English and Arabic', 'ar' => 'تعديل نصوص واجهة المستخدم للغتين الإنجليزية والعربية'],
            ['key' => 'admin.translations.filters.hide', 'en' => 'Hide Filters', 'ar' => 'إخفاء الفلاتر'],
            ['key' => 'admin.translations.filters.show', 'en' => 'Show Filters', 'ar' => 'عرض الفلاتر'],
            ['key' => 'admin.translations.languages.en', 'en' => 'English', 'ar' => 'الإنجليزية'],
            ['key' => 'admin.translations.languages.ar', 'en' => 'Arabic', 'ar' => 'العربية'],
            ['key' => 'admin.translations.filters.placeholder', 'en' => 'Filter by key or value…', 'ar' => 'تصفية حسب المفتاح أو القيمة...'],
            ['key' => 'admin.translations.filters.count', 'en' => '{count} strings', 'ar' => '{count} نص'],
            ['key' => 'admin.translations.table.key', 'en' => 'Key', 'ar' => 'المفتاح'],
            ['key' => 'admin.translations.table.translation_header', 'en' => 'Translation ({lang})', 'ar' => 'الترجمة ({lang})'],
            ['key' => 'admin.translations.table.save_btn', 'en' => 'Save', 'ar' => 'حفظ'],

            // Newly added keys for language selection, dropdowns, months, SMTP and generator modal
            ['key' => 'common.english_lang', 'en' => 'English (en)', 'ar' => 'الإنجليزية (en)'],
            ['key' => 'common.arabic_lang', 'en' => 'Arabic (ar)', 'ar' => 'العربية (ar)'],
            ['key' => 'common.all_publishers', 'en' => 'All Publishers', 'ar' => 'جميع الناشرين'],
            ['key' => 'common.search_publisher', 'en' => 'Search publisher…', 'ar' => 'البحث عن ناشر...'],
            ['key' => 'common.no_publishers_found', 'en' => 'No publishers found', 'ar' => 'لم يتم العثور على ناشرين'],
            ['key' => 'common.all_gam_accounts', 'en' => 'All GAM Accounts', 'ar' => 'جميع حسابات GAM'],
            ['key' => 'common.search_account', 'en' => 'Search account...', 'ar' => 'البحث عن حساب...'],
            ['key' => 'common.no_accounts_found', 'en' => 'No accounts found', 'ar' => 'لم يتم العثور على حسابات'],
            ['key' => 'common.no_results', 'en' => 'No results', 'ar' => 'لا توجد نتائج'],
            ['key' => 'common.status', 'en' => 'Status', 'ar' => 'الحالة'],
            ['key' => 'common.publisher', 'en' => 'Publisher', 'ar' => 'الناشر'],
            ['key' => 'common.year', 'en' => 'Year', 'ar' => 'السنة'],
            ['key' => 'common.month', 'en' => 'Month', 'ar' => 'الشهر'],
            ['key' => 'common.months.january', 'en' => 'January', 'ar' => 'يناير'],
            ['key' => 'common.months.february', 'en' => 'February', 'ar' => 'فبراير'],
            ['key' => 'common.months.march', 'en' => 'March', 'ar' => 'مارس'],
            ['key' => 'common.months.april', 'en' => 'April', 'ar' => 'أبريل'],
            ['key' => 'common.months.may', 'en' => 'May', 'ar' => 'مايو'],
            ['key' => 'common.months.june', 'en' => 'June', 'ar' => 'يونيو'],
            ['key' => 'common.months.july', 'en' => 'July', 'ar' => 'يوليو'],
            ['key' => 'common.months.august', 'en' => 'August', 'ar' => 'أغسطس'],
            ['key' => 'common.months.september', 'en' => 'September', 'ar' => 'سبتمبر'],
            ['key' => 'common.months.october', 'en' => 'October', 'ar' => 'أكتوبر'],
            ['key' => 'common.months.november', 'en' => 'November', 'ar' => 'نوفمبر'],
            ['key' => 'common.months.december', 'en' => 'December', 'ar' => 'ديسمبر'],
            ['key' => 'admin.settings.mail_mailer.smtp', 'en' => 'SMTP', 'ar' => 'SMTP'],
            ['key' => 'admin.settings.mail_encryption.none', 'en' => 'None', 'ar' => 'بلا'],
            ['key' => 'announcements.announcement', 'en' => 'Announcement', 'ar' => 'إعلان'],
            ['key' => 'announcements.dont_show_again', 'en' => "Don't show this again", 'ar' => 'عدم إظهار هذا مجدداً'],
            ['key' => 'websites.generate_ad_units_title', 'en' => 'Generate Ad Units in GAM', 'ar' => 'توليد الوحدات الإعلانية في GAM'],
            ['key' => 'websites.select_website_placeholder', 'en' => 'Select website…', 'ar' => 'اختر موقعاً...'],
            ['key' => 'websites.no_websites_found', 'en' => 'No websites found', 'ar' => 'لم يتم العثور على مواقع'],
            ['key' => 'websites.num_banners', 'en' => 'Number of Banners', 'ar' => 'عدد البانرات'],
            ['key' => 'websites.ad_type', 'en' => 'Ad Type', 'ar' => 'نوع الإعلان'],
            ['key' => 'websites.banner', 'en' => 'Banner', 'ar' => 'بانر'],
            ['key' => 'websites.reward', 'en' => 'Reward', 'ar' => 'مكافأة'],
            ['key' => 'websites.interstitial', 'en' => 'Interstitial', 'ar' => 'إعلان بيني'],
            ['key' => 'websites.anchor', 'en' => 'Anchor', 'ar' => 'إعلان ثابت'],
            ['key' => 'websites.float_top', 'en' => 'Float Top', 'ar' => 'إعلان عائم علوي'],
            ['key' => 'websites.float_bottom', 'en' => 'Float Bottom', 'ar' => 'إعلان عائم سفلي'],
            ['key' => 'websites.float_fullscreen', 'en' => 'Float Full Screen', 'ar' => 'إعلان عائم ملء الشاشة'],
            ['key' => 'websites.reward_type', 'en' => 'Reward Type', 'ar' => 'نوع المكافأة'],
            ['key' => 'websites.normal', 'en' => 'Normal', 'ar' => 'عادي'],
            ['key' => 'websites.repeated', 'en' => 'Repeated', 'ar' => 'متكرر'],
            ['key' => 'websites.anchor_position', 'en' => 'Anchor Position', 'ar' => 'موضع الإعلان الثابت'],
            ['key' => 'websites.top', 'en' => 'Top', 'ar' => 'أعلى'],
            ['key' => 'websites.bottom', 'en' => 'Bottom', 'ar' => 'أسفل'],
            ['key' => 'websites.repeat_count', 'en' => 'Repeat Count', 'ar' => 'عدد التكرار'],
            ['key' => 'websites.close_delay', 'en' => 'Close Button Delay (Seconds)', 'ar' => 'تأخير زر الإغلاق (بالثواني)'],
            ['key' => 'websites.delay_between_ads', 'en' => 'Delay Between Ads (Seconds)', 'ar' => 'التأخير بين الإعلانات (بالثواني)'],
            ['key' => 'websites.delay_before_show', 'en' => 'Delay Before Showing Ad (Seconds)', 'ar' => 'التأخير قبل عرض الإعلان (بالثواني)'],
            ['key' => 'websites.supported_sizes', 'en' => 'Supported Sizes', 'ar' => 'المقاسات المدعومة'],
            ['key' => 'websites.applied_to_every_banner', 'en' => '— applied to every banner', 'ar' => '— تطبق على كل بانر'],
            ['key' => 'websites.paste_sizes_placeholder', 'en' => 'Paste sizes: 300x250, 728x90, Fluid…', 'ar' => 'الصق المقاسات: 300x250, 728x90, Fluid...'],
            ['key' => 'websites.ratio_override', 'en' => 'Ratio Override %', 'ar' => 'تجاوز النسبة %'],
            ['key' => 'websites.optional_leave_empty', 'en' => '(optional — leave empty to inherit)', 'ar' => '(اختياري — اتركه فارغاً للوراثة)'],
            ['key' => 'websites.inherit_placeholder', 'en' => 'Inherit from website / publisher', 'ar' => 'وراثة من الموقع / الناشر'],
            ['key' => 'websites.preview_names_assigned', 'en' => 'Preview — names will be assigned round number automatically', 'ar' => 'معاينة — سيتم تعيين رقم الجولة للأسماء تلقائياً'],
            ['key' => 'websites.preview_info_replace', 'en' => '? will be replaced with the next available round (e.g. r1, r2, …) based on existing ad units for this website.', 'ar' => 'سيتم استبدال علامة الاستفهام بالجولة التالية المتاحة (مثال: r1, r2, ...) بناءً على الوحدات الإعلانية الحالية لهذا الموقع.'],
            ['key' => 'websites.generating', 'en' => 'Generating…', 'ar' => 'جاري التوليد...'],
            ['key' => 'websites.generate_multiple_in_gam', 'en' => 'Generate {count} Ad Units in GAM', 'ar' => 'توليد {count} وحدات إعلانية في GAM'],
            ['key' => 'websites.generate_single_in_gam', 'en' => 'Generate {count} Ad Unit in GAM', 'ar' => 'توليد وحدة إعلانية واحدة في GAM'],
            ['key' => 'websites.select_at_least_one_size', 'en' => 'Select at least one size.', 'ar' => 'يرجى اختيار مقاس واحد على الأقل.'],
            ['key' => 'websites.ad_units_created', 'en' => 'Ad units created!', 'ar' => 'تم إنشاء الوحدات الإعلانية بنجاح!'],
            ['key' => 'websites.failed_generate_ad_units', 'en' => 'Failed to generate ad units', 'ar' => 'فشل توليد الوحدات الإعلانية'],
            ['key' => 'common.show', 'en' => 'Show', 'ar' => 'يعرض'],
            ['key' => 'common.collapse', 'en' => 'Collapse', 'ar' => 'ينهار'],
            ['key' => 'common.search_placeholder', 'en' => 'Search placeholder', 'ar' => 'بحث في العنصر النائب'],
            ['key' => 'common.none', 'en' => 'None', 'ar' => 'لا أحد'],
            ['key' => 'common.no_options_found', 'en' => 'No options found', 'ar' => 'لم يتم العثور على خيارات'],
            ['key' => 'common.website', 'en' => 'Website', 'ar' => 'موقع إلكتروني'],
            ['key' => 'adjustments.toast_load_pubs_fail', 'en' => 'Toast load pubs fail', 'ar' => 'تفشل حانات تحميل الخبز المحمص'],
            ['key' => 'adjustments.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص'],
            ['key' => 'adjustments.confirm_delete', 'en' => 'Confirm delete', 'ar' => 'تأكيد الحذف'],
            ['key' => 'adjustments.toast_delete_success', 'en' => 'Toast delete success', 'ar' => 'نخب حذف النجاح'],
            ['key' => 'adjustments.toast_delete_fail', 'en' => 'Toast delete fail', 'ar' => 'نخب حذف فشل'],
            ['key' => 'nav.adjustments', 'en' => 'Adjustments', 'ar' => 'التسويات'],
            ['key' => 'adjustments.total_count', 'en' => 'Total count', 'ar' => 'العدد الإجمالي'],
            ['key' => 'adjustments.apply_bonus', 'en' => 'Apply bonus', 'ar' => 'تطبيق المكافأة'],
            ['key' => 'adjustments.apply_ivt', 'en' => 'Apply ivt', 'ar' => 'تطبيق إيفت'],
            ['key' => 'adjustments.create_adjustment', 'en' => 'Create adjustment', 'ar' => 'إنشاء التعديل'],
            ['key' => 'adjustments.search_placeholder', 'en' => 'Search placeholder', 'ar' => 'بحث في العنصر النائب'],
            ['key' => 'dashboard.filters.all_statuses', 'en' => 'All statuses', 'ar' => 'جميع الحالات'],
            ['key' => 'adjustments.status.applied', 'en' => 'Applied', 'ar' => 'مُطبَّق'],
            ['key' => 'adjustments.table.publisher', 'en' => 'Publisher', 'ar' => 'الناشر'],
            ['key' => 'adjustments.table.amount', 'en' => 'Amount', 'ar' => 'كمية'],
            ['key' => 'adjustments.table.notes', 'en' => 'Notes', 'ar' => 'ملحوظات'],
            ['key' => 'adjustments.table.created_by', 'en' => 'Created by', 'ar' => 'تم إنشاؤها بواسطة'],
            ['key' => 'adjustments.table.created_at', 'en' => 'Created at', 'ar' => 'تم الإنشاء في'],
            ['key' => 'adjustments.table.status', 'en' => 'Status', 'ar' => 'حالة'],
            ['key' => 'adjustments.table.actions', 'en' => 'Actions', 'ar' => 'الإجراءات'],
            ['key' => 'adjustments.empty_state', 'en' => 'Empty state', 'ar' => 'حالة فارغة'],
            ['key' => 'adjustments.empty_state_sub', 'en' => 'Empty state sub', 'ar' => 'حالة فارغة الفرعية'],
            ['key' => 'adjustments.system_admin', 'en' => 'System admin', 'ar' => 'مسؤول النظام'],
            ['key' => 'adjustments.status_applied', 'en' => 'Status applied', 'ar' => 'تم تطبيق الحالة'],
            ['key' => 'adjustments.status_pending', 'en' => 'Status pending', 'ar' => 'الحالة معلقة'],
            ['key' => 'adjustments.table.totals_page', 'en' => 'Totals page', 'ar' => 'صفحة الإجماليات'],
            ['key' => 'adjustments.toast_select_pub', 'en' => 'Toast select pub', 'ar' => 'نخب حدد حانة'],
            ['key' => 'adjustments.toast_invalid_amount', 'en' => 'Toast invalid amount', 'ar' => 'نخب كمية غير صالحة'],
            ['key' => 'adjustments.toast_create_success', 'en' => 'Toast create success', 'ar' => 'نخب خلق النجاح'],
            ['key' => 'adjustments.toast_create_fail', 'en' => 'Toast create fail', 'ar' => 'نخب خلق فشل'],
            ['key' => 'adjustments.create_desc', 'en' => 'Create desc', 'ar' => 'إنشاء وصف'],
            ['key' => 'adjustments.publisher_label', 'en' => 'Publisher label', 'ar' => 'تسمية الناشر'],
            ['key' => 'adjustments.select_publisher', 'en' => 'Select publisher', 'ar' => 'حدد الناشر'],
            ['key' => 'adjustments.no_publishers_found', 'en' => 'No publishers found', 'ar' => 'لم يتم العثور على ناشرين'],
            ['key' => 'adjustments.amount_label', 'en' => 'Amount label', 'ar' => 'تسمية المبلغ'],
            ['key' => 'adjustments.amount_hint', 'en' => 'Amount hint', 'ar' => 'تلميح المبلغ'],
            ['key' => 'adjustments.notes_label', 'en' => 'Notes label', 'ar' => 'تسمية الملاحظات'],
            ['key' => 'adjustments.notes_placeholder', 'en' => 'Notes placeholder', 'ar' => 'ملاحظات نائبة'],
            ['key' => 'adjustments.creating', 'en' => 'Creating', 'ar' => 'خلق'],
            ['key' => 'adjustments.toast_load_gam_fail', 'en' => 'Toast load gam fail', 'ar' => 'فشل تحميل نخب اللعبة'],
            ['key' => 'adjustments.toast_load_websites_fail', 'en' => 'Toast load websites fail', 'ar' => 'فشل تحميل مواقع الويب'],
            ['key' => 'adjustments.toast_select_gam', 'en' => 'Toast select gam', 'ar' => 'نخب حدد لعبة'],
            ['key' => 'adjustments.toast_select_website', 'en' => 'Toast select website', 'ar' => 'نخب تحديد الموقع'],
            ['key' => 'adjustments.toast_select_dates', 'en' => 'Toast select dates', 'ar' => 'نخب تحديد التواريخ'],
            ['key' => 'adjustments.toast_invalid_percent', 'en' => 'Toast invalid percent', 'ar' => 'نخب في المئة غير صالحة'],
            ['key' => 'adjustments.toast_ivt_success', 'en' => 'Toast ivt success', 'ar' => 'نخب النجاح'],
            ['key' => 'adjustments.toast_ivt_fail', 'en' => 'Toast ivt fail', 'ar' => 'نخب IVT تفشل'],
            ['key' => 'adjustments.ivt_desc', 'en' => 'Ivt desc', 'ar' => 'وصف إيفت'],
            ['key' => 'adjustments.gam_account_label', 'en' => 'Gam account label', 'ar' => 'تسمية حساب GAM'],
            ['key' => 'adjustments.loading_accounts', 'en' => 'Loading accounts', 'ar' => 'جارٍ تحميل الحسابات'],
            ['key' => 'adjustments.select_gam_account', 'en' => 'Select gam account', 'ar' => 'حدد حساب اللعبة'],
            ['key' => 'adjustments.websites_label', 'en' => 'Websites label', 'ar' => 'تسمية المواقع'],
            ['key' => 'adjustments.select_websites_btn', 'en' => 'Select websites btn', 'ar' => 'حدد مواقع الويب btn'],
            ['key' => 'adjustments.loading_websites', 'en' => 'Loading websites', 'ar' => 'تحميل المواقع'],
            ['key' => 'adjustments.no_websites_linked', 'en' => 'No websites linked', 'ar' => 'لا توجد مواقع مرتبطة'],
            ['key' => 'adjustments.selected_count', 'en' => 'Selected count', 'ar' => 'العدد المحدد'],
            ['key' => 'adjustments.ivt_percent_label', 'en' => 'Ivt percent label', 'ar' => 'تسمية Ivt في المئة'],
            ['key' => 'adjustments.applying', 'en' => 'Applying', 'ar' => 'التقديم'],
            ['key' => 'adjustments.deselect_filtered', 'en' => 'Deselect filtered', 'ar' => 'قم بإلغاء التحديد الذي تمت تصفيته'],
            ['key' => 'adjustments.deselect_all', 'en' => 'Deselect all', 'ar' => 'قم بإلغاء تحديد الكل'],
            ['key' => 'adjustments.select_filtered', 'en' => 'Select filtered', 'ar' => 'حدد التصفية'],
            ['key' => 'adjustments.select_all', 'en' => 'Select all', 'ar' => 'حدد الكل'],
            ['key' => 'adjustments.select_websites', 'en' => 'Select websites', 'ar' => 'حدد مواقع الويب'],
            ['key' => 'adjustments.select_bonus_desc', 'en' => 'Select bonus desc', 'ar' => 'حدد وصف المكافأة'],
            ['key' => 'adjustments.select_ivt_desc', 'en' => 'Select ivt desc', 'ar' => 'حدد وصف IVT'],
            ['key' => 'adjustments.search_websites_placeholder', 'en' => 'Search websites placeholder', 'ar' => 'البحث عن العناصر النائبة لمواقع الويب'],
            ['key' => 'adjustments.no_websites_match', 'en' => 'No websites match', 'ar' => 'لا توجد مواقع ويب متطابقة'],
            ['key' => 'adjustments.pub_prefix', 'en' => 'Pub prefix', 'ar' => 'بادئة الحانة'],
            ['key' => 'adjustments.confirm_selection', 'en' => 'Confirm selection', 'ar' => 'تأكيد الاختيار'],
            ['key' => 'adjustments.toast_bonus_success', 'en' => 'Toast bonus success', 'ar' => 'نخب مكافأة النجاح'],
            ['key' => 'adjustments.toast_bonus_fail', 'en' => 'Toast bonus fail', 'ar' => 'مكافأة نخب تفشل'],
            ['key' => 'adjustments.bonus_desc', 'en' => 'Bonus desc', 'ar' => 'وصف المكافأة'],
            ['key' => 'adjustments.bonus_percent_label', 'en' => 'Bonus percent label', 'ar' => 'تسمية النسبة المئوية للمكافأة'],
            ['key' => 'admin.admins.toast.load_failed', 'en' => 'Load failed', 'ar' => 'فشل التحميل'],
            ['key' => 'admin.admins.toast.password_required', 'en' => 'Password required', 'ar' => 'كلمة المرور مطلوبة'],
            ['key' => 'admin.admins.toast.admin_updated', 'en' => 'Admin updated', 'ar' => 'تم تحديث المشرف'],
            ['key' => 'admin.admins.toast.admin_created', 'en' => 'Admin created', 'ar' => 'تم إنشاء المشرف'],
            ['key' => 'admin.admins.toast.role_name_required', 'en' => 'Role name required', 'ar' => 'اسم الدور مطلوب'],
            ['key' => 'admin.admins.toast.role_updated', 'en' => 'Role updated', 'ar' => 'تم تحديث الدور'],
            ['key' => 'admin.admins.toast.role_created', 'en' => 'Role created', 'ar' => 'تم إنشاء الدور'],
            ['key' => 'admin.admins.toast.delete_self_failed', 'en' => 'Delete self failed', 'ar' => 'فشل الحذف الذاتي'],
            ['key' => 'admin.admins.toast.delete_primary_failed', 'en' => 'Delete primary failed', 'ar' => 'فشل حذف الأساسي'],
            ['key' => 'admin.admins.confirm_delete_admin', 'en' => 'Confirm delete admin', 'ar' => 'تأكيد حذف المشرف'],
            ['key' => 'admin.admins.toast.admin_deleted', 'en' => 'Admin deleted', 'ar' => 'تم حذف المشرف'],
            ['key' => 'admin.admins.toast.delete_admin_failed', 'en' => 'Delete admin failed', 'ar' => 'فشل حذف المشرف'],
            ['key' => 'admin.admins.toast.delete_system_role_failed', 'en' => 'Delete system role failed', 'ar' => 'فشل حذف دور النظام'],
            ['key' => 'admin.admins.confirm_delete_role', 'en' => 'Confirm delete role', 'ar' => 'تأكيد حذف الدور'],
            ['key' => 'admin.admins.toast.role_deleted', 'en' => 'Role deleted', 'ar' => 'تم حذف الدور'],
            ['key' => 'admin.admins.toast.delete_role_failed', 'en' => 'Delete role failed', 'ar' => 'فشل حذف الدور'],
            ['key' => 'admin.admins.title', 'en' => 'Title', 'ar' => 'عنوان'],
            ['key' => 'admin.admins.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة'],
            ['key' => 'admin.admins.btn.add_admin', 'en' => 'Add admin', 'ar' => 'أضف المشرف'],
            ['key' => 'admin.admins.btn.create_role', 'en' => 'Create role', 'ar' => 'إنشاء دور'],
            ['key' => 'admin.admins.tab.admins', 'en' => 'Admins', 'ar' => 'المشرفين'],
            ['key' => 'admin.admins.tab.roles', 'en' => 'Roles', 'ar' => 'الأدوار'],
            ['key' => 'admin.admins.loading', 'en' => 'Loading', 'ar' => 'تحميل'],
            ['key' => 'admin.admins.table.col_admin', 'en' => 'Col admin', 'ar' => 'المشرف العقيد'],
            ['key' => 'admin.admins.table.col_email', 'en' => 'Col email', 'ar' => 'البريد الإلكتروني العقيد'],
            ['key' => 'admin.admins.table.col_roles', 'en' => 'Col roles', 'ar' => 'أدوار العقيد'],
            ['key' => 'admin.admins.table.col_status', 'en' => 'Col status', 'ar' => 'حالة العقيد'],
            ['key' => 'admin.admins.table.col_joined', 'en' => 'Col joined', 'ar' => 'انضم العقيد
'],
            ['key' => 'admin.admins.table.col_actions', 'en' => 'Col actions', 'ar' => 'إجراءات العقيد
'],
            ['key' => 'admin.admins.badge.primary', 'en' => 'Primary', 'ar' => 'الابتدائية
'],
            ['key' => 'admin.admins.badge.you', 'en' => 'You', 'ar' => 'أنت
'],
            ['key' => 'admin.admins.no_role', 'en' => 'No role', 'ar' => 'لا دور
'],
            ['key' => 'admin.admins.overrides_title', 'en' => 'Overrides title', 'ar' => 'يتجاوز العنوان
'],
            ['key' => 'admin.admins.overrides_count', 'en' => 'Overrides count', 'ar' => 'يتجاوز العد
'],
            ['key' => 'admin.admins.badge.active', 'en' => 'Active', 'ar' => 'نشط
'],
            ['key' => 'admin.admins.badge.suspended', 'en' => 'Suspended', 'ar' => 'مع وقف التنفيذ
'],
            ['key' => 'admin.admins.btn.edit_admin', 'en' => 'Edit admin', 'ar' => 'تحرير المشرف
'],
            ['key' => 'admin.admins.btn.delete_admin', 'en' => 'Delete admin', 'ar' => 'حذف المشرف
'],
            ['key' => 'admin.admins.badge.system_role', 'en' => 'System role', 'ar' => 'دور النظام
'],
            ['key' => 'admin.admins.btn.edit_role', 'en' => 'Edit role', 'ar' => 'تحرير الدور
'],
            ['key' => 'admin.admins.btn.delete_role', 'en' => 'Delete role', 'ar' => 'حذف الدور
'],
            ['key' => 'admin.admins.granted_permissions', 'en' => 'Granted permissions', 'ar' => 'الأذونات الممنوحة
'],
            ['key' => 'admin.admins.no_permissions', 'en' => 'No permissions', 'ar' => 'لا أذونات
'],
            ['key' => 'admin.admins.modal.edit_admin_title', 'en' => 'Edit admin title', 'ar' => 'تحرير عنوان المشرف
'],
            ['key' => 'admin.admins.modal.add_admin_title', 'en' => 'Add admin title', 'ar' => 'أضف عنوان المشرف
'],
            ['key' => 'admin.admins.modal.primary_lock_title', 'en' => 'Primary lock title', 'ar' => 'عنوان القفل الأساسي
'],
            ['key' => 'admin.admins.modal.primary_lock_desc', 'en' => 'Primary lock desc', 'ar' => 'وصف القفل الأساسي
'],
            ['key' => 'admin.admins.form.full_name', 'en' => 'Full name', 'ar' => 'الاسم الكامل
'],
            ['key' => 'admin.admins.form.email', 'en' => 'Email', 'ar' => 'البريد الإلكتروني
'],
            ['key' => 'admin.admins.form.change_password', 'en' => 'Change password', 'ar' => 'تغيير كلمة المرور
'],
            ['key' => 'admin.admins.form.password', 'en' => 'Password', 'ar' => 'كلمة المرور
'],
            ['key' => 'admin.admins.form.password_placeholder_edit', 'en' => 'Password placeholder edit', 'ar' => 'تعديل العنصر النائب لكلمة المرور
'],
            ['key' => 'admin.admins.form.password_placeholder_add', 'en' => 'Password placeholder add', 'ar' => 'إضافة العنصر النائب لكلمة المرور
'],
            ['key' => 'admin.admins.form.active_account', 'en' => 'Active account', 'ar' => 'حساب نشط
'],
            ['key' => 'admin.admins.form.assign_roles', 'en' => 'Assign roles', 'ar' => 'تعيين الأدوار
'],
            ['key' => 'admin.admins.form.direct_overrides', 'en' => 'Direct overrides', 'ar' => 'التجاوزات المباشرة
'],
            ['key' => 'admin.admins.form.inherited_notice', 'en' => 'Inherited notice', 'ar' => 'إشعار موروث
'],
            ['key' => 'admin.admins.form.granted_super_admin', 'en' => 'Granted super admin', 'ar' => 'منح المشرف المتميز
'],
            ['key' => 'admin.admins.form.inherited_from_role', 'en' => 'Inherited from role', 'ar' => 'ورثت من الدور
'],
            ['key' => 'admin.admins.form.direct_override', 'en' => 'Direct override', 'ar' => 'التجاوز المباشر
'],
            ['key' => 'admin.admins.btn.cancel', 'en' => 'Cancel', 'ar' => 'إلغاء
'],
            ['key' => 'admin.admins.btn.save_changes', 'en' => 'Save changes', 'ar' => 'حفظ التغييرات
'],
            ['key' => 'admin.admins.modal.edit_role_title', 'en' => 'Edit role title', 'ar' => 'تحرير عنوان الدور
'],
            ['key' => 'admin.admins.modal.create_role_title', 'en' => 'Create role title', 'ar' => 'إنشاء عنوان الدور
'],
            ['key' => 'admin.admins.form.role_name', 'en' => 'Role name', 'ar' => 'اسم الدور
'],
            ['key' => 'admin.admins.form.role_name_placeholder', 'en' => 'Role name placeholder', 'ar' => 'العنصر النائب لاسم الدور
'],
            ['key' => 'admin.admins.form.system_role_notice', 'en' => 'System role notice', 'ar' => 'إشعار دور النظام'],
            ['key' => 'admin.admins.form.granted_permissions_title', 'en' => 'Granted permissions title', 'ar' => 'عنوان الأذونات الممنوحة
'],
            ['key' => 'adops.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'adops.toast_sync_success', 'en' => 'Toast sync success', 'ar' => 'نخب مزامنة النجاح
'],
            ['key' => 'adops.toast_sync_fail', 'en' => 'Toast sync fail', 'ar' => 'فشل مزامنة الخبز المحمص
'],
            ['key' => 'adops.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'adops.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'adops.syncing', 'en' => 'Syncing', 'ar' => 'المزامنة
'],
            ['key' => 'adops.run_sync_btn', 'en' => 'Run sync btn', 'ar' => 'قم بتشغيل المزامنة btn
'],
            ['key' => 'adops.traffic_stats', 'en' => 'Traffic stats', 'ar' => 'احصائيات المرور
'],
            ['key' => 'adops.stat_impressions', 'en' => 'Stat impressions', 'ar' => 'الانطباعات الإحصائية
'],
            ['key' => 'adops.platform_wide', 'en' => 'Platform wide', 'ar' => 'منصة واسعة
'],
            ['key' => 'adops.stat_clicks', 'en' => 'Stat clicks', 'ar' => 'النقرات الإحصائية
'],
            ['key' => 'adops.stat_unfilled', 'en' => 'Stat unfilled', 'ar' => 'الإحصائيات شاغرة
'],
            ['key' => 'adops.unserved', 'en' => 'Unserved', 'ar' => 'غير مخدومة
'],
            ['key' => 'adops.stat_avg_cpm', 'en' => 'Stat avg cpm', 'ar' => 'إحصائيات متوسط التكلفة لكل ألف ظهور
'],
            ['key' => 'adops.gross_per_1000', 'en' => 'Gross per 1000', 'ar' => 'الإجمالي لكل 1000
'],
            ['key' => 'adops.stat_avg_ctr', 'en' => 'Stat avg ctr', 'ar' => 'إحصائيات متوسط نسبة النقر إلى الظهور
'],
            ['key' => 'adops.platform_click_rate', 'en' => 'Platform click rate', 'ar' => 'معدل النقر على المنصة
'],
            ['key' => 'adops.stat_viewability', 'en' => 'Stat viewability', 'ar' => 'إمكانية العرض الإحصائية
'],
            ['key' => 'adops.active_view_viewable', 'en' => 'Active view viewable', 'ar' => 'عرض نشط للعرض
'],
            ['key' => 'adops.websites_tracker', 'en' => 'Websites tracker', 'ar' => 'تعقب المواقع
'],
            ['key' => 'adops.websites_subtitle', 'en' => 'Websites subtitle', 'ar' => 'العنوان الفرعي للمواقع
'],
            ['key' => 'common.domain', 'en' => 'Domain', 'ar' => 'المجال
'],
            ['key' => 'gam.network_code_label', 'en' => 'Network code label', 'ar' => 'تسمية رمز الشبكة
'],
            ['key' => 'adops.no_websites', 'en' => 'No websites', 'ar' => 'لا توجد مواقع
'],
            ['key' => 'adops.sync_logs', 'en' => 'Sync logs', 'ar' => 'سجلات المزامنة
'],
            ['key' => 'adops.sync_logs_subtitle', 'en' => 'Sync logs subtitle', 'ar' => 'سجلات المزامنة العنوان الفرعي
'],
            ['key' => 'adops.no_sync_logs', 'en' => 'No sync logs', 'ar' => 'لا توجد سجلات المزامنة
'],
            ['key' => 'adops.configured_ad_units', 'en' => 'Configured ad units', 'ar' => 'الوحدات الإعلانية التي تم تكوينها
'],
            ['key' => 'adops.ad_units_subtitle', 'en' => 'Ad units subtitle', 'ar' => 'العنوان الفرعي للوحدات الإعلانية
'],
            ['key' => 'adops.col_ad_unit_name', 'en' => 'Col ad unit name', 'ar' => 'اسم الوحدة الإعلانية العمودية
'],
            ['key' => 'adops.col_display_name', 'en' => 'Col display name', 'ar' => 'اسم العرض العقيد
'],
            ['key' => 'adops.col_format', 'en' => 'Col format', 'ar' => 'تنسيق العقيد
'],
            ['key' => 'adops.col_sizes', 'en' => 'Col sizes', 'ar' => 'أحجام العقيد
'],
            ['key' => 'adops.col_gam_status', 'en' => 'Col gam status', 'ar' => 'حالة العقيد جام
'],
            ['key' => 'adops.no_ad_units', 'en' => 'No ad units', 'ar' => 'لا توجد وحدات إعلانية
'],
            ['key' => 'adops.linked', 'en' => 'Linked', 'ar' => 'مرتبط
'],
            ['key' => 'admin.announcements.toast.load_failed', 'en' => 'Load failed', 'ar' => 'فشل التحميل
'],
            ['key' => 'admin.announcements.toast.updated', 'en' => 'Updated', 'ar' => 'تم التحديث
'],
            ['key' => 'admin.announcements.toast.created', 'en' => 'Created', 'ar' => 'تم إنشاؤها'],
            ['key' => 'admin.announcements.toast.save_failed', 'en' => 'Save failed', 'ar' => 'فشل الحفظ
'],
            ['key' => 'admin.announcements.confirm_delete', 'en' => 'Confirm delete', 'ar' => 'تأكيد الحذف
'],
            ['key' => 'admin.announcements.toast.deleted', 'en' => 'Deleted', 'ar' => 'تم الحذف
'],
            ['key' => 'admin.announcements.toast.delete_failed', 'en' => 'Delete failed', 'ar' => 'فشل الحذف
'],
            ['key' => 'admin.announcements.form.loading_publisher', 'en' => 'Loading publisher', 'ar' => 'جاري تحميل الناشر
'],
            ['key' => 'admin.announcements.form.search_publisher_placeholder', 'en' => 'Search publisher placeholder', 'ar' => 'البحث عن العنصر النائب للناشر
'],
            ['key' => 'admin.announcements.btn.add', 'en' => 'Add', 'ar' => 'أضف
'],
            ['key' => 'admin.announcements.loading', 'en' => 'Loading', 'ar' => 'جاري التحميل
'],
            ['key' => 'admin.announcements.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'admin.announcements.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'admin.announcements.btn.new_announcement', 'en' => 'New announcement', 'ar' => 'اعلان جديد
'],
            ['key' => 'admin.announcements.empty.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'admin.announcements.empty.sub', 'en' => 'Sub', 'ar' => 'الفرعية
'],
            ['key' => 'admin.announcements.table.col_title', 'en' => 'Col title', 'ar' => 'عنوان العقيد
'],
            ['key' => 'admin.announcements.table.col_type', 'en' => 'Col type', 'ar' => 'نوع العقيد
'],
            ['key' => 'admin.announcements.table.col_target', 'en' => 'Col target', 'ar' => 'الهدف العقيد
'],
            ['key' => 'admin.announcements.table.col_priority', 'en' => 'Col priority', 'ar' => 'أولوية العقيد
'],
            ['key' => 'admin.announcements.table.col_status', 'en' => 'Col status', 'ar' => 'حالة العقيد
'],
            ['key' => 'admin.announcements.table.col_schedule', 'en' => 'Col schedule', 'ar' => 'الجدول الزمني العقيد
'],
            ['key' => 'admin.announcements.table.col_views', 'en' => 'Col views', 'ar' => 'وجهات النظر العقيد
'],
            ['key' => 'admin.announcements.table.col_clicks', 'en' => 'Col clicks', 'ar' => 'نقرات العقيد
'],
            ['key' => 'admin.announcements.table.col_dismissals', 'en' => 'Col dismissals', 'ar' => 'إقالة العقيد
'],
            ['key' => 'admin.announcements.table.col_actions', 'en' => 'Col actions', 'ar' => 'إجراءات العقيد
'],
            ['key' => 'admin.announcements.badge.active', 'en' => 'Active', 'ar' => 'نشط
'],
            ['key' => 'admin.announcements.badge.inactive', 'en' => 'Inactive', 'ar' => 'غير نشط
'],
            ['key' => 'admin.announcements.schedule.from', 'en' => 'From', 'ar' => 'من
'],
            ['key' => 'admin.announcements.schedule.to', 'en' => 'To', 'ar' => 'ل
'],
            ['key' => 'admin.announcements.schedule.lifetime', 'en' => 'Lifetime', 'ar' => 'مدى الحياة
'],
            ['key' => 'admin.announcements.btn.edit', 'en' => 'Edit', 'ar' => 'تحرير
'],
            ['key' => 'admin.announcements.modal.edit_title', 'en' => 'Edit title', 'ar' => 'تحرير العنوان
'],
            ['key' => 'admin.announcements.modal.create_title', 'en' => 'Create title', 'ar' => 'إنشاء عنوان
'],
            ['key' => 'admin.announcements.form.title_label', 'en' => 'Title label', 'ar' => 'تسمية العنوان
'],
            ['key' => 'admin.announcements.form.title_placeholder', 'en' => 'Title placeholder', 'ar' => 'العنصر النائب للعنوان
'],
            ['key' => 'admin.announcements.form.title_ar_label', 'en' => 'Title (Arabic)', 'ar' => 'العنوان (بالعربية)'],
            ['key' => 'admin.announcements.form.title_ar_placeholder', 'en' => 'Arabic announcement title', 'ar' => 'عنوان الإعلان بالعربية'],
            ['key' => 'admin.announcements.form.content_ar_label', 'en' => 'Content (Arabic)', 'ar' => 'المحتوى (بالعربية)'],
            ['key' => 'admin.announcements.form.type_label', 'en' => 'Type label', 'ar' => 'اكتب التصنيف
'],
            ['key' => 'admin.announcements.type.banner', 'en' => 'Banner', 'ar' => 'راية
'],
            ['key' => 'admin.announcements.type.modal', 'en' => 'Modal', 'ar' => 'مشروط
'],
            ['key' => 'admin.announcements.form.style_label', 'en' => 'Style label', 'ar' => 'تسمية النمط
'],
            ['key' => 'admin.announcements.style.info', 'en' => 'Info', 'ar' => 'معلومات
'],
            ['key' => 'admin.announcements.style.success', 'en' => 'Success', 'ar' => 'النجاح
'],
            ['key' => 'admin.announcements.style.warning', 'en' => 'Warning', 'ar' => 'تحذير'],
            ['key' => 'admin.announcements.style.danger', 'en' => 'Danger', 'ar' => 'خطر
'],
            ['key' => 'admin.announcements.form.priority_label', 'en' => 'Priority label', 'ar' => 'تسمية الأولوية
'],
            ['key' => 'admin.announcements.form.content_label', 'en' => 'Content label', 'ar' => 'تسمية المحتوى
'],
            ['key' => 'admin.announcements.form.start_date_label', 'en' => 'Start date label', 'ar' => 'تسمية تاريخ البدء
'],
            ['key' => 'admin.announcements.form.end_date_label', 'en' => 'End date label', 'ar' => 'تسمية تاريخ الانتهاء
'],
            ['key' => 'admin.announcements.form.target_audience', 'en' => 'Target audience', 'ar' => 'الجمهور المستهدف
'],
            ['key' => 'admin.announcements.target.all', 'en' => 'All', 'ar' => 'الكل
'],
            ['key' => 'admin.announcements.target.publishers', 'en' => 'Publishers', 'ar' => 'الناشرين
'],
            ['key' => 'admin.announcements.target.countries', 'en' => 'Countries', 'ar' => 'البلدان
'],
            ['key' => 'admin.announcements.target.roles', 'en' => 'Roles', 'ar' => 'الأدوار
'],
            ['key' => 'admin.announcements.form.select_publishers', 'en' => 'Select publishers', 'ar' => 'حدد الناشرين
'],
            ['key' => 'admin.announcements.form.country_codes', 'en' => 'Country codes', 'ar' => 'رموز البلد
'],
            ['key' => 'admin.announcements.form.country_placeholder', 'en' => 'Country placeholder', 'ar' => 'العنصر النائب للبلد
'],
            ['key' => 'admin.announcements.form.roles', 'en' => 'Roles', 'ar' => 'الأدوار
'],
            ['key' => 'admin.announcements.form.role_placeholder', 'en' => 'Role placeholder', 'ar' => 'العنصر النائب للدور
'],
            ['key' => 'admin.announcements.form.action_buttons', 'en' => 'Action buttons', 'ar' => 'أزرار الإجراءات
'],
            ['key' => 'admin.announcements.btn.add_button', 'en' => 'Add button', 'ar' => 'إضافة زر
'],
            ['key' => 'admin.announcements.form.no_buttons', 'en' => 'No buttons', 'ar' => 'لا أزرار
'],
            ['key' => 'admin.announcements.form.btn_text_placeholder', 'en' => 'Btn text placeholder', 'ar' => 'العنصر النائب للنص Btn
'],
            ['key' => 'admin.announcements.form.btn_text_ar_placeholder', 'en' => 'Text (AR)', 'ar' => 'نص الزر بالعربية'],
            ['key' => 'admin.announcements.form.new_tab', 'en' => 'New tab', 'ar' => 'علامة تبويب جديدة
'],
            ['key' => 'admin.announcements.btn.cancel', 'en' => 'Cancel', 'ar' => 'إلغاء
'],
            ['key' => 'admin.announcements.btn.saving', 'en' => 'Saving', 'ar' => 'الادخار
'],
            ['key' => 'admin.announcements.btn.update', 'en' => 'Update', 'ar' => 'تحديث
'],
            ['key' => 'admin.announcements.btn.create', 'en' => 'Create', 'ar' => 'إنشاء
'],
            ['key' => 'audit.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'audit.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'audit.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'common.hide_filters', 'en' => 'Hide filters', 'ar' => 'إخفاء المرشحات
'],
            ['key' => 'common.show_filters', 'en' => 'Show filters', 'ar' => 'إظهار المرشحات
'],
            ['key' => 'audit.all_actions', 'en' => 'All actions', 'ar' => 'جميع الإجراءات
'],
            ['key' => 'audit.action_created', 'en' => 'Action created', 'ar' => 'تم إنشاء الإجراء
'],
            ['key' => 'audit.action_updated', 'en' => 'Action updated', 'ar' => 'تم تحديث الإجراء
'],
            ['key' => 'audit.action_deleted', 'en' => 'Action deleted', 'ar' => 'تم حذف الإجراء
'],
            ['key' => 'audit.action_suspended', 'en' => 'Action suspended', 'ar' => 'تم تعليق الإجراء
'],
            ['key' => 'audit.action_approved', 'en' => 'Action approved', 'ar' => 'تمت الموافقة على الإجراء
'],
            ['key' => 'audit.action_rejected', 'en' => 'Action rejected', 'ar' => 'تم رفض الإجراء
'],
            ['key' => 'payouts.status_paid', 'en' => 'Status paid', 'ar' => 'الحالة مدفوعة
'],
            ['key' => 'common.status_closed', 'en' => 'Status closed', 'ar' => 'الحالة مغلقة
'],
            ['key' => 'audit.all_entities', 'en' => 'All entities', 'ar' => 'جميع الكيانات
'],
            ['key' => 'audit.entity_website', 'en' => 'Entity website', 'ar' => 'موقع الكيان'],
            ['key' => 'audit.entity_ad_unit', 'en' => 'Entity ad unit', 'ar' => 'الوحدة الإعلانية للكيان
'],
            ['key' => 'audit.entity_setting', 'en' => 'Entity setting', 'ar' => 'إعداد الكيان
'],
            ['key' => 'audit.entity_payout', 'en' => 'Entity payout', 'ar' => 'دفعات الكيان
'],
            ['key' => 'audit.entity_period_closing', 'en' => 'Entity period closing', 'ar' => 'إغلاق فترة الكيان
'],
            ['key' => 'audit.no_logs', 'en' => 'No logs', 'ar' => 'لا سجلات
'],
            ['key' => 'audit.col_timestamp', 'en' => 'Col timestamp', 'ar' => 'الطابع الزمني العقيد
'],
            ['key' => 'audit.col_admin', 'en' => 'Col admin', 'ar' => 'المشرف العقيد
'],
            ['key' => 'audit.col_action', 'en' => 'Col action', 'ar' => 'عمل العقيد
'],
            ['key' => 'audit.col_entity', 'en' => 'Col entity', 'ar' => 'كيان العقيد
'],
            ['key' => 'audit.col_changes', 'en' => 'Col changes', 'ar' => 'التغييرات العقيد
'],
            ['key' => 'audit.col_ip', 'en' => 'Col ip', 'ar' => 'العقيد الملكية الفكرية
'],
            ['key' => 'audit.system', 'en' => 'System', 'ar' => 'النظام
'],
            ['key' => 'audit.view_payload', 'en' => 'View payload', 'ar' => 'عرض الحمولة
'],
            ['key' => 'audit.old_label', 'en' => 'Old label', 'ar' => 'التسمية القديمة
'],
            ['key' => 'audit.new_label', 'en' => 'New label', 'ar' => 'تسمية جديدة
'],
            ['key' => 'content.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'content.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'content.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'content.platform_content', 'en' => 'Platform content', 'ar' => 'محتوى المنصة
'],
            ['key' => 'content.stat_active_pages', 'en' => 'Stat active pages', 'ar' => 'إحصائيات الصفحات النشطة
'],
            ['key' => 'content.stat_pages_sub', 'en' => 'Stat pages sub', 'ar' => 'الصفحات الإحصائية الفرعية
'],
            ['key' => 'content.stat_trans_keys', 'en' => 'Stat trans keys', 'ar' => 'مفاتيح الإحصائيات العابرة
'],
            ['key' => 'content.stat_trans_sub', 'en' => 'Stat trans sub', 'ar' => 'الإحصائيات العابرة الفرعية
'],
            ['key' => 'email_tpl.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'content.stat_email_sub', 'en' => 'Stat email sub', 'ar' => 'إحصائيات البريد الإلكتروني الفرعي
'],
            ['key' => 'content.stat_announcements', 'en' => 'Stat announcements', 'ar' => 'إعلانات الإحصائيات
'],
            ['key' => 'content.stat_announcements_sub', 'en' => 'Stat announcements sub', 'ar' => 'إعلانات الإحصائيات الفرعية
'],
            ['key' => 'content.recent_pages', 'en' => 'Recent pages', 'ar' => 'الصفحات الأخيرة
'],
            ['key' => 'content.pages_subtitle', 'en' => 'Pages subtitle', 'ar' => 'عنوان فرعي للصفحات
'],
            ['key' => 'common.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'pages.col_slug', 'en' => 'Col slug', 'ar' => 'سبيكة العقيد
'],
            ['key' => 'common.action', 'en' => 'Action', 'ar' => 'العمل
'],
            ['key' => 'pages.no_pages', 'en' => 'No pages', 'ar' => 'لا توجد صفحات
'],
            ['key' => 'content.published', 'en' => 'Published', 'ar' => 'تم النشر
'],
            ['key' => 'content.draft', 'en' => 'Draft', 'ar' => 'مسودة
'],
            ['key' => 'content.sys_email_tpl', 'en' => 'Sys email tpl', 'ar' => 'البريد الإلكتروني لنظام tpl
'],
            ['key' => 'content.email_tpl_subtitle', 'en' => 'Email tpl subtitle', 'ar' => 'البريد الإلكتروني العنوان الفرعي tpl
'],
            ['key' => 'content.col_event_template', 'en' => 'Col event template', 'ar' => 'قالب الحدث العقيد
'],
            ['key' => 'content.col_subject_title', 'en' => 'Col subject title', 'ar' => 'عنوان الموضوع العقيد
'],
            ['key' => 'common.actions', 'en' => 'Actions', 'ar' => 'الإجراءات'],
            ['key' => 'content.no_templates', 'en' => 'No templates', 'ar' => 'لا توجد قوالب
'],
            ['key' => 'content.customize', 'en' => 'Customize', 'ar' => 'تخصيص
'],
            ['key' => 'content.translations_progress', 'en' => 'Translations progress', 'ar' => 'تقدم الترجمات
'],
            ['key' => 'content.translations_desc', 'en' => 'Translations desc', 'ar' => 'وصف الترجمات
'],
            ['key' => 'content.100_complete', 'en' => '100 complete', 'ar' => '100 كاملة
'],
            ['key' => 'content.mappings_active', 'en' => 'Mappings active', 'ar' => 'التعيينات نشطة
'],
            ['key' => 'content.pending_translation', 'en' => 'Pending translation', 'ar' => 'في انتظار الترجمة
'],
            ['key' => 'content.awaiting_sync', 'en' => 'Awaiting sync', 'ar' => 'في انتظار المزامنة
'],
            ['key' => 'content.initialize', 'en' => 'Initialize', 'ar' => 'تهيئة
'],
            ['key' => 'dashboard.toast_sync_success', 'en' => 'Toast sync success', 'ar' => 'نخب مزامنة النجاح
'],
            ['key' => 'dashboard.toast_sync_fail', 'en' => 'Toast sync fail', 'ar' => 'فشل مزامنة الخبز المحمص
'],
            ['key' => 'dashboard.revenue_records_count', 'en' => 'Revenue records count', 'ar' => 'عدد سجلات الإيرادات
'],
            ['key' => 'dashboard.admin_welcome', 'en' => 'Admin welcome', 'ar' => 'ترحيب المشرف
'],
            ['key' => 'dashboard.syncing', 'en' => 'Syncing', 'ar' => 'المزامنة
'],
            ['key' => 'dashboard.run_sync', 'en' => 'Run sync', 'ar' => 'تشغيل المزامنة
'],
            ['key' => 'dashboard.filters.period', 'en' => 'Period', 'ar' => 'الفترة
'],
            ['key' => 'dashboard.filters.from', 'en' => 'From', 'ar' => 'من
'],
            ['key' => 'dashboard.filters.to', 'en' => 'To', 'ar' => 'ل
'],
            ['key' => 'dashboard.filters.all_publishers', 'en' => 'All publishers', 'ar' => 'جميع الناشرين
'],
            ['key' => 'dashboard.status.closed', 'en' => 'Closed', 'ar' => 'مغلق
'],
            ['key' => 'dashboard.filters.reset', 'en' => 'Reset', 'ar' => 'إعادة تعيين
'],
            ['key' => 'dashboard.revenue_metrics', 'en' => 'Revenue metrics', 'ar' => 'مقاييس الإيرادات
'],
            ['key' => 'dashboard.stats.total_gross', 'en' => 'Total gross', 'ar' => 'الإجمالي الإجمالي
'],
            ['key' => 'dashboard.stats.total_pub_earnings', 'en' => 'Total pub earnings', 'ar' => 'إجمالي أرباح الحانة
'],
            ['key' => 'dashboard.stats.ratio_split', 'en' => 'Ratio split', 'ar' => 'تقسيم النسبة
'],
            ['key' => 'dashboard.stats.approved_label', 'en' => 'Approved label', 'ar' => 'التسمية المعتمدة
'],
            ['key' => 'dashboard.stats.holding_period', 'en' => 'Holding period', 'ar' => 'فترة القابضة
'],
            ['key' => 'dashboard.stats.ready_payout', 'en' => 'Ready payout', 'ar' => 'دفع تعويضات جاهزة
'],
            ['key' => 'dashboard.stats.filtered_balance', 'en' => 'Filtered balance', 'ar' => 'الرصيد المصفاة
'],
            ['key' => 'dashboard.restricted.revenue_title', 'en' => 'Revenue title', 'ar' => 'عنوان الإيرادات
'],
            ['key' => 'dashboard.restricted.revenue_desc', 'en' => 'Revenue desc', 'ar' => 'وصف الإيرادات
'],
            ['key' => 'dashboard.performance_metrics', 'en' => 'Performance metrics', 'ar' => 'مقاييس الأداء
'],
            ['key' => 'dashboard.stats.all_ad_units', 'en' => 'All ad units', 'ar' => 'جميع الوحدات الإعلانية
'],
            ['key' => 'dashboard.stats.avg_gross_cpm', 'en' => 'Avg gross cpm', 'ar' => 'متوسط إجمالي التكلفة لكل ألف ظهور
'],
            ['key' => 'dashboard.stats.per_1k_impr', 'en' => 'Per 1k impr', 'ar' => 'لكل ألف ظهور
'],
            ['key' => 'dashboard.stats.avg_ctr', 'en' => 'Avg ctr', 'ar' => 'متوسط نسبة النقرة إلى الظهور
'],
            ['key' => 'dashboard.stats.avg_revenue_ratio', 'en' => 'Avg revenue ratio', 'ar' => 'متوسط نسبة الإيرادات
'],
            ['key' => 'dashboard.stats.publisher_share', 'en' => 'Publisher share', 'ar' => 'مشاركة الناشر
'],
            ['key' => 'dashboard.restricted.performance_title', 'en' => 'Performance title', 'ar' => 'عنوان الأداء
'],
            ['key' => 'dashboard.restricted.performance_desc', 'en' => 'Performance desc', 'ar' => 'وصف الأداء'],
            ['key' => 'dashboard.platform_overview', 'en' => 'Platform overview', 'ar' => 'نظرة عامة على المنصة
'],
            ['key' => 'dashboard.stats.pending_payouts', 'en' => 'Pending payouts', 'ar' => 'دفعات في انتظار
'],
            ['key' => 'dashboard.stats.payout_reqs', 'en' => 'Payout reqs', 'ar' => 'طلبات الدفع
'],
            ['key' => 'dashboard.stats.needs_attention', 'en' => 'Needs attention', 'ar' => 'يحتاج إلى اهتمام
'],
            ['key' => 'dashboard.stats.all_clear', 'en' => 'All clear', 'ar' => 'كل شيء واضح
'],
            ['key' => 'dashboard.stats.active_publishers', 'en' => 'Active publishers', 'ar' => 'الناشرين النشطين
'],
            ['key' => 'dashboard.stats.pending_count', 'en' => 'Pending count', 'ar' => 'العد المعلق
'],
            ['key' => 'dashboard.stats.total_publishers_count', 'en' => 'Total publishers count', 'ar' => 'إجمالي عدد الناشرين
'],
            ['key' => 'dashboard.stats.closed_periods', 'en' => 'Closed periods', 'ar' => 'فترات مغلقة
'],
            ['key' => 'dashboard.stats.historical_periods', 'en' => 'Historical periods', 'ar' => 'فترات تاريخية
'],
            ['key' => 'dashboard.stats.daily_avg_earnings', 'en' => 'Daily avg earnings', 'ar' => 'متوسط الأرباح اليومية
'],
            ['key' => 'dashboard.stats.vs_prev_days', 'en' => 'Vs prev days', 'ar' => 'مقابل الأيام السابقة
'],
            ['key' => 'dashboard.stats.no_prior_data', 'en' => 'No prior data', 'ar' => 'لا توجد بيانات سابقة
'],
            ['key' => 'dashboard.stats.best_day_title', 'en' => 'Best day title', 'ar' => 'عنوان أفضل يوم
'],
            ['key' => 'dashboard.stats.gross_amount', 'en' => 'Gross amount', 'ar' => 'المبلغ الإجمالي
'],
            ['key' => 'dashboard.stats.no_data_range', 'en' => 'No data range', 'ar' => 'لا يوجد نطاق البيانات
'],
            ['key' => 'dashboard.chart.revenue_trend', 'en' => 'Revenue trend', 'ar' => 'اتجاه الإيرادات
'],
            ['key' => 'dashboard.chart.gross_revenue', 'en' => 'Gross revenue', 'ar' => 'إجمالي الإيرادات
'],
            ['key' => 'dashboard.chart.pub_earnings', 'en' => 'Pub earnings', 'ar' => 'أرباح الحانة
'],
            ['key' => 'dashboard.chart.approved', 'en' => 'Approved', 'ar' => 'تمت الموافقة عليه
'],
            ['key' => 'dashboard.chart.pending', 'en' => 'Pending', 'ar' => 'في انتظار
'],
            ['key' => 'dashboard.chart.hide_series', 'en' => 'Hide series', 'ar' => 'إخفاء السلسلة
'],
            ['key' => 'dashboard.chart.show_series', 'en' => 'Show series', 'ar' => 'عرض السلسلة
'],
            ['key' => 'dashboard.chart.no_data_desc', 'en' => 'No data desc', 'ar' => 'لا يوجد وصف للبيانات
'],
            ['key' => 'dashboard.table.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'dashboard.table.best', 'en' => 'Best', 'ar' => 'الأفضل
'],
            ['key' => 'dashboard.table.top_publishers', 'en' => 'Top publishers', 'ar' => 'كبار الناشرين
'],
            ['key' => 'dashboard.table.top_publishers_desc', 'en' => 'Top publishers desc', 'ar' => 'وصف كبار الناشرين
'],
            ['key' => 'dashboard.table.rank', 'en' => 'Rank', 'ar' => 'رتبة
'],
            ['key' => 'dashboard.table.publisher', 'en' => 'Publisher', 'ar' => 'الناشر
'],
            ['key' => 'dashboard.table.pub_earnings', 'en' => 'Pub earnings', 'ar' => 'أرباح الحانة
'],
            ['key' => 'dashboard.table.approved_pct', 'en' => 'Approved pct', 'ar' => 'تمت الموافقة على نسبة مئوية
'],
            ['key' => 'dashboard.table.gross_revenue', 'en' => 'Gross revenue', 'ar' => 'إجمالي الإيرادات
'],
            ['key' => 'dashboard.table.totals', 'en' => 'Totals', 'ar' => 'المجاميع
'],
            ['key' => 'email_tpl.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'email_tpl.toast_saved', 'en' => 'Toast saved', 'ar' => 'تم حفظ الخبز المحمص
'],
            ['key' => 'email_tpl.toast_save_fail', 'en' => 'Toast save fail', 'ar' => 'نخب حفظ فشل
'],
            ['key' => 'email_tpl.toast_preview_sent', 'en' => 'Toast preview sent', 'ar' => 'تم إرسال معاينة الخبز المحمص
'],
            ['key' => 'email_tpl.toast_preview_fail', 'en' => 'Toast preview fail', 'ar' => 'فشل معاينة الخبز المحمص
'],
            ['key' => 'email_tpl.confirm_reset', 'en' => 'Confirm reset', 'ar' => 'تأكيد إعادة التعيين'],
            ['key' => 'email_tpl.toast_reset', 'en' => 'Toast reset', 'ar' => 'إعادة ضبط الخبز المحمص
'],
            ['key' => 'email_tpl.toast_reset_fail', 'en' => 'Toast reset fail', 'ar' => 'فشل إعادة تعيين الخبز المحمص
'],
            ['key' => 'email_tpl.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'email_tpl.list_header', 'en' => 'List header', 'ar' => 'رأس القائمة
'],
            ['key' => 'email_tpl.sending', 'en' => 'Sending', 'ar' => 'إرسال
'],
            ['key' => 'email_tpl.send_test', 'en' => 'Send test', 'ar' => 'إرسال الاختبار
'],
            ['key' => 'email_tpl.resetting', 'en' => 'Resetting', 'ar' => 'إعادة الضبط
'],
            ['key' => 'email_tpl.reset_default', 'en' => 'Reset default', 'ar' => 'إعادة تعيين الافتراضي
'],
            ['key' => 'common.saving', 'en' => 'Saving', 'ar' => 'الادخار
'],
            ['key' => 'email_tpl.save_template', 'en' => 'Save template', 'ar' => 'حفظ القالب
'],
            ['key' => 'email_tpl.subject_line', 'en' => 'Subject line', 'ar' => 'سطر الموضوع
'],
            ['key' => 'email_tpl.email_body', 'en' => 'Email body', 'ar' => 'هيئة البريد الإلكتروني
'],
            ['key' => 'email_tpl.preview', 'en' => 'Preview', 'ar' => 'معاينة
'],
            ['key' => 'email_tpl.available_variables', 'en' => 'Available variables', 'ar' => 'المتغيرات المتاحة
'],
            ['key' => 'email_tpl.click_to_insert', 'en' => 'Click to insert', 'ar' => 'انقر للإدراج
'],
            ['key' => 'email_tpl.select_template', 'en' => 'Select template', 'ar' => 'حدد القالب
'],
            ['key' => 'finance.toast_approved', 'en' => 'Toast approved', 'ar' => 'نخب معتمد
'],
            ['key' => 'finance.toast_approve_fail', 'en' => 'Toast approve fail', 'ar' => 'نخب الموافقة على الفشل
'],
            ['key' => 'finance.approve_payout', 'en' => 'Approve payout', 'ar' => 'الموافقة على الدفع
'],
            ['key' => 'finance.publisher_label', 'en' => 'Publisher label', 'ar' => 'تسمية الناشر
'],
            ['key' => 'finance.period_label', 'en' => 'Period label', 'ar' => 'تسمية الفترة
'],
            ['key' => 'finance.final_amount', 'en' => 'Final amount', 'ar' => 'المبلغ النهائي
'],
            ['key' => 'finance.admin_note', 'en' => 'Admin note', 'ar' => 'ملاحظة المشرف
'],
            ['key' => 'finance.note_placeholder', 'en' => 'Note placeholder', 'ar' => 'ملاحظة العنصر النائب
'],
            ['key' => 'finance.approving', 'en' => 'Approving', 'ar' => 'الموافقة
'],
            ['key' => 'finance.approve_btn', 'en' => 'Approve btn', 'ar' => 'الموافقة على بي تي ان
'],
            ['key' => 'finance.toast_paid', 'en' => 'Toast paid', 'ar' => 'نخب المدفوعة
'],
            ['key' => 'finance.toast_paid_fail', 'en' => 'Toast paid fail', 'ar' => 'نخب دفعت تفشل
'],
            ['key' => 'finance.mark_paid', 'en' => 'Mark paid', 'ar' => 'مارك دفع
'],
            ['key' => 'finance.amount_label', 'en' => 'Amount label', 'ar' => 'تسمية المبلغ
'],
            ['key' => 'finance.payment_reference', 'en' => 'Payment reference', 'ar' => 'مرجع الدفع
'],
            ['key' => 'finance.reference_placeholder', 'en' => 'Reference placeholder', 'ar' => 'العنصر النائب المرجعي
'],
            ['key' => 'finance.saving', 'en' => 'Saving', 'ar' => 'الادخار
'],
            ['key' => 'finance.confirm_payment', 'en' => 'Confirm payment', 'ar' => 'تأكيد الدفع
'],
            ['key' => 'finance.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'finance.reject_prompt', 'en' => 'Reject prompt', 'ar' => 'رفض المطالبة
'],
            ['key' => 'finance.toast_rejected', 'en' => 'Toast rejected', 'ar' => 'نخب مرفوض
'],
            ['key' => 'finance.toast_reject_fail', 'en' => 'Toast reject fail', 'ar' => 'نخب رفض الفشل
'],
            ['key' => 'finance.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'finance.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة'],
            ['key' => 'finance.metrics_label', 'en' => 'Metrics label', 'ar' => 'تسمية المقاييس
'],
            ['key' => 'finance.total_gross', 'en' => 'Total gross', 'ar' => 'الإجمالي الإجمالي
'],
            ['key' => 'finance.platform_wide', 'en' => 'Platform wide', 'ar' => 'منصة واسعة
'],
            ['key' => 'finance.publisher_shares', 'en' => 'Publisher shares', 'ar' => 'أسهم الناشر
'],
            ['key' => 'finance.shared_split', 'en' => 'Shared split', 'ar' => 'الانقسام المشترك
'],
            ['key' => 'finance.approved_balances', 'en' => 'Approved balances', 'ar' => 'الموازنات المعتمدة
'],
            ['key' => 'finance.wallet_totals', 'en' => 'Wallet totals', 'ar' => 'إجمالي المحفظة
'],
            ['key' => 'finance.pending_earnings', 'en' => 'Pending earnings', 'ar' => 'الأرباح المعلقة
'],
            ['key' => 'finance.awaiting_cycle', 'en' => 'Awaiting cycle', 'ar' => 'في انتظار الدورة
'],
            ['key' => 'finance.ready_for_payout', 'en' => 'Ready for payout', 'ar' => 'جاهز للدفع
'],
            ['key' => 'finance.awaiting_request', 'en' => 'Awaiting request', 'ar' => 'في انتظار الطلب
'],
            ['key' => 'finance.actionable_payouts', 'en' => 'Actionable payouts', 'ar' => 'دفعات قابلة للتنفيذ
'],
            ['key' => 'finance.pending_approval_desc', 'en' => 'Pending approval desc', 'ar' => 'في انتظار الموافقة على الوصف
'],
            ['key' => 'finance.col_publisher', 'en' => 'Col publisher', 'ar' => 'الناشر العقيد
'],
            ['key' => 'finance.col_amount', 'en' => 'Col amount', 'ar' => 'المبلغ العقيد
'],
            ['key' => 'finance.col_status', 'en' => 'Col status', 'ar' => 'حالة العقيد
'],
            ['key' => 'finance.col_actions', 'en' => 'Col actions', 'ar' => 'إجراءات العقيد
'],
            ['key' => 'finance.no_payouts_action', 'en' => 'No payouts action', 'ar' => 'لا يوجد إجراء دفعات
'],
            ['key' => 'finance.reject_btn', 'en' => 'Reject btn', 'ar' => 'رفض بي تي ان
'],
            ['key' => 'finance.mark_paid_btn', 'en' => 'Mark paid btn', 'ar' => 'مارك دفع btn
'],
            ['key' => 'finance.top_publishers', 'en' => 'Top publishers', 'ar' => 'كبار الناشرين
'],
            ['key' => 'finance.top_publishers_desc', 'en' => 'Top publishers desc', 'ar' => 'وصف كبار الناشرين
'],
            ['key' => 'finance.col_period_earnings', 'en' => 'Col period earnings', 'ar' => 'أرباح الفترة كول
'],
            ['key' => 'finance.col_approved_wallet', 'en' => 'Col approved wallet', 'ar' => 'محفظة معتمدة من العقيد
'],
            ['key' => 'finance.no_publisher_data', 'en' => 'No publisher data', 'ar' => 'لا توجد بيانات الناشر
'],
            ['key' => 'finance.recent_closings', 'en' => 'Recent closings', 'ar' => 'عمليات الإغلاق الأخيرة
'],
            ['key' => 'finance.closings_desc', 'en' => 'Closings desc', 'ar' => 'وصف الإغلاق
'],
            ['key' => 'finance.col_closing_period', 'en' => 'Col closing period', 'ar' => 'فترة إغلاق العقيد
'],
            ['key' => 'finance.col_finalized_on', 'en' => 'Col finalized on', 'ar' => 'تم وضع اللمسات النهائية على العقيد
'],
            ['key' => 'finance.col_total_payouts', 'en' => 'Col total payouts', 'ar' => 'إجمالي الدفعات
'],
            ['key' => 'finance.no_closings', 'en' => 'No closings', 'ar' => 'لا يوجد إغلاق
'],
            ['key' => 'gam.toast_connected', 'en' => 'Toast connected', 'ar' => 'نخب متصل
'],
            ['key' => 'gam.toast_reconnected', 'en' => 'Toast reconnected', 'ar' => 'إعادة توصيل الخبز المحمص
'],
            ['key' => 'gam.toast_conn_fail', 'en' => 'Toast conn fail', 'ar' => 'نخب كون تفشل
'],
            ['key' => 'common.unknown_error', 'en' => 'Unknown error', 'ar' => 'خطأ غير معروف
'],
            ['key' => 'gam.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'gam.toast_configure_first', 'en' => 'Toast configure first', 'ar' => 'تكوين نخب أولا
'],
            ['key' => 'gam.toast_oauth_fail', 'en' => 'Toast oauth fail', 'ar' => 'نخب أووث تفشل
'],
            ['key' => 'gam.toast_credentials_saved', 'en' => 'Toast credentials saved', 'ar' => 'تم حفظ بيانات اعتماد الخبز المحمص
'],
            ['key' => 'gam.toast_save_credentials_fail', 'en' => 'Toast save credentials fail', 'ar' => 'نخب حفظ بيانات الاعتماد تفشل'],
            ['key' => 'gam.confirm_manual_sync', 'en' => 'Confirm manual sync', 'ar' => 'تأكيد المزامنة اليدوية
'],
            ['key' => 'gam.syncing', 'en' => 'Syncing', 'ar' => 'المزامنة
'],
            ['key' => 'gam.toast_sync_fail', 'en' => 'Toast sync fail', 'ar' => 'فشل مزامنة الخبز المحمص
'],
            ['key' => 'gam.toast_token_refreshed', 'en' => 'Toast token refreshed', 'ar' => 'تم تحديث رمز الخبز المحمص
'],
            ['key' => 'gam.toast_refresh_fail', 'en' => 'Toast refresh fail', 'ar' => 'فشل تحديث الخبز المحمص
'],
            ['key' => 'gam.confirm_disconnect', 'en' => 'Confirm disconnect', 'ar' => 'تأكيد قطع الاتصال
'],
            ['key' => 'gam.toast_disconnected', 'en' => 'Toast disconnected', 'ar' => 'نخب قطع
'],
            ['key' => 'gam.toast_disconnect_fail', 'en' => 'Toast disconnect fail', 'ar' => 'نخب قطع الاتصال بالفشل
'],
            ['key' => 'gam.toast_account_updated', 'en' => 'Toast account updated', 'ar' => 'تم تحديث حساب التوست
'],
            ['key' => 'gam.toast_account_update_fail', 'en' => 'Toast account update fail', 'ar' => 'فشل تحديث حساب التوست
'],
            ['key' => 'gam.confirm_wipe', 'en' => 'Confirm wipe', 'ar' => 'تأكيد المسح
'],
            ['key' => 'gam.wiping', 'en' => 'Wiping', 'ar' => 'المسح
'],
            ['key' => 'gam.toast_wipe_fail', 'en' => 'Toast wipe fail', 'ar' => 'نخب مسح فشل
'],
            ['key' => 'gam.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'gam.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'gam.wipe_all_revenue', 'en' => 'Wipe all revenue', 'ar' => 'مسح جميع الإيرادات
'],
            ['key' => 'gam.syncing_label', 'en' => 'Syncing label', 'ar' => 'تسمية المزامنة
'],
            ['key' => 'gam.run_sync_btn', 'en' => 'Run sync btn', 'ar' => 'قم بتشغيل المزامنة btn
'],
            ['key' => 'gam.connect_google', 'en' => 'Connect google', 'ar' => 'ربط جوجل
'],
            ['key' => 'gam.api_configured', 'en' => 'Api configured', 'ar' => 'تم تكوين واجهة برمجة التطبيقات
'],
            ['key' => 'gam.api_config_title', 'en' => 'Api config title', 'ar' => 'عنوان تكوين واجهة برمجة التطبيقات
'],
            ['key' => 'gam.client_id_label', 'en' => 'Client id label', 'ar' => 'تسمية معرف العميل
'],
            ['key' => 'gam.client_secret_label', 'en' => 'Client secret label', 'ar' => 'تسمية سرية العميل
'],
            ['key' => 'gam.redirect_uri_label', 'en' => 'Redirect uri label', 'ar' => 'إعادة توجيه تسمية uri
'],
            ['key' => 'gam.toast_redirect_copied', 'en' => 'Toast redirect copied', 'ar' => 'تم نسخ إعادة توجيه الخبز المحمص
'],
            ['key' => 'common.copy', 'en' => 'Copy', 'ar' => 'نسخ
'],
            ['key' => 'gam.save_api_keys', 'en' => 'Save api keys', 'ar' => 'حفظ مفاتيح API
'],
            ['key' => 'gam.no_accounts', 'en' => 'No accounts', 'ar' => 'لا حسابات
'],
            ['key' => 'gam.no_accounts_hint', 'en' => 'No accounts hint', 'ar' => 'لا توجد حسابات تلميح
'],
            ['key' => 'gam.connect_now', 'en' => 'Connect now', 'ar' => 'اتصل الآن
'],
            ['key' => 'gam.linked_websites', 'en' => 'Linked websites', 'ar' => 'المواقع المرتبطة
'],
            ['key' => 'gam.edit_account', 'en' => 'Edit account', 'ar' => 'تحرير الحساب
'],
            ['key' => 'gam.account_name', 'en' => 'Account name', 'ar' => 'اسم الحساب
'],
            ['key' => 'gam.network_code_hint', 'en' => 'Network code hint', 'ar' => 'تلميح رمز الشبكة
'],
            ['key' => 'gam.ads_txt_label', 'en' => 'Ads txt label', 'ar' => 'تسمية نص الإعلانات
'],
            ['key' => 'common.save_changes', 'en' => 'Save changes', 'ar' => 'حفظ التغييرات
'],
            ['key' => 'sync.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'sync.toast_success', 'en' => 'Toast success', 'ar' => 'نخب النجاح
'],
            ['key' => 'sync.toast_fail', 'en' => 'Toast fail', 'ar' => 'نخب فشل
'],
            ['key' => 'sync.title', 'en' => 'Title', 'ar' => 'العنوان'],
            ['key' => 'sync.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'sync.last_sync', 'en' => 'Last sync', 'ar' => 'آخر مزامنة
'],
            ['key' => 'sync.type', 'en' => 'Type', 'ar' => 'اكتب
'],
            ['key' => 'sync.duration', 'en' => 'Duration', 'ar' => 'المدة
'],
            ['key' => 'sync.rows_matched', 'en' => 'Rows matched', 'ar' => 'الصفوف متطابقة
'],
            ['key' => 'sync.rows_skipped', 'en' => 'Rows skipped', 'ar' => 'تم تخطي الصفوف
'],
            ['key' => 'sync.locked', 'en' => 'Locked', 'ar' => 'مغلق
'],
            ['key' => 'sync.filters', 'en' => 'Filters', 'ar' => 'المرشحات
'],
            ['key' => 'sync.date_from', 'en' => 'Date from', 'ar' => 'التاريخ من
'],
            ['key' => 'sync.date_to', 'en' => 'Date to', 'ar' => 'تاريخ ل
'],
            ['key' => 'sync.publisher_optional', 'en' => 'Publisher optional', 'ar' => 'الناشر اختياري
'],
            ['key' => 'sync.gam_account_optional', 'en' => 'Gam account optional', 'ar' => 'حساب غام اختياري
'],
            ['key' => 'common.reset_filters', 'en' => 'Reset filters', 'ar' => 'إعادة تعيين المرشحات
'],
            ['key' => 'common.syncing', 'en' => 'Syncing', 'ar' => 'المزامنة
'],
            ['key' => 'sync.run_sync_btn', 'en' => 'Run sync btn', 'ar' => 'قم بتشغيل المزامنة btn
'],
            ['key' => 'sync.output_title', 'en' => 'Output title', 'ar' => 'عنوان الإخراج
'],
            ['key' => 'sync.history', 'en' => 'History', 'ar' => 'التاريخ
'],
            ['key' => 'common.refresh', 'en' => 'Refresh', 'ar' => 'تحديث
'],
            ['key' => 'sync.no_history', 'en' => 'No history', 'ar' => 'لا يوجد تاريخ
'],
            ['key' => 'sync.col_type', 'en' => 'Col type', 'ar' => 'نوع العقيد
'],
            ['key' => 'sync.col_started', 'en' => 'Col started', 'ar' => 'بدأ العقيد
'],
            ['key' => 'sync.col_fetched', 'en' => 'Col fetched', 'ar' => 'تم جلب العقيد
'],
            ['key' => 'sync.col_notes', 'en' => 'Col notes', 'ar' => 'يلاحظ العقيد
'],
            ['key' => 'sync.stat_total', 'en' => 'Stat total', 'ar' => 'إجمالي الإحصائيات
'],
            ['key' => 'sync.stat_manual', 'en' => 'Stat manual', 'ar' => 'دليل الإحصائيات
'],
            ['key' => 'sync.stat_auto', 'en' => 'Stat auto', 'ar' => 'الإحصائيات التلقائية
'],
            ['key' => 'sync.stat_successful', 'en' => 'Stat successful', 'ar' => 'الإحصائيات ناجحة
'],
            ['key' => 'sync.stat_failed', 'en' => 'Stat failed', 'ar' => 'فشل الإحصائيات
'],
            ['key' => 'sync.stat_rows_matched', 'en' => 'Stat rows matched', 'ar' => 'صفوف الإحصائيات متطابقة
'],
            ['key' => 'pages.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'pages.title_required', 'en' => 'Title required', 'ar' => 'العنوان مطلوب
'],
            ['key' => 'pages.slug_required', 'en' => 'Slug required', 'ar' => 'سبيكة مطلوبة
'],
            ['key' => 'pages.content_required', 'en' => 'Content required', 'ar' => 'المحتوى مطلوب
'],
            ['key' => 'pages.toast_updated', 'en' => 'Toast updated', 'ar' => 'تم تحديث الخبز المحمص
'],
            ['key' => 'pages.toast_created', 'en' => 'Toast created', 'ar' => 'تم إنشاء الخبز المحمص
'],
            ['key' => 'pages.toast_save_fail', 'en' => 'Toast save fail', 'ar' => 'نخب حفظ فشل
'],
            ['key' => 'pages.confirm_delete', 'en' => 'Confirm delete', 'ar' => 'تأكيد الحذف
'],
            ['key' => 'pages.toast_deleted', 'en' => 'Toast deleted', 'ar' => 'تم حذف الخبز المحمص
'],
            ['key' => 'pages.toast_delete_fail', 'en' => 'Toast delete fail', 'ar' => 'نخب حذف فشل
'],
            ['key' => 'pages.loading', 'en' => 'Loading', 'ar' => 'جاري التحميل'],
            ['key' => 'pages.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'pages.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'pages.new_page_btn', 'en' => 'New page btn', 'ar' => 'صفحة جديدة بي تي ان
'],
            ['key' => 'pages.no_pages_hint', 'en' => 'No pages hint', 'ar' => 'لا توجد صفحات تلميح
'],
            ['key' => 'pages.col_display_locations', 'en' => 'Col display locations', 'ar' => 'مواقع العرض العقيد
'],
            ['key' => 'pages.public_footer', 'en' => 'Public footer', 'ar' => 'تذييل عام
'],
            ['key' => 'pages.publisher_footer', 'en' => 'Publisher footer', 'ar' => 'تذييل الناشر
'],
            ['key' => 'pages.landing_menu', 'en' => 'Landing menu', 'ar' => 'القائمة الهبوطية
'],
            ['key' => 'pages.hidden', 'en' => 'Hidden', 'ar' => 'مخفي
'],
            ['key' => 'common.inactive', 'en' => 'Inactive', 'ar' => 'غير نشط
'],
            ['key' => 'pages.edit_page', 'en' => 'Edit page', 'ar' => 'تحرير الصفحة
'],
            ['key' => 'pages.new_page', 'en' => 'New page', 'ar' => 'صفحة جديدة
'],
            ['key' => 'pages.page_title_label', 'en' => 'Page title label', 'ar' => 'تسمية عنوان الصفحة
'],
            ['key' => 'pages.title_placeholder', 'en' => 'Title placeholder', 'ar' => 'العنصر النائب للعنوان
'],
            ['key' => 'pages.slug_label', 'en' => 'Slug label', 'ar' => 'تسمية سبيكة
'],
            ['key' => 'pages.url_path', 'en' => 'Url path', 'ar' => 'مسار URL
'],
            ['key' => 'pages.slug_placeholder', 'en' => 'Slug placeholder', 'ar' => 'العنصر النائب سبيكة
'],
            ['key' => 'pages.content_label', 'en' => 'Content label', 'ar' => 'تسمية المحتوى
'],
            ['key' => 'pages.placement_visibility', 'en' => 'Placement visibility', 'ar' => 'رؤية الموضع
'],
            ['key' => 'pages.show_in_public_footer', 'en' => 'Show in public footer', 'ar' => 'عرض في التذييل العام
'],
            ['key' => 'pages.show_in_publisher_footer', 'en' => 'Show in publisher footer', 'ar' => 'إظهار في تذييل الناشر
'],
            ['key' => 'pages.show_in_landing_menu', 'en' => 'Show in landing menu', 'ar' => 'عرض في القائمة المقصودة
'],
            ['key' => 'pages.is_active', 'en' => 'Is active', 'ar' => 'نشط
'],
            ['key' => 'pages.update_page', 'en' => 'Update page', 'ar' => 'تحديث الصفحة
'],
            ['key' => 'pages.create_page', 'en' => 'Create page', 'ar' => 'إنشاء صفحة
'],
            ['key' => 'payouts.toast_approved', 'en' => 'Toast approved', 'ar' => 'نخب معتمد
'],
            ['key' => 'payouts.toast_approve_fail', 'en' => 'Toast approve fail', 'ar' => 'نخب الموافقة على الفشل
'],
            ['key' => 'payouts.approve_title', 'en' => 'Approve title', 'ar' => 'الموافقة على العنوان
'],
            ['key' => 'payouts.base_amount', 'en' => 'Base amount', 'ar' => 'المبلغ الأساسي
'],
            ['key' => 'payouts.rolled_adj', 'en' => 'Rolled adj', 'ar' => 'توالت
'],
            ['key' => 'payouts.final_amount', 'en' => 'Final amount', 'ar' => 'المبلغ النهائي
'],
            ['key' => 'payouts.admin_note', 'en' => 'Admin note', 'ar' => 'ملاحظة المشرف
'],
            ['key' => 'payouts.admin_note_placeholder', 'en' => 'Admin note placeholder', 'ar' => 'العنصر النائب لملاحظة المشرف
'],
            ['key' => 'payouts.approving', 'en' => 'Approving', 'ar' => 'الموافقة
'],
            ['key' => 'payouts.approve_btn', 'en' => 'Approve btn', 'ar' => 'الموافقة على بي تي ان
'],
            ['key' => 'payouts.toast_marked_paid', 'en' => 'Toast marked paid', 'ar' => 'نخب ملحوظ المدفوعة
'],
            ['key' => 'payouts.toast_mark_paid_fail', 'en' => 'Toast mark paid fail', 'ar' => 'علامة النخب المدفوعة تفشل
'],
            ['key' => 'payouts.mark_paid_title', 'en' => 'Mark paid title', 'ar' => 'وضع علامة على العنوان المدفوع
'],
            ['key' => 'payouts.payment_ref', 'en' => 'Payment ref', 'ar' => 'مرجع الدفع
'],
            ['key' => 'payouts.payment_ref_placeholder', 'en' => 'Payment ref placeholder', 'ar' => 'العنصر النائب لمرجع الدفع'],
            ['key' => 'payouts.saving', 'en' => 'Saving', 'ar' => 'الادخار
'],
            ['key' => 'payouts.confirm_payment', 'en' => 'Confirm payment', 'ar' => 'تأكيد الدفع
'],
            ['key' => 'payouts.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'payouts.rejection_prompt', 'en' => 'Rejection prompt', 'ar' => 'موجه الرفض
'],
            ['key' => 'payouts.toast_rejected', 'en' => 'Toast rejected', 'ar' => 'نخب مرفوض
'],
            ['key' => 'payouts.toast_reject_fail', 'en' => 'Toast reject fail', 'ar' => 'نخب رفض الفشل
'],
            ['key' => 'common.all_statuses', 'en' => 'All statuses', 'ar' => 'جميع الحالات
'],
            ['key' => 'common.status_pending', 'en' => 'Status pending', 'ar' => 'الحالة معلقة
'],
            ['key' => 'common.status_approved', 'en' => 'Status approved', 'ar' => 'تمت الموافقة على الحالة
'],
            ['key' => 'payouts.status_rejected', 'en' => 'Status rejected', 'ar' => 'الحالة مرفوضة
'],
            ['key' => 'payouts.all_years', 'en' => 'All years', 'ar' => 'كل السنوات
'],
            ['key' => 'payouts.all_months', 'en' => 'All months', 'ar' => 'كل الشهور
'],
            ['key' => 'payouts.stat_total_paid', 'en' => 'Stat total paid', 'ar' => 'إجمالي الإحصائيات المدفوعة
'],
            ['key' => 'payouts.paid_to', 'en' => 'Paid to', 'ar' => 'دفعت ل
'],
            ['key' => 'payouts.across_all', 'en' => 'Across all', 'ar' => 'عبر الكل
'],
            ['key' => 'payouts.stat_available_balance', 'en' => 'Stat available balance', 'ar' => 'احصائيات الرصيد المتاح
'],
            ['key' => 'payouts.stat_pending_payouts', 'en' => 'Stat pending payouts', 'ar' => 'الإحصائيات في انتظار الدفعات
'],
            ['key' => 'payouts.col_period', 'en' => 'Col period', 'ar' => 'فترة العقيد
'],
            ['key' => 'common.created', 'en' => 'Created', 'ar' => 'تم إنشاؤها
'],
            ['key' => 'payouts.col_base_amount', 'en' => 'Col base amount', 'ar' => 'المبلغ الأساسي العقيد
'],
            ['key' => 'payouts.col_adjustment', 'en' => 'Col adjustment', 'ar' => 'تعديل العقيد
'],
            ['key' => 'payouts.col_final_amount', 'en' => 'Col final amount', 'ar' => 'المبلغ النهائي كول
'],
            ['key' => 'payouts.col_payment_method', 'en' => 'Col payment method', 'ar' => 'طريقة الدفع كول
'],
            ['key' => 'payouts.no_payouts', 'en' => 'No payouts', 'ar' => 'لا دفعات
'],
            ['key' => 'payouts.adjust_filters', 'en' => 'Adjust filters', 'ar' => 'ضبط المرشحات
'],
            ['key' => 'common.copied', 'en' => 'Copied', 'ar' => 'منقول
'],
            ['key' => 'payouts.copy_title', 'en' => 'Copy title', 'ar' => 'انسخ العنوان
'],
            ['key' => 'payouts.ref', 'en' => 'Ref', 'ar' => 'المرجع
'],
            ['key' => 'payouts.approve_btn_sm', 'en' => 'Approve btn sm', 'ar' => 'الموافقة على btn sm
'],
            ['key' => 'payouts.reject_btn', 'en' => 'Reject btn', 'ar' => 'رفض بي تي ان
'],
            ['key' => 'payouts.mark_paid_btn', 'en' => 'Mark paid btn', 'ar' => 'مارك دفع btn
'],
            ['key' => 'period.totals', 'en' => 'Totals', 'ar' => 'المجاميع
'],
            ['key' => 'period.confirm_close', 'en' => 'Confirm close', 'ar' => 'تأكيد الإغلاق
'],
            ['key' => 'period.toast_closed', 'en' => 'Toast closed', 'ar' => 'نخب مغلق
'],
            ['key' => 'period.toast_close_fail', 'en' => 'Toast close fail', 'ar' => 'نخب إغلاق فشل
'],
            ['key' => 'period.close_modal_title', 'en' => 'Close modal title', 'ar' => 'إغلاق العنوان المشروط
'],
            ['key' => 'period.close_warning_1', 'en' => 'Close warning 1', 'ar' => 'تحذير إغلاق 1
'],
            ['key' => 'period.locks', 'en' => 'Locks', 'ar' => 'أقفال
'],
            ['key' => 'period.close_warning_2', 'en' => 'Close warning 2', 'ar' => 'تحذير إغلاق 2
'],
            ['key' => 'period.year', 'en' => 'Year', 'ar' => 'سنة'],
            ['key' => 'period.month', 'en' => 'Month', 'ar' => 'شهر
'],
            ['key' => 'period.closing', 'en' => 'Closing', 'ar' => 'إغلاق
'],
            ['key' => 'period.close_btn', 'en' => 'Close btn', 'ar' => 'إغلاق بي تي إن
'],
            ['key' => 'period.breakdown', 'en' => 'Breakdown', 'ar' => 'انهيار
'],
            ['key' => 'period.no_payouts', 'en' => 'No payouts', 'ar' => 'لا دفعات
'],
            ['key' => 'period.col_publisher', 'en' => 'Col publisher', 'ar' => 'الناشر العقيد
'],
            ['key' => 'period.col_earnings', 'en' => 'Col earnings', 'ar' => 'أرباح العقيد
'],
            ['key' => 'period.col_status', 'en' => 'Col status', 'ar' => 'حالة العقيد
'],
            ['key' => 'period.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'period.toast_detail_fail', 'en' => 'Toast detail fail', 'ar' => 'تفاصيل الخبز المحمص تفشل
'],
            ['key' => 'period.confirm_delete', 'en' => 'Confirm delete', 'ar' => 'تأكيد الحذف
'],
            ['key' => 'period.toast_deleted', 'en' => 'Toast deleted', 'ar' => 'تم حذف الخبز المحمص
'],
            ['key' => 'period.toast_delete_fail', 'en' => 'Toast delete fail', 'ar' => 'نخب حذف فشل
'],
            ['key' => 'period.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'period.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'period.close_btn_header', 'en' => 'Close btn header', 'ar' => 'إغلاق رأس btn
'],
            ['key' => 'period.col_period', 'en' => 'Col period', 'ar' => 'فترة العقيد
'],
            ['key' => 'period.col_total_gross', 'en' => 'Col total gross', 'ar' => 'العقيد الإجمالي الإجمالي
'],
            ['key' => 'period.col_pub_earnings', 'en' => 'Col pub earnings', 'ar' => 'أرباح حانة العقيد
'],
            ['key' => 'period.col_total_payouts', 'en' => 'Col total payouts', 'ar' => 'إجمالي الدفعات
'],
            ['key' => 'period.col_impressions', 'en' => 'Col impressions', 'ar' => 'انطباعات العقيد
'],
            ['key' => 'period.col_closed_at', 'en' => 'Col closed at', 'ar' => 'أغلق العقيد عند
'],
            ['key' => 'period.no_periods', 'en' => 'No periods', 'ar' => 'لا فترات
'],
            ['key' => 'period.no_periods_hint', 'en' => 'No periods hint', 'ar' => 'لا توجد فترات تلميح
'],
            ['key' => 'period.status_closed', 'en' => 'Status closed', 'ar' => 'الحالة مغلقة
'],
            ['key' => 'common.view', 'en' => 'View', 'ar' => 'عرض
'],
            ['key' => 'admin_profile.toast_updated', 'en' => 'Toast updated', 'ar' => 'تم تحديث الخبز المحمص
'],
            ['key' => 'admin_profile.toast_update_fail', 'en' => 'Toast update fail', 'ar' => 'فشل التحديث نخب
'],
            ['key' => 'admin_profile.toast_password_mismatch', 'en' => 'Toast password mismatch', 'ar' => 'نخب عدم تطابق كلمة المرور
'],
            ['key' => 'admin_profile.toast_password_changed', 'en' => 'Toast password changed', 'ar' => 'تم تغيير كلمة مرور التوست
'],
            ['key' => 'admin_profile.toast_password_fail', 'en' => 'Toast password fail', 'ar' => 'نخب كلمة المرور تفشل
'],
            ['key' => 'admin_profile.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'admin_profile.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'admin_profile.tab_profile', 'en' => 'Tab profile', 'ar' => 'ملف تعريف علامة التبويب
'],
            ['key' => 'admin_profile.tab_security', 'en' => 'Tab security', 'ar' => 'أمان علامة التبويب
'],
            ['key' => 'admin_profile.personal_settings', 'en' => 'Personal settings', 'ar' => 'الإعدادات الشخصية
'],
            ['key' => 'admin_profile.full_name', 'en' => 'Full name', 'ar' => 'الاسم الكامل
'],
            ['key' => 'admin_profile.name_placeholder', 'en' => 'Name placeholder', 'ar' => 'اسم العنصر النائب
'],
            ['key' => 'admin_profile.email_address', 'en' => 'Email address', 'ar' => 'عنوان البريد الإلكتروني
'],
            ['key' => 'admin_profile.email_placeholder', 'en' => 'Email placeholder', 'ar' => 'العنصر النائب للبريد الإلكتروني'],
            ['key' => 'admin_profile.saving', 'en' => 'Saving', 'ar' => 'الادخار
'],
            ['key' => 'admin_profile.save_profile', 'en' => 'Save profile', 'ar' => 'حفظ الملف الشخصي
'],
            ['key' => 'admin_profile.security_settings', 'en' => 'Security settings', 'ar' => 'إعدادات الأمان
'],
            ['key' => 'admin_profile.current_password', 'en' => 'Current password', 'ar' => 'كلمة المرور الحالية
'],
            ['key' => 'admin_profile.new_password', 'en' => 'New password', 'ar' => 'كلمة المرور الجديدة
'],
            ['key' => 'admin_profile.new_password_placeholder', 'en' => 'New password placeholder', 'ar' => 'العنصر النائب لكلمة المرور الجديدة
'],
            ['key' => 'admin_profile.confirm_password', 'en' => 'Confirm password', 'ar' => 'تأكيد كلمة المرور
'],
            ['key' => 'admin_profile.changing', 'en' => 'Changing', 'ar' => 'تغيير
'],
            ['key' => 'admin_profile.change_password', 'en' => 'Change password', 'ar' => 'تغيير كلمة المرور
'],
            ['key' => 'publishers.toast_updated', 'en' => 'Toast updated', 'ar' => 'تم تحديث الخبز المحمص
'],
            ['key' => 'publishers.toast_created', 'en' => 'Toast created', 'ar' => 'تم إنشاء الخبز المحمص
'],
            ['key' => 'common.something_wrong', 'en' => 'Something wrong', 'ar' => 'شيء خاطئ
'],
            ['key' => 'publishers.edit_title', 'en' => 'Edit title', 'ar' => 'تحرير العنوان
'],
            ['key' => 'publishers.new_title', 'en' => 'New title', 'ar' => 'عنوان جديد
'],
            ['key' => 'publishers.name_label', 'en' => 'Name label', 'ar' => 'تسمية الاسم
'],
            ['key' => 'publishers.email_label', 'en' => 'Email label', 'ar' => 'تسمية البريد الإلكتروني
'],
            ['key' => 'publishers.new_password_opt', 'en' => 'New password opt', 'ar' => 'اختيار كلمة المرور الجديدة
'],
            ['key' => 'publishers.password_label', 'en' => 'Password label', 'ar' => 'تسمية كلمة المرور
'],
            ['key' => 'publishers.ratio_label', 'en' => 'Ratio label', 'ar' => 'تسمية النسبة
'],
            ['key' => 'publishers.ratio_hint', 'en' => 'Ratio hint', 'ar' => 'إشارة النسبة
'],
            ['key' => 'publishers.phone_label', 'en' => 'Phone label', 'ar' => 'تسمية الهاتف
'],
            ['key' => 'publishers.telegram_label', 'en' => 'Telegram label', 'ar' => 'تسمية برقية
'],
            ['key' => 'publishers.country_label', 'en' => 'Country label', 'ar' => 'تسمية البلد
'],
            ['key' => 'publishers.country_placeholder', 'en' => 'Country placeholder', 'ar' => 'العنصر النائب للبلد
'],
            ['key' => 'publishers.payment_method_label', 'en' => 'Payment method label', 'ar' => 'تسمية طريقة الدفع
'],
            ['key' => 'publishers.select_payment', 'en' => 'Select payment', 'ar' => 'اختر الدفع
'],
            ['key' => 'publishers.payment_account_label', 'en' => 'Payment account label', 'ar' => 'تسمية حساب الدفع
'],
            ['key' => 'publishers.payment_account_placeholder', 'en' => 'Payment account placeholder', 'ar' => 'العنصر النائب لحساب الدفع
'],
            ['key' => 'publishers.status_label', 'en' => 'Status label', 'ar' => 'تسمية الحالة
'],
            ['key' => 'publishers.status_active', 'en' => 'Status active', 'ar' => 'الحالة نشطة
'],
            ['key' => 'publishers.status_pending', 'en' => 'Status pending', 'ar' => 'الحالة معلقة
'],
            ['key' => 'publishers.status_suspended', 'en' => 'Status suspended', 'ar' => 'الحالة معلقة
'],
            ['key' => 'publishers.notes_label', 'en' => 'Notes label', 'ar' => 'تسمية الملاحظات
'],
            ['key' => 'publishers.save_btn', 'en' => 'Save btn', 'ar' => 'حفظ btn
'],
            ['key' => 'publishers.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'publishers.confirm_delete', 'en' => 'Confirm delete', 'ar' => 'تأكيد الحذف
'],
            ['key' => 'publishers.toast_deleted', 'en' => 'Toast deleted', 'ar' => 'تم حذف الخبز المحمص
'],
            ['key' => 'publishers.toast_delete_fail', 'en' => 'Toast delete fail', 'ar' => 'نخب حذف فشل
'],
            ['key' => 'publishers.toast_suspended', 'en' => 'Toast suspended', 'ar' => 'نخب معلق
'],
            ['key' => 'publishers.toast_suspend_fail', 'en' => 'Toast suspend fail', 'ar' => 'نخب تعليق فشل'],
            ['key' => 'publishers.toast_activated', 'en' => 'Toast activated', 'ar' => 'تم تفعيل التوست
'],
            ['key' => 'publishers.toast_activate_fail', 'en' => 'Toast activate fail', 'ar' => 'فشل تنشيط الخبز المحمص
'],
            ['key' => 'publishers.confirm_impersonate', 'en' => 'Confirm impersonate', 'ar' => 'تأكيد انتحال الشخصية
'],
            ['key' => 'publishers.toast_impersonated', 'en' => 'Toast impersonated', 'ar' => 'نخب منتحل
'],
            ['key' => 'publishers.toast_impersonate_fail', 'en' => 'Toast impersonate fail', 'ar' => 'نخب انتحال فشل
'],
            ['key' => 'publishers.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'publishers.total', 'en' => 'Total', 'ar' => 'المجموع
'],
            ['key' => 'publishers.pending', 'en' => 'Pending', 'ar' => 'في انتظار
'],
            ['key' => 'publishers.add_btn', 'en' => 'Add btn', 'ar' => 'أضف بي تي ان
'],
            ['key' => 'publishers.pending_approval', 'en' => 'Pending approval', 'ar' => 'في انتظار الموافقة
'],
            ['key' => 'publishers.click_approve', 'en' => 'Click approve', 'ar' => 'انقر فوق الموافقة
'],
            ['key' => 'publishers.search_placeholder', 'en' => 'Search placeholder', 'ar' => 'بحث في العنصر النائب
'],
            ['key' => 'publishers.all_statuses', 'en' => 'All statuses', 'ar' => 'جميع الحالات
'],
            ['key' => 'publishers.col_publisher', 'en' => 'Col publisher', 'ar' => 'الناشر العقيد
'],
            ['key' => 'publishers.col_status', 'en' => 'Col status', 'ar' => 'حالة العقيد
'],
            ['key' => 'publishers.col_ratio', 'en' => 'Col ratio', 'ar' => 'نسبة العقيد
'],
            ['key' => 'publishers.col_approved_balance', 'en' => 'Col approved balance', 'ar' => 'الرصيد المعتمد من العقيد
'],
            ['key' => 'publishers.col_pending_balance', 'en' => 'Col pending balance', 'ar' => 'الرصيد المعلق
'],
            ['key' => 'publishers.col_created', 'en' => 'Col created', 'ar' => 'تم إنشاء العقيد
'],
            ['key' => 'publishers.col_actions', 'en' => 'Col actions', 'ar' => 'إجراءات العقيد
'],
            ['key' => 'publishers.no_publishers', 'en' => 'No publishers', 'ar' => 'لا الناشرين
'],
            ['key' => 'publishers.no_publishers_hint', 'en' => 'No publishers hint', 'ar' => 'لا يوجد ناشرين يلمحون
'],
            ['key' => 'publishers.approve_btn', 'en' => 'Approve btn', 'ar' => 'الموافقة على بي تي ان
'],
            ['key' => 'publishers.adjust_amount_error', 'en' => 'Adjust amount error', 'ar' => 'ضبط خطأ المبلغ
'],
            ['key' => 'publishers.toast_adjusted', 'en' => 'Toast adjusted', 'ar' => 'تم تعديل الخبز المحمص
'],
            ['key' => 'publishers.toast_adjust_fail', 'en' => 'Toast adjust fail', 'ar' => 'فشل ضبط الخبز المحمص
'],
            ['key' => 'publishers.adjust_balance_title', 'en' => 'Adjust balance title', 'ar' => 'ضبط عنوان الرصيد
'],
            ['key' => 'publishers.adjust_info', 'en' => 'Adjust info', 'ar' => 'ضبط المعلومات
'],
            ['key' => 'publishers.adjustment_amount', 'en' => 'Adjustment amount', 'ar' => 'مبلغ التعديل
'],
            ['key' => 'publishers.adjustment_hint', 'en' => 'Adjustment hint', 'ar' => 'تلميح التكيف
'],
            ['key' => 'publishers.reason_label', 'en' => 'Reason label', 'ar' => 'تسمية السبب
'],
            ['key' => 'publishers.reason_placeholder', 'en' => 'Reason placeholder', 'ar' => 'السبب النائب
'],
            ['key' => 'publishers.processing', 'en' => 'Processing', 'ar' => 'المعالجة
'],
            ['key' => 'publishers.apply_adjustment', 'en' => 'Apply adjustment', 'ar' => 'تطبيق التعديل
'],
            ['key' => 'common.no_publishers', 'en' => 'No publishers', 'ar' => 'لا الناشرين
'],
            ['key' => 'revenue.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'revenue.records_label', 'en' => 'Records label', 'ar' => 'تسمية السجلات
'],
            ['key' => 'revenue.full_admin_view', 'en' => 'Full admin view', 'ar' => 'عرض المشرف الكامل
'],
            ['key' => 'revenue.filter_date_from', 'en' => 'Filter date from', 'ar' => 'تاريخ التصفية من
'],
            ['key' => 'revenue.filter_date_to', 'en' => 'Filter date to', 'ar' => 'تاريخ التصفية إلى'],
            ['key' => 'revenue.search_placeholder', 'en' => 'Search placeholder', 'ar' => 'بحث في العنصر النائب
'],
            ['key' => 'revenue.showing', 'en' => 'Showing', 'ar' => 'عرض
'],
            ['key' => 'common.clear_filters', 'en' => 'Clear filters', 'ar' => 'مسح المرشحات
'],
            ['key' => 'revenue.stat_total_gross', 'en' => 'Stat total gross', 'ar' => 'الإحصائيات الإجمالية الإجمالية
'],
            ['key' => 'revenue.stat_pub_earnings', 'en' => 'Stat pub earnings', 'ar' => 'إحصائيات أرباح الحانة
'],
            ['key' => 'revenue.stat_impressions', 'en' => 'Stat impressions', 'ar' => 'الانطباعات الإحصائية
'],
            ['key' => 'revenue.col_date', 'en' => 'Col date', 'ar' => 'تاريخ العقيد
'],
            ['key' => 'revenue.col_ad_unit', 'en' => 'Col ad unit', 'ar' => 'وحدة إعلانية كول
'],
            ['key' => 'revenue.col_impressions', 'en' => 'Col impressions', 'ar' => 'انطباعات العقيد
'],
            ['key' => 'revenue.col_gross_cpm', 'en' => 'Col gross cpm', 'ar' => 'إجمالي التكلفة لكل ألف ظهور
'],
            ['key' => 'revenue.col_gross_revenue', 'en' => 'Col gross revenue', 'ar' => 'كول إجمالي الإيرادات
'],
            ['key' => 'revenue.col_ratio', 'en' => 'Col ratio', 'ar' => 'نسبة العقيد
'],
            ['key' => 'revenue.col_pub_earnings', 'en' => 'Col pub earnings', 'ar' => 'أرباح حانة العقيد
'],
            ['key' => 'revenue.no_records', 'en' => 'No records', 'ar' => 'لا توجد سجلات
'],
            ['key' => 'revenue.status_closed', 'en' => 'Status closed', 'ar' => 'الحالة مغلقة
'],
            ['key' => 'revenue.status_pending', 'en' => 'Status pending', 'ar' => 'الحالة معلقة
'],
            ['key' => 'revenue.status_approved', 'en' => 'Status approved', 'ar' => 'تمت الموافقة على الحالة
'],
            ['key' => 'admin.settings.timezone.select_placeholder', 'en' => 'Select placeholder', 'ar' => 'حدد العنصر النائب
'],
            ['key' => 'admin.settings.timezone.search_placeholder', 'en' => 'Search placeholder', 'ar' => 'بحث في العنصر النائب
'],
            ['key' => 'admin.settings.timezone.none_found', 'en' => 'None found', 'ar' => 'لم يتم العثور على أي شيء
'],
            ['key' => 'admin.settings.copy.copied_success', 'en' => 'Copied success', 'ar' => 'نجاح منسوخ
'],
            ['key' => 'admin.settings.copy.copied_failed', 'en' => 'Copied failed', 'ar' => 'فشل النسخ
'],
            ['key' => 'admin.settings.copy.copied', 'en' => 'Copied', 'ar' => 'منقول
'],
            ['key' => 'admin.settings.copy.copy', 'en' => 'Copy', 'ar' => 'نسخ
'],
            ['key' => 'admin.settings.toast.uploading', 'en' => 'Uploading', 'ar' => 'جارٍ التحميل
'],
            ['key' => 'admin.settings.toast.uploaded', 'en' => 'Uploaded', 'ar' => 'تم الرفع
'],
            ['key' => 'admin.settings.toast.upload_failed', 'en' => 'Upload failed', 'ar' => 'فشل التحميل
'],
            ['key' => 'admin.settings.toast.test_email_sent', 'en' => 'Test email sent', 'ar' => 'تم إرسال البريد الإلكتروني التجريبي
'],
            ['key' => 'admin.settings.toast.test_email_failed', 'en' => 'Test email failed', 'ar' => 'فشل اختبار البريد الإلكتروني
'],
            ['key' => 'admin.settings.toast.load_failed', 'en' => 'Load failed', 'ar' => 'فشل التحميل
'],
            ['key' => 'admin.settings.toast.no_changes', 'en' => 'No changes', 'ar' => 'لا تغييرات
'],
            ['key' => 'admin.settings.toast.saving_group', 'en' => 'Saving group', 'ar' => 'حفظ المجموعة
'],
            ['key' => 'admin.settings.toast.saved', 'en' => 'Saved', 'ar' => 'تم الحفظ
'],
            ['key' => 'admin.settings.toast.save_failed', 'en' => 'Save failed', 'ar' => 'فشل الحفظ
'],
            ['key' => 'support_dash.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'support_dash.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'support_dash.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'support_dash.queue_label', 'en' => 'Queue label', 'ar' => 'تسمية قائمة الانتظار
'],
            ['key' => 'support_dash.open_tickets', 'en' => 'Open tickets', 'ar' => 'تذاكر مفتوحة
'],
            ['key' => 'support_dash.awaiting_reply', 'en' => 'Awaiting reply', 'ar' => 'في انتظار الرد'],
            ['key' => 'support_dash.in_progress', 'en' => 'In progress', 'ar' => 'قيد التقدم
'],
            ['key' => 'support_dash.being_handled', 'en' => 'Being handled', 'ar' => 'يجري التعامل معها
'],
            ['key' => 'support_dash.active_publishers', 'en' => 'Active publishers', 'ar' => 'الناشرين النشطين
'],
            ['key' => 'support_dash.verified_accounts', 'en' => 'Verified accounts', 'ar' => 'حسابات تم التحقق منها
'],
            ['key' => 'support_dash.pending_verifications', 'en' => 'Pending verifications', 'ar' => 'في انتظار عمليات التحقق
'],
            ['key' => 'support_dash.awaiting_activation', 'en' => 'Awaiting activation', 'ar' => 'في انتظار التفعيل
'],
            ['key' => 'support_dash.support_queue', 'en' => 'Support queue', 'ar' => 'قائمة انتظار الدعم
'],
            ['key' => 'support_dash.active_tickets_desc', 'en' => 'Active tickets desc', 'ar' => 'وصف التذاكر النشطة
'],
            ['key' => 'support_dash.col_publisher', 'en' => 'Col publisher', 'ar' => 'الناشر العقيد
'],
            ['key' => 'support_dash.col_subject', 'en' => 'Col subject', 'ar' => 'موضوع العقيد
'],
            ['key' => 'support_dash.col_priority', 'en' => 'Col priority', 'ar' => 'أولوية العقيد
'],
            ['key' => 'support_dash.col_status', 'en' => 'Col status', 'ar' => 'حالة العقيد
'],
            ['key' => 'support_dash.col_action', 'en' => 'Col action', 'ar' => 'عمل العقيد
'],
            ['key' => 'support_dash.all_clear', 'en' => 'All clear', 'ar' => 'كل شيء واضح
'],
            ['key' => 'support_dash.manage_btn', 'en' => 'Manage btn', 'ar' => 'إدارة بي تي ان
'],
            ['key' => 'support_dash.publisher_lookup', 'en' => 'Publisher lookup', 'ar' => 'بحث الناشر
'],
            ['key' => 'support_dash.search_placeholder', 'en' => 'Search placeholder', 'ar' => 'بحث في العنصر النائب
'],
            ['key' => 'support_dash.recent_announcements', 'en' => 'Recent announcements', 'ar' => 'الإعلانات الأخيرة
'],
            ['key' => 'support_dash.announcements_desc', 'en' => 'Announcements desc', 'ar' => 'الإعلانات وصف
'],
            ['key' => 'support_dash.no_announcements', 'en' => 'No announcements', 'ar' => 'لا إعلانات
'],
            ['key' => 'admin_ticket_detail.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'admin_ticket_detail.toast_reply_sent', 'en' => 'Toast reply sent', 'ar' => 'تم إرسال الرد نخب
'],
            ['key' => 'admin_ticket_detail.toast_reply_fail', 'en' => 'Toast reply fail', 'ar' => 'فشل الرد نخب
'],
            ['key' => 'admin_ticket_detail.toast_updated', 'en' => 'Toast updated', 'ar' => 'تم تحديث الخبز المحمص
'],
            ['key' => 'admin_ticket_detail.toast_update_fail', 'en' => 'Toast update fail', 'ar' => 'فشل التحديث نخب
'],
            ['key' => 'tickets.cat_billing', 'en' => 'Cat billing', 'ar' => 'فواتير القطط
'],
            ['key' => 'tickets.cat_technical', 'en' => 'Cat technical', 'ar' => 'تقنية القط
'],
            ['key' => 'tickets.cat_gam', 'en' => 'Cat gam', 'ar' => 'لعبة القط
'],
            ['key' => 'tickets.cat_other', 'en' => 'Cat other', 'ar' => 'قطة أخرى
'],
            ['key' => 'admin_ticket_detail.back', 'en' => 'Back', 'ar' => 'العودة
'],
            ['key' => 'admin_ticket_detail.publisher_label', 'en' => 'Publisher label', 'ar' => 'تسمية الناشر
'],
            ['key' => 'admin_ticket_detail.guest', 'en' => 'Guest', 'ar' => 'ضيف
'],
            ['key' => 'admin_ticket_detail.creator', 'en' => 'Creator', 'ar' => 'الخالق
'],
            ['key' => 'admin_ticket_detail.updated', 'en' => 'Updated', 'ar' => 'تم التحديث
'],
            ['key' => 'admin_ticket_detail.support_expert', 'en' => 'Support expert', 'ar' => 'خبير الدعم
'],
            ['key' => 'admin_ticket_detail.publisher_msg', 'en' => 'Publisher msg', 'ar' => 'رسالة الناشر
'],
            ['key' => 'admin_ticket_detail.closed_notice', 'en' => 'Closed notice', 'ar' => 'إشعار مغلق
'],
            ['key' => 'admin_ticket_detail.reply_placeholder', 'en' => 'Reply placeholder', 'ar' => 'الرد على العنصر النائب
'],
            ['key' => 'admin_ticket_detail.posting', 'en' => 'Posting', 'ar' => 'النشر
'],
            ['key' => 'admin_ticket_detail.reply_btn', 'en' => 'Reply btn', 'ar' => 'رد بتن'],
            ['key' => 'admin_ticket_detail.management_title', 'en' => 'Management title', 'ar' => 'عنوان الإدارة
'],
            ['key' => 'admin_ticket_detail.ticket_status', 'en' => 'Ticket status', 'ar' => 'حالة التذكرة
'],
            ['key' => 'admin_ticket_detail.ticket_priority', 'en' => 'Ticket priority', 'ar' => 'أولوية التذكرة
'],
            ['key' => 'admin_ticket_detail.category', 'en' => 'Category', 'ar' => 'الفئة
'],
            ['key' => 'tickets.cat_billing_inquiry', 'en' => 'Cat billing inquiry', 'ar' => 'الاستعلام عن فواتير القطط
'],
            ['key' => 'tickets.cat_technical_issue', 'en' => 'Cat technical issue', 'ar' => 'مشكلة فنية في القط
'],
            ['key' => 'tickets.cat_gam_sync', 'en' => 'Cat gam sync', 'ar' => 'مزامنة لعبة القط
'],
            ['key' => 'tickets.cat_other_question', 'en' => 'Cat other question', 'ar' => 'القط سؤال آخر
'],
            ['key' => 'admin_ticket_detail.assignee', 'en' => 'Assignee', 'ar' => 'المكلف
'],
            ['key' => 'admin_tickets.unassigned', 'en' => 'Unassigned', 'ar' => 'غير معين
'],
            ['key' => 'admin_tickets.toast_load_fail', 'en' => 'Toast load fail', 'ar' => 'فشل تحميل الخبز المحمص
'],
            ['key' => 'admin_tickets.title', 'en' => 'Title', 'ar' => 'العنوان
'],
            ['key' => 'admin_tickets.subtitle', 'en' => 'Subtitle', 'ar' => 'الترجمة
'],
            ['key' => 'admin_tickets.filter_search', 'en' => 'Filter search', 'ar' => 'تصفية البحث
'],
            ['key' => 'admin_tickets.search_placeholder', 'en' => 'Search placeholder', 'ar' => 'بحث في العنصر النائب
'],
            ['key' => 'admin_tickets.filter_status', 'en' => 'Filter status', 'ar' => 'حالة التصفية
'],
            ['key' => 'admin_tickets.all_statuses', 'en' => 'All statuses', 'ar' => 'جميع الحالات
'],
            ['key' => 'admin_tickets.filter_category', 'en' => 'Filter category', 'ar' => 'فئة التصفية
'],
            ['key' => 'admin_tickets.all_categories', 'en' => 'All categories', 'ar' => 'جميع الفئات
'],
            ['key' => 'admin_tickets.filter_priority', 'en' => 'Filter priority', 'ar' => 'أولوية التصفية
'],
            ['key' => 'admin_tickets.all_priorities', 'en' => 'All priorities', 'ar' => 'جميع الأولويات
'],
            ['key' => 'admin_tickets.filter_publisher', 'en' => 'Filter publisher', 'ar' => 'ناشر التصفية
'],
            ['key' => 'admin_tickets.all_publishers', 'en' => 'All publishers', 'ar' => 'جميع الناشرين
'],
            ['key' => 'admin_tickets.no_tickets', 'en' => 'No tickets', 'ar' => 'لا تذاكر
'],
            ['key' => 'admin_tickets.no_tickets_hint', 'en' => 'No tickets hint', 'ar' => 'لا يوجد تلميح التذاكر
'],
            ['key' => 'admin_tickets.col_publisher', 'en' => 'Col publisher', 'ar' => 'الناشر العقيد
'],
            ['key' => 'admin_tickets.col_creator', 'en' => 'Col creator', 'ar' => 'العقيد الخالق
'],
            ['key' => 'admin_tickets.col_subject', 'en' => 'Col subject', 'ar' => 'موضوع العقيد
'],
            ['key' => 'admin_tickets.col_category', 'en' => 'Col category', 'ar' => 'فئة العقيد
'],
            ['key' => 'admin_tickets.col_priority', 'en' => 'Col priority', 'ar' => 'أولوية العقيد
'],
            ['key' => 'admin_tickets.col_status', 'en' => 'Col status', 'ar' => 'حالة العقيد
'],
            ['key' => 'admin_tickets.col_assignee', 'en' => 'Col assignee', 'ar' => 'العقيد المكلف
'],
            ['key' => 'admin_tickets.col_updated', 'en' => 'Col updated', 'ar' => 'تم تحديث العقيد
'],
            ['key' => 'admin_tickets.guest', 'en' => 'Guest', 'ar' => 'ضيف
'],
            ['key' => 'admin.websites.toast.publisher_required', 'en' => 'Publisher required', 'ar' => 'مطلوب ناشر
'],
            ['key' => 'admin.websites.toast.updated', 'en' => 'Updated', 'ar' => 'تم التحديث
'],
            ['key' => 'admin.websites.toast.created', 'en' => 'Created', 'ar' => 'تم إنشاؤها
'],
            ['key' => 'admin.websites.toast.save_failed', 'en' => 'Save failed', 'ar' => 'فشل الحفظ
'],
            ['key' => 'admin.websites.modal.edit_title', 'en' => 'Edit title', 'ar' => 'تحرير العنوان
'],
            ['key' => 'admin.websites.modal.create_title', 'en' => 'Create title', 'ar' => 'إنشاء عنوان'],
            ['key' => 'admin.websites.form.publisher_label', 'en' => 'Publisher label', 'ar' => 'تسمية الناشر
'],
            ['key' => 'admin.websites.form.publisher_placeholder', 'en' => 'Publisher placeholder', 'ar' => 'العنصر النائب للناشر
'],
            ['key' => 'admin.websites.form.no_publishers', 'en' => 'No publishers', 'ar' => 'لا الناشرين
'],
            ['key' => 'admin.websites.form.gam_account_label', 'en' => 'Gam account label', 'ar' => 'تسمية حساب GAM
'],
            ['key' => 'admin.websites.form.optional', 'en' => 'Optional', 'ar' => 'اختياري
'],
            ['key' => 'admin.websites.form.no_linked_gam', 'en' => 'No linked gam', 'ar' => 'لا توجد لعبة مرتبطة
'],
            ['key' => 'admin.websites.form.no_gam_accounts', 'en' => 'No gam accounts', 'ar' => 'لا توجد حسابات جام
'],
            ['key' => 'admin.websites.form.domain_label', 'en' => 'Domain label', 'ar' => 'تسمية المجال
'],
            ['key' => 'admin.websites.form.gam_network_code_label', 'en' => 'Gam network code label', 'ar' => 'تسمية رمز شبكة Gam
'],
            ['key' => 'admin.websites.form.ratio_override_label', 'en' => 'Ratio override label', 'ar' => 'تسمية تجاوز النسبة
'],
            ['key' => 'admin.websites.form.inherit_from_publisher', 'en' => 'Inherit from publisher', 'ar' => 'ترث من الناشر
'],
            ['key' => 'admin.websites.form.active_label', 'en' => 'Active label', 'ar' => 'التسمية النشطة
'],
            ['key' => 'admin.websites.btn.cancel', 'en' => 'Cancel', 'ar' => 'إلغاء
'],
            ['key' => 'admin.websites.btn.saving', 'en' => 'Saving', 'ar' => 'الادخار
'],
            ['key' => 'admin.websites.btn.save_website', 'en' => 'Save website', 'ar' => 'حفظ الموقع
'],
            ['key' => 'admin.websites.ad_unit.toast.updated', 'en' => 'Updated', 'ar' => 'تم التحديث
'],
            ['key' => 'admin.websites.ad_unit.toast.created', 'en' => 'Created', 'ar' => 'تم إنشاؤها
'],
            ['key' => 'admin.websites.ad_unit.modal.edit_title', 'en' => 'Edit title', 'ar' => 'تحرير العنوان
'],
            ['key' => 'admin.websites.ad_unit.modal.create_title', 'en' => 'Create title', 'ar' => 'إنشاء عنوان
'],
            ['key' => 'admin.websites.ad_unit.form.website_label', 'en' => 'Website label', 'ar' => 'تسمية موقع الويب
'],
            ['key' => 'admin.websites.ad_unit.form.website_placeholder', 'en' => 'Website placeholder', 'ar' => 'العنصر النائب لموقع الويب
'],
            ['key' => 'admin.websites.ad_unit.form.gam_name_label', 'en' => 'Gam name label', 'ar' => 'تسمية اسم اللعبة
'],
            ['key' => 'admin.websites.ad_unit.form.gam_name_hint', 'en' => 'Gam name hint', 'ar' => 'تلميح اسم اللعبة
'],
            ['key' => 'admin.websites.ad_unit.form.display_name_label', 'en' => 'Display name label', 'ar' => 'عرض تسمية الاسم
'],
            ['key' => 'admin.websites.ad_unit.form.ratio_override_label', 'en' => 'Ratio override label', 'ar' => 'تسمية تجاوز النسبة
'],
            ['key' => 'admin.websites.ad_unit.form.inherit', 'en' => 'Inherit', 'ar' => 'يرث
'],
            ['key' => 'admin.websites.ad_unit.form.ad_type_label', 'en' => 'Ad type label', 'ar' => 'تصنيف نوع الإعلان
'],
            ['key' => 'admin.websites.ad_unit.type.banner', 'en' => 'Banner', 'ar' => 'راية
'],
            ['key' => 'admin.websites.ad_unit.type.reward', 'en' => 'Reward', 'ar' => 'مكافأة
'],
            ['key' => 'admin.websites.ad_unit.type.interstitial', 'en' => 'Interstitial', 'ar' => 'إعلان خلالي
'],
            ['key' => 'admin.websites.ad_unit.type.anchor', 'en' => 'Anchor', 'ar' => 'مرساة
'],
            ['key' => 'admin.websites.ad_unit.type.float_top', 'en' => 'Float top', 'ar' => 'تعويم أعلى
'],
            ['key' => 'admin.websites.ad_unit.type.float_bottom', 'en' => 'Float bottom', 'ar' => 'تعويم القاع
'],
            ['key' => 'admin.websites.ad_unit.type.float_fullscreen', 'en' => 'Float fullscreen', 'ar' => 'تعويم ملء الشاشة
'],
            ['key' => 'admin.websites.ad_unit.form.reward_subtype_label', 'en' => 'Reward subtype label', 'ar' => 'تسمية النوع الفرعي للمكافأة
'],
            ['key' => 'admin.websites.ad_unit.subtype.normal', 'en' => 'Normal', 'ar' => 'عادي
'],
            ['key' => 'admin.websites.ad_unit.subtype.repeated', 'en' => 'Repeated', 'ar' => 'متكرر
'],
            ['key' => 'admin.websites.ad_unit.form.anchor_position_label', 'en' => 'Anchor position label', 'ar' => 'تسمية موقف مرساة
'],
            ['key' => 'admin.websites.ad_unit.position.top', 'en' => 'Top', 'ar' => 'أعلى
'],
            ['key' => 'admin.websites.ad_unit.position.bottom', 'en' => 'Bottom', 'ar' => 'أسفل'],
            ['key' => 'admin.websites.ad_unit.form.repeat_count_label', 'en' => 'Repeat count label', 'ar' => 'كرر تسمية العد
'],
            ['key' => 'admin.websites.ad_unit.form.close_delay_label', 'en' => 'Close delay label', 'ar' => 'إغلاق تسمية التأخير
'],
            ['key' => 'admin.websites.ad_unit.form.delay_between_label', 'en' => 'Delay between label', 'ar' => 'التأخير بين التسمية
'],
            ['key' => 'admin.websites.ad_unit.form.delay_before_label', 'en' => 'Delay before label', 'ar' => 'تأخير قبل التسمية
'],
            ['key' => 'admin.websites.ad_unit.btn.save', 'en' => 'Save', 'ar' => 'حفظ
'],
            ['key' => 'admin.websites.toast.load_failed', 'en' => 'Load failed', 'ar' => 'فشل التحميل
'],
            ['key' => 'admin.websites.title', 'en' => 'Websites & Ad Units', 'ar' => 'المواقع والوحدات الإعلانية'],
            ['key' => 'admin.websites.subtitle', 'en' => '{count} websites · {adCount} ad units', 'ar' => '{count} موقعاً · {adCount} وحدة إعلانية'],
            ['key' => 'admin.websites.btn.hide_filters', 'en' => 'Hide filters', 'ar' => 'إخفاء المرشحات
'],
            ['key' => 'admin.websites.btn.show_filters', 'en' => 'Show filters', 'ar' => 'إظهار المرشحات
'],
            ['key' => 'admin.websites.btn.add_website', 'en' => 'Add website', 'ar' => 'أضف موقعًا إلكترونيًا
'],
            ['key' => 'admin.websites.btn.add_ad_unit', 'en' => 'Add ad unit', 'ar' => 'أضف وحدة إعلانية
'],
            ['key' => 'admin.websites.btn.generate_ad_units', 'en' => 'Generate ad units', 'ar' => 'إنشاء وحدات إعلانية
'],
            ['key' => 'admin.websites.tab.websites', 'en' => 'Websites ({count})', 'ar' => 'المواقع ({count})'],
            ['key' => 'admin.websites.tab.ad_units', 'en' => 'Ad Units ({count})', 'ar' => 'الوحدات الإعلانية ({count})'],
            ['key' => 'admin.websites.filter.domain_label', 'en' => 'Domain label', 'ar' => 'تسمية المجال
'],
            ['key' => 'admin.websites.filter.domain_placeholder', 'en' => 'Domain placeholder', 'ar' => 'العنصر النائب للمجال
'],
            ['key' => 'admin.websites.filter.publisher_label', 'en' => 'Publisher label', 'ar' => 'تسمية الناشر
'],
            ['key' => 'admin.websites.filter.all_publishers', 'en' => 'All publishers', 'ar' => 'جميع الناشرين
'],
            ['key' => 'admin.websites.filter.gam_label', 'en' => 'Gam label', 'ar' => 'تسمية جام
'],
            ['key' => 'admin.websites.filter.gam_all', 'en' => 'Gam all', 'ar' => 'كل شيء
'],
            ['key' => 'admin.websites.filter.gam_linked', 'en' => 'Gam linked', 'ar' => 'لعبة مرتبطة
'],
            ['key' => 'admin.websites.filter.gam_unlinked', 'en' => 'Gam unlinked', 'ar' => 'تم إلغاء ربط لعبة GAM
'],
            ['key' => 'admin.websites.filter.status_label', 'en' => 'Status label', 'ar' => 'تسمية الحالة
'],
            ['key' => 'admin.websites.filter.status_all', 'en' => 'Status all', 'ar' => 'الحالة الكل
'],
            ['key' => 'admin.websites.filter.status_active', 'en' => 'Status active', 'ar' => 'الحالة نشطة
'],
            ['key' => 'admin.websites.filter.status_inactive', 'en' => 'Status inactive', 'ar' => 'الحالة غير نشطة
'],
            ['key' => 'admin.websites.filter.ratio_label', 'en' => 'Ratio label', 'ar' => 'تسمية النسبة
'],
            ['key' => 'admin.websites.filter.ratio_all', 'en' => 'Ratio all', 'ar' => 'نسبة الكل
'],
            ['key' => 'admin.websites.filter.ratio_override', 'en' => 'Ratio override', 'ar' => 'تجاوز النسبة
'],
            ['key' => 'admin.websites.filter.ratio_inherited', 'en' => 'Ratio inherited', 'ar' => 'النسبة موروثة
'],
            ['key' => 'admin.websites.filter.count_websites', 'en' => 'Count websites', 'ar' => 'عد المواقع
'],
            ['key' => 'admin.websites.btn.clear_filters', 'en' => 'Clear filters', 'ar' => 'مسح المرشحات
'],
            ['key' => 'admin.websites.ad_unit.selected_count', 'en' => 'Selected count', 'ar' => 'العدد المحدد
'],
            ['key' => 'admin.websites.ad_unit.btn.delete_selected_local_title', 'en' => 'Delete selected local title', 'ar' => 'حذف العنوان المحلي المحدد
'],
            ['key' => 'admin.websites.ad_unit.confirm_bulk_delete_local', 'en' => 'Confirm bulk delete local', 'ar' => 'تأكيد الحذف الجماعي المحلي
'],
            ['key' => 'admin.websites.ad_unit.toast.bulk_deleted', 'en' => 'Bulk deleted', 'ar' => 'تم حذفها بشكل مجمّع
'],
            ['key' => 'admin.websites.ad_unit.toast.bulk_delete_failed', 'en' => 'Bulk delete failed', 'ar' => 'فشل الحذف المجمع
'],
            ['key' => 'admin.websites.ad_unit.btn.delete_selected_local', 'en' => 'Delete selected local', 'ar' => 'حذف المحلية المحددة
'],
            ['key' => 'admin.websites.ad_unit.btn.archive_selected_title', 'en' => 'Archive selected title', 'ar' => 'أرشفة العنوان المحدد
'],
            ['key' => 'admin.websites.ad_unit.confirm_bulk_archive', 'en' => 'Confirm bulk archive', 'ar' => 'تأكيد الأرشيف المجمع'],
            ['key' => 'admin.websites.ad_unit.btn.archive_selected', 'en' => 'Archive selected', 'ar' => 'تم تحديد الأرشيف
'],
            ['key' => 'admin.websites.ad_unit.filter.name_label', 'en' => 'Name label', 'ar' => 'تسمية الاسم
'],
            ['key' => 'admin.websites.ad_unit.filter.name_placeholder', 'en' => 'Name placeholder', 'ar' => 'اسم العنصر النائب
'],
            ['key' => 'admin.websites.ad_unit.filter.website_label', 'en' => 'Website label', 'ar' => 'تسمية موقع الويب
'],
            ['key' => 'admin.websites.ad_unit.filter.all_websites', 'en' => 'All websites', 'ar' => 'جميع المواقع
'],
            ['key' => 'admin.websites.ad_unit.filter.count_ad_units', 'en' => 'Count ad units', 'ar' => 'عد الوحدات الإعلانية
'],
            ['key' => 'admin.websites.table.col_domain', 'en' => 'Domain', 'ar' => 'المجال'],
            ['key' => 'admin.websites.table.col_publisher', 'en' => 'Publisher', 'ar' => 'الناشر'],
            ['key' => 'admin.websites.table.col_gam_code', 'en' => 'GAM Code', 'ar' => 'رمز شبكة GAM'],
            ['key' => 'admin.websites.table.col_ratio_override', 'en' => 'Ratio Override', 'ar' => 'تجاوز النسبة'],
            ['key' => 'admin.websites.table.col_status', 'en' => 'Status', 'ar' => 'الحالة'],
            ['key' => 'admin.websites.table.col_actions', 'en' => 'Actions', 'ar' => 'الإجراءات'],
            ['key' => 'admin.websites.empty.filtered', 'en' => 'Filtered', 'ar' => 'تمت تصفيته
'],
            ['key' => 'admin.websites.empty.none', 'en' => 'None', 'ar' => 'لا شيء
'],
            ['key' => 'admin.websites.table.override_value', 'en' => 'Override value', 'ar' => 'تجاوز القيمة
'],
            ['key' => 'admin.websites.table.inherited', 'en' => 'Inherited', 'ar' => 'موروثة
'],
            ['key' => 'admin.websites.badge.active', 'en' => 'Active', 'ar' => 'نشط
'],
            ['key' => 'admin.websites.badge.inactive', 'en' => 'Inactive', 'ar' => 'غير نشط
'],
            ['key' => 'admin.websites.btn.edit', 'en' => 'Edit', 'ar' => 'تحرير
'],
            ['key' => 'admin.websites.confirm_delete', 'en' => 'Confirm delete', 'ar' => 'تأكيد الحذف
'],
            ['key' => 'admin.websites.ad_unit.table.col_ad_unit', 'en' => 'Ad Unit', 'ar' => 'الوحدة الإعلانية'],
            ['key' => 'admin.websites.ad_unit.table.col_website', 'en' => 'Website', 'ar' => 'موقع الويب'],
            ['key' => 'admin.websites.ad_unit.table.col_gam_name', 'en' => 'GAM Name', 'ar' => 'اسم الوحدة في GAM'],
            ['key' => 'admin.websites.ad_unit.empty.filtered', 'en' => 'Filtered', 'ar' => 'تمت تصفيته
'],
            ['key' => 'admin.websites.ad_unit.empty.none', 'en' => 'None', 'ar' => 'لا شيء
'],
            ['key' => 'admin.websites.ad_unit.confirm_delete_local', 'en' => 'Confirm delete local', 'ar' => 'تأكيد الحذف المحلي
'],
            ['key' => 'admin.websites.ad_unit.confirm_archive', 'en' => 'Confirm archive', 'ar' => 'تأكيد الأرشيف
'],
            ['key' => 'websites.ad_count', 'en' => 'Ad count', 'ar' => 'عدد الإعلانات'],
            ['key' => 'nav.dashboard', 'en' => 'Dashboard', 'ar' => 'لوحة التحكم'],
            ['key' => 'nav.publishers', 'en' => 'Publishers', 'ar' => 'الناشرون'],
            ['key' => 'nav.websites', 'en' => 'Websites', 'ar' => 'المواقع'],
            ['key' => 'nav.revenue', 'en' => 'Revenue', 'ar' => 'الإيرادات'],
            ['key' => 'nav.closings', 'en' => 'Period Closings', 'ar' => 'إغلاق الفترات'],
            ['key' => 'nav.payouts', 'en' => 'Payouts', 'ar' => 'المدفوعات'],
            ['key' => 'nav.adjustments', 'en' => 'Adjustments', 'ar' => 'التسويات'],
            ['key' => 'nav.support_tickets', 'en' => 'Support Tickets', 'ar' => 'تذاكر الدعم'],
            ['key' => 'nav.announcements', 'en' => 'Announcements', 'ar' => 'الإعلانات'],
            ['key' => 'nav.pages', 'en' => 'Pages', 'ar' => 'الصفحات'],
            ['key' => 'nav.audit_log', 'en' => 'Audit Logs', 'ar' => 'سجلات التدقيق'],
            ['key' => 'nav.gam_accounts', 'en' => 'GAM Accounts', 'ar' => 'حسابات GAM'],
            ['key' => 'nav.manual_sync', 'en' => 'Manual Sync', 'ar' => 'المزامنة اليدوية'],
            ['key' => 'nav.settings', 'en' => 'Settings', 'ar' => 'الإعدادات'],
            ['key' => 'nav.email_templates', 'en' => 'Email Templates', 'ar' => 'قوالب البريد الإلكتروني'],
            ['key' => 'nav.translations', 'en' => 'Translations', 'ar' => 'الترجمات'],
            ['key' => 'nav.admins', 'en' => 'Admins', 'ar' => 'المسؤولون'],
            ['key' => 'nav.main_menu', 'en' => 'Main Menu', 'ar' => 'القائمة الرئيسية'],
            ['key' => 'nav.role.super_admin', 'en' => 'Super Admin', 'ar' => 'مدير النظام'],
            ['key' => 'nav.role.finance_manager', 'en' => 'Finance Manager', 'ar' => 'مدير مالي'],
            ['key' => 'nav.role.ad_ops_manager', 'en' => 'Ad Ops Manager', 'ar' => 'مدير عمليات إعلانية'],
            ['key' => 'nav.role.support_agent', 'en' => 'Support Agent', 'ar' => 'دعم فني'],
            ['key' => 'nav.role.content_manager', 'en' => 'Content Manager', 'ar' => 'مدير محتوى'],

            // FAQ Management Translations
            ['key' => 'nav.faq', 'en' => 'FAQ', 'ar' => 'الأسئلة الشائعة'],
            ['key' => 'title.admin_faqs', 'en' => 'FAQ Management', 'ar' => 'إدارة الأسئلة الشائعة'],
            ['key' => 'faq.toast_load_fail', 'en' => 'Failed to load FAQs', 'ar' => 'فشل تحميل الأسئلة الشائعة'],
            ['key' => 'faq.question_required', 'en' => 'English Question is required', 'ar' => 'حقل السؤال باللغة الإنجليزية مطلوب'],
            ['key' => 'faq.answer_required', 'en' => 'English Answer is required', 'ar' => 'حقل الإجابة باللغة الإنجليزية مطلوب'],
            ['key' => 'faq.toast_updated', 'en' => 'FAQ updated successfully', 'ar' => 'تم تحديث السؤال الشائع بنجاح'],
            ['key' => 'faq.toast_created', 'en' => 'FAQ created successfully', 'ar' => 'تم إنشاء السؤال الشائع بنجاح'],
            ['key' => 'faq.toast_save_fail', 'en' => 'Failed to save FAQ', 'ar' => 'فشل حفظ السؤال الشائع'],
            ['key' => 'faq.confirm_delete', 'en' => 'Are you sure you want to delete this FAQ?', 'ar' => 'هل أنت متأكد من حذف هذا السؤال الشائع؟'],
            ['key' => 'faq.toast_deleted', 'en' => 'FAQ deleted successfully', 'ar' => 'تم حذف السؤال الشائع بنجاح'],
            ['key' => 'faq.toast_delete_fail', 'en' => 'Failed to delete FAQ', 'ar' => 'فشل حذف السؤال الشائع'],
            ['key' => 'faq.loading', 'en' => 'Loading FAQs…', 'ar' => 'جاري تحميل الأسئلة الشائعة…'],
            ['key' => 'faq.title', 'en' => 'FAQ Management', 'ar' => 'إدارة الأسئلة الشائعة'],
            ['key' => 'faq.subtitle', 'en' => 'Configure, translate, and organize bilingual frequently asked questions for the public site', 'ar' => 'إعداد وترجمة وتنظيم الأسئلة الشائعة ثنائية اللغة للموقع العام'],
            ['key' => 'faq.new_faq_btn', 'en' => 'New FAQ', 'ar' => 'سؤال شائع جديد'],
            ['key' => 'faq.no_faqs', 'en' => 'No FAQ records created yet', 'ar' => 'لم يتم إنشاء أي أسئلة شائعة بعد'],
            ['key' => 'faq.no_faqs_hint', 'en' => 'Click "New FAQ" to create one', 'ar' => 'انقر فوق "سؤال شائع جديد" لإنشاء واحدة'],
            ['key' => 'faq.col_order', 'en' => 'Sort Order', 'ar' => 'ترتيب الفرز'],
            ['key' => 'faq.col_question', 'en' => 'Question (English / Arabic)', 'ar' => 'السؤال (إنجليزي / عربي)'],
            ['key' => 'faq.col_answer', 'en' => 'Answer (English / Arabic)', 'ar' => 'الإجابة (إنجليزي / عربي)'],
            ['key' => 'faq.edit_faq', 'en' => 'Edit FAQ', 'ar' => 'تعديل السؤال الشائع'],
            ['key' => 'faq.new_faq', 'en' => 'New FAQ', 'ar' => 'سؤال شائع جديد'],
            ['key' => 'faq.question_label', 'en' => 'Question (English)', 'ar' => 'السؤال (باللغة الإنجليزية)'],
            ['key' => 'faq.question_placeholder', 'en' => 'e.g. Do I need my own account?', 'ar' => 'مثال: هل أحتاج إلى حساب خاص بي؟'],
            ['key' => 'faq.question_ar_label', 'en' => 'Question (Arabic)', 'ar' => 'السؤال (باللغة العربية)'],
            ['key' => 'faq.question_ar_placeholder', 'en' => 'e.g. هل أحتاج إلى حساب خاص بي؟', 'ar' => 'مثال: هل أحتاج إلى حساب خاص بي؟'],
            ['key' => 'faq.sort_order_label', 'en' => 'Sort Order', 'ar' => 'ترتيب الفرز'],
            ['key' => 'faq.answer_label', 'en' => 'Answer (English)', 'ar' => 'الإجابة (باللغة الإنجليزية)'],
            ['key' => 'faq.answer_ar_label', 'en' => 'Answer (Arabic)', 'ar' => 'الإجابة (باللغة العربية)'],
            ['key' => 'faq.published_status', 'en' => 'FAQ is Active and Published', 'ar' => 'السؤال الشائع نشط ومنشور'],
            ['key' => 'faq.update_faq', 'en' => 'Update FAQ', 'ar' => 'تحديث السؤال الشائع'],
            ['key' => 'faq.create_faq', 'en' => 'Create FAQ', 'ar' => 'إنشاء السؤال الشائع'],
        ];

        foreach ($translations as $item) {
            $key = $item['key'];
            // Determine group from key prefix (e.g. 'nav.dashboard' → 'nav')
            $group = explode('.', $key)[0];

            foreach (['en', 'ar'] as $locale) {
                Translation::firstOrCreate(
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
