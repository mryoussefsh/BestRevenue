<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $site_name ?? config('app.name') }}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f0f4f8; font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; }
    .wrapper { max-width: 620px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 32px; text-align: center; }
    .header-logo { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
    .header-tagline { font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 4px; }
    .body { padding: 36px 40px; font-size: 15px; line-height: 1.7; color: #374151; }
    .body p { margin-bottom: 16px; }
    .body a[style*="background"] { display: inline-block !important; margin: 12px 0; }
    .body table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    .body table td { padding: 10px 14px; border: 1px solid #e5e7eb; font-size: 14px; }
    .body table tr:first-child td { background: #f9fafb; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 40px; text-align: center; }
    .footer-text { font-size: 12px; color: #9ca3af; line-height: 1.6; }
    .footer-brand { font-weight: 700; color: #6366f1; }
    @media (max-width: 600px) {
      .body { padding: 24px 20px; }
      .footer { padding: 16px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="header-logo">{{ $site_name ?? config('app.name') }}</div>
        <div class="header-tagline">Publisher Revenue Platform</div>
      </div>
      <div class="body">
        {!! $body !!}
      </div>
      <div class="footer">
        <div class="footer-text">
          This email was sent by <span class="footer-brand">{{ $site_name ?? config('app.name') }}</span>.<br>
          Please do not reply to this email. If you need help, contact our support team.<br>
          &copy; {{ date('Y') }} {{ $site_name ?? config('app.name') }}. All rights reserved.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
