<!DOCTYPE html>
<html lang="{{ $locale }}" dir="{{ $locale === 'ar' ? 'rtl' : 'ltr' }}">
<head>
    <meta charset="utf-8">
    <title>{{ $locale === 'ar' ? 'كشف الأرباح' : 'Earnings Statement' }}</title>
    <style>
        @page {
            margin: 50px 40px;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 13px;
            color: #1e293b;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        /* Layout Grid helper via tables */
        .layout-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
            margin-bottom: 20px;
        }
        .layout-table td {
            border: none;
            padding: 0;
            vertical-align: top;
        }
        /* Header Section */
        .header-left {
            text-align: {{ $locale === 'ar' ? 'right' : 'left' }};
        }
        .header-right {
            text-align: {{ $locale === 'ar' ? 'left' : 'right' }};
        }
        .logo-img {
            max-height: 48px;
            max-width: 220px;
        }
        .brand-name {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
            text-transform: uppercase;
        }
        .doc-title {
            font-size: 18px;
            font-weight: 800;
            color: #1e293b;
            margin: 0 0 5px 0;
            letter-spacing: 0.5px;
        }
        .doc-meta {
            font-size: 11px;
            color: #64748b;
        }
        /* Info Boxes */
        .info-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
        }
        .info-title {
            font-size: 11px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .info-content {
            font-size: 13px;
            color: #0f172a;
        }
        /* Stats Widgets styling */
        .stat-widget {
            background: #e0f2fe;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 12px 15px;
            text-align: center;
        }
        .stat-widget.earnings {
            background: #dcfce7;
            border: 1px solid #bbf7d0;
        }
        .stat-value {
            font-size: 20px;
            font-weight: 800;
            color: #15803d;
            margin-top: 4px;
        }
        .stat-value.blue {
            color: #0369a1;
        }
        /* Data Table Styling */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 30px;
        }
        .data-table th {
            background-color: #1e293b;
            color: #ffffff;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            padding: 10px 12px;
            text-align: {{ $locale === 'ar' ? 'right' : 'left' }};
        }
        .data-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 12px;
            color: #334155;
            text-align: {{ $locale === 'ar' ? 'right' : 'left' }};
        }
        .data-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        .data-table tr.total-row td {
            background-color: #f1f5f9;
            font-weight: bold;
            color: #0f172a;
            border-top: 2px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
            font-size: 13px;
        }
        /* Alignment helpers */
        .text-right {
            text-align: right !important;
        }
        .text-left {
            text-align: left !important;
        }
        /* Notice block for truncated list */
        .notice-card {
            background: #fffbeb;
            border: 1px solid #fef3c7;
            border-radius: 6px;
            padding: 10px 15px;
            font-size: 11px;
            color: #b45309;
            margin-bottom: 20px;
        }
        /* Footer Styling */
        .footer {
            position: fixed;
            bottom: -30px;
            left: 0px;
            right: 0px;
            height: 60px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            font-size: 10px;
            color: #94a3b8;
        }
        .footer-desc {
            margin-bottom: 5px;
            font-style: italic;
        }
        .page-num:before {
            content: counter(page);
        }
    </style>
