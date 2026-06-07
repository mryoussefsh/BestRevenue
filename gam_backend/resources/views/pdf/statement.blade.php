<!DOCTYPE html>
<html lang="{{ $locale }}" dir="{{ $locale === 'ar' ? 'rtl' : 'ltr' }}">
<head>
    <meta charset="utf-8">
    <title>Earnings Statement</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif; /* dompdf supports DejaVu for unicode/arabic */
            font-size: 14px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .details {
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: {{ $locale === 'ar' ? 'right' : 'left' }};
        }
        th {
            background-color: #f4f4f4;
        }
        .totals {
            font-weight: bold;
            font-size: 16px;
        }
    </style>
</head>
<body>

<div class="header">
    <h1>{{ $locale === 'ar' ? 'كشف الأرباح' : 'Earnings Statement' }}</h1>
    <p>{{ $dateFrom }} - {{ $dateTo }}</p>
</div>

<div class="details">
    <p><strong>{{ $locale === 'ar' ? 'الناشر:' : 'Publisher:' }}</strong> {{ $publisher->name }} ({{ $publisher->email }})</p>
    <p class="totals">
        {{ $locale === 'ar' ? 'إجمالي الأرباح:' : 'Total Earnings:' }} ${{ number_format($totalEarnings, 2) }}
    </p>
    <p class="totals">
        {{ $locale === 'ar' ? 'إجمالي المشاهدات:' : 'Total Impressions:' }} {{ number_format($totalImpressions) }}
    </p>
</div>

<hr>

<table>
    <thead>
        <tr>
            <th>{{ $locale === 'ar' ? 'التاريخ' : 'Date' }}</th>
            <th>{{ $locale === 'ar' ? 'الوحدة الإعلانية' : 'Ad Unit' }}</th>
            <th>{{ $locale === 'ar' ? 'المشاهدات' : 'Impressions' }}</th>
            <th>{{ $locale === 'ar' ? 'الأرباح' : 'Earnings (USD)' }}</th>
        </tr>
    </thead>
    <tbody>
        @foreach($records as $record)
        <tr>
            <td>{{ $record->date }}</td>
            <td>{{ $record->adUnit->display_name ?? 'N/A' }}</td>
            <td>{{ number_format($record->impressions) }}</td>
            <td>${{ number_format($record->publisher_earnings, 2) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

</body>
</html>