</head>
<body>

    <!-- Header Section -->
    <table class="layout-table" style="margin-bottom: 30px;">
        <tr>
            <!-- Left Header -->
            <td class="header-left" style="width: 55%;">
                @if($siteLogo)
                    <img src="{{ $siteLogo }}" class="logo-img" alt="{{ $siteName }}">
                @else
                    <span class="brand-name">{{ $siteName }}</span>
                @endif
                <div style="font-size: 12px; color: #64748b; margin-top: 5px;">
                    {{ $locale === 'ar' ? 'منصة مشاركة الأرباح التلقائية' : 'Automated Revenue Sharing Platform' }}
                </div>
            </td>
            <!-- Right Header -->
            <td class="header-right" style="width: 45%;">
                <div class="doc-title">{{ $locale === 'ar' ? 'كشف الحساب المالي' : 'EARNINGS STATEMENT' }}</div>
                <div class="doc-meta">
                    <strong>{{ $locale === 'ar' ? 'التاريخ:' : 'Date:' }}</strong> {{ date('Y-m-d') }}<br>
                    <strong>{{ $locale === 'ar' ? 'الفترة:' : 'Period:' }}</strong> {{ $dateFrom }} {{ $locale === 'ar' ? 'إلى' : 'to' }} {{ $dateTo }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Info Section (Publisher & Stats) -->
    <table class="layout-table" style="margin-bottom: 25px;">
        <tr>
            <!-- Publisher Details -->
            <td style="width: 48%;">
                <div class="info-card" style="margin-bottom: 0; min-height: 100px;">
                    <div class="info-title">{{ $locale === 'ar' ? 'معد لأجل:' : 'PREPARED FOR:' }}</div>
                    <div class="info-content">
                        <strong style="font-size: 14px;">{{ $publisher->name }}</strong><br>
                        <span style="color: #64748b; font-size: 12px;">{{ $publisher->email }}</span><br>
                        <span style="font-size: 11px; color: #94a3b8;">{{ $locale === 'ar' ? 'حساب ناشر معتمد' : 'Verified Publisher Account' }}</span>
                    </div>
                </div>
            </td>
            <td style="width: 4%;"></td> <!-- Spacer -->
            <!-- Summary Stats -->
            <td style="width: 48%;">
                <table class="layout-table" style="margin-bottom: 0;">
                    <tr>
                        <td style="width: 48%;">
                            <div class="stat-widget earnings">
                                <div class="info-title" style="margin-bottom: 4px;">{{ $locale === 'ar' ? 'الأرباح المعتمدة' : 'APPROVED EARNINGS' }}</div>
                                <div class="stat-value">${{ number_format($totalEarnings, 2) }}</div>
                            </div>
                        </td>
                        <td style="width: 4%;"></td> <!-- Spacer -->
                        <td style="width: 48%;">
                            <div class="stat-widget">
                                <div class="info-title" style="margin-bottom: 4px;">{{ $locale === 'ar' ? 'المشاهدات' : 'IMPRESSIONS' }}</div>
                                <div class="stat-value blue">{{ number_format($totalImpressions) }}</div>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Truncation warning if applicable -->
    @if($isTruncated)
        <div class="notice-card">
            ⚠️ <strong>{{ $locale === 'ar' ? 'ملاحظة:' : 'Note:' }}</strong> 
            {{ $locale === 'ar' 
                ? 'تم تقريب هذا الكشف إلى أول 5,000 سجل لتجنب زيادة حجم الملف. يرجى تضييق نطاق التصفية لعرض تفاصيل أدق.' 
                : 'This statement shows the first 5,000 records to keep the file size optimized. Please narrow down your filters for a more granular view.' }}
        </div>
    @endif

    <!-- Data Table -->
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 20%;">{{ $locale === 'ar' ? 'التاريخ' : 'Date' }}</th>
                <th style="width: 45%;">{{ $locale === 'ar' ? 'الوحدة الإعلانية' : 'Ad Unit' }}</th>
                <th style="width: 17%; text-align: right;">{{ $locale === 'ar' ? 'المشاهدات' : 'Impressions' }}</th>
                <th style="width: 18%; text-align: right;">{{ $locale === 'ar' ? 'الأرباح' : 'Earnings (USD)' }}</th>
            </tr>
        </thead>
        <tbody>
            @if(count($records) === 0)
                <tr>
                    <td colspan="4" style="text-align: center; color: #94a3b8; padding: 30px;">
                        {{ $locale === 'ar' ? 'لا توجد سجلات أرباح للفترة المحددة' : 'No earnings records found for this period' }}
                    </td>
                </tr>
            @else
                @foreach($records as $record)
                <tr>
                    <td>{{ $record->date }}</td>
                    <td>
                        <strong style="color: #334155;">{{ $record->adUnit->display_name ?? 'N/A' }}</strong>
                        @if(isset($record->adUnit->website->domain))
                            <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">{{ $record->adUnit->website->domain }}</div>
                        @endif
                    </td>
                    <td style="text-align: right;" class="text-right">{{ number_format($record->impressions) }}</td>
                    <td style="text-align: right; font-weight: bold; color: #0f172a;" class="text-right">${{ number_format($record->publisher_earnings, 4) }}</td>
                </tr>
                @endforeach
                <!-- Total Aggregation Row -->
                <tr class="total-row">
                    <td>{{ $locale === 'ar' ? 'الإجمالي' : 'Total' }}</td>
                    <td>{{ count($records) }} {{ $locale === 'ar' ? 'سجل' : 'records' }}</td>
                    <td style="text-align: right;" class="text-right">{{ number_format($totalImpressions) }}</td>
                    <td style="text-align: right;" class="text-right">${{ number_format($totalEarnings, 2) }}</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- Footer Area -->
    <div class="footer">
        <div class="footer-desc">{{ $siteDescription }}</div>
        <div>
            {{ $siteName }} &copy; {{ date('Y') }} | 
            {{ $locale === 'ar' ? 'صفحة' : 'Page' }} <span class="page-num"></span>
        </div>
    </div>

</body>
</html>
