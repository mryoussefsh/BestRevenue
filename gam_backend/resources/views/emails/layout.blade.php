<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>{{ $site_name ?? config('app.name') }}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style>
    /* ─── Reset ──────────────────────────────────────── */
    * { box-sizing: border-box; }
    img { border: 0; display: block; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }

    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');

    /* ─── Base ─────────────────────────────────────── */
    body {
      background-color: #030712;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #c0cfe0;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }

    /* ─── Wrapper ───────────────────────────────────── */
    .email-wrapper {
      max-width: 620px;
      margin: 0 auto;
      padding: 40px 16px 48px;
    }

    .email-card {
      background: #080f1d;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(0, 242, 254, 0.10);
      box-shadow: 0 4px 32px rgba(0,0,0,0.7), 0 0 60px rgba(0,242,254,0.04);
    }

    /* ─── Header ───────────────────────────────────── */
    .email-header {
      background: linear-gradient(135deg, #00f2fe 0%, #8b5cf6 100%);
      padding: 3px 0 0;
    }
    .email-header-inner {
      background: #030c1a;
      padding: 28px 40px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(0,242,254,0.08);
    }
    .header-logo-img {
      max-height: 48px; max-width: 200px; width: auto;
      display: inline-block; object-fit: contain;
    }
    .header-logo-text {
      font-family: 'Outfit', 'Inter', sans-serif;
      font-size: 26px; font-weight: 700; letter-spacing: -0.5px;
      background: linear-gradient(135deg, #00f2fe 0%, #8b5cf6 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; display: inline-block; color: #00f2fe;
    }
    .header-tagline {
      font-size: 10px; color: #4b6380; font-weight: 600;
      text-transform: uppercase; letter-spacing: 2px; margin-top: 6px;
    }

    /* ─── Body ─────────────────────────────────────── */
    .email-body {
      padding: 36px 40px 32px;
      font-size: 15px; line-height: 1.8; color: #c0cfe0;
    }
    .email-body p {
      margin: 0 0 18px; font-size: 15px; color: #c0cfe0; line-height: 1.8;
    }
    .email-body p:last-child { margin-bottom: 0; }
    .email-body strong { color: #e8f1fb; font-weight: 600; }

    /* ─── Tables (stylesheet fallback for clients that support it) ─ */
    .email-body table {
      width: 100%; margin: 22px 0;
      border-collapse: collapse !important;
      border: 2px solid rgba(0,200,212,0.35) !important;
      border-radius: 8px; overflow: hidden;
    }
    .email-body table td {
      padding: 12px 15px !important;
      border: 1px solid rgba(0,200,212,0.30) !important;
      font-size: 13px !important; color: #a8c8e0 !important;
      vertical-align: middle !important; line-height: 1.5 !important;
    }
    .email-body table tr td:first-child {
      font-weight: 600 !important; color: #d4e8f8 !important;
      background: rgba(0,200,212,0.06) !important; width: 40% !important;
      border-right: 1px solid rgba(0,200,212,0.35) !important;
    }

    /* ─── Blockquote ────────────────────────────────── */
    .email-body blockquote {
      border-left: 3px solid #8b5cf6; padding: 12px 16px; margin: 18px 0;
      color: #8499b4; font-style: italic;
      background: rgba(139,92,246,0.06); border-radius: 0 8px 8px 0;
    }

    /* ─── CTA Buttons ───────────────────────────────── */
    .email-cta-btn {
      display: inline-block !important;
    }

    /* ─── Divider ───────────────────────────────────── */
    .email-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(0,242,254,0.18), rgba(139,92,246,0.14), transparent);
      margin: 0 32px;
    }

    /* ─── Footer ────────────────────────────────────── */
    .email-footer {
      padding: 28px 40px 32px; text-align: center; background: #020a14;
    }
    .footer-socials { margin-bottom: 20px; }
    .footer-social-link {
      display: inline-block; margin: 0 5px;
      text-decoration: none; vertical-align: middle;
    }
    .footer-social-icon {
      display: inline-block; width: 36px; height: 36px; line-height: 36px;
      border-radius: 50%; text-align: center; text-decoration: none;
      font-family: Arial, Helvetica, sans-serif; font-weight: 700;
      font-size: 15px; color: #ffffff; vertical-align: middle;
    }
    .footer-text {
      font-size: 12px; color: #5c7a99; line-height: 1.75;
    }
    .footer-support-link {
      display: inline-block; margin-top: 10px; font-size: 12px;
      color: #00c8d4; text-decoration: none;
      border: 1px solid rgba(0,200,212,0.35); border-radius: 20px;
      padding: 5px 16px; font-weight: 500; letter-spacing: 0.2px;
    }
    .footer-address {
      font-size: 11px; color: #3d556d; margin-top: 12px;
      line-height: 1.6; font-style: italic;
    }
    .footer-brand { font-weight: 600; color: #00c8d4; text-decoration: none; }
    .footer-divider {
      height: 1px; background: rgba(255,255,255,0.05);
      margin: 16px auto; width: 60%;
    }
    .footer-copyright {
      margin-top: 12px; font-size: 10.5px; color: #293f54; letter-spacing: 0.4px;
    }

    /* ─── Responsive ────────────────────────────────── */
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px 28px !important; }
      .email-header-inner { padding: 20px 18px 16px !important; }
      .email-body { padding: 24px 18px 20px !important; font-size: 14px !important; }
      .email-body p { font-size: 14px !important; }
      .email-divider { margin: 0 14px !important; }
      .email-footer { padding: 20px 16px 24px !important; }
      /* Smaller CTA buttons on mobile */
      .email-cta-btn {
        font-size: 12px !important;
        padding: 8px 16px !important;
        display: block !important;
        text-align: center !important;
        margin: 12px auto !important;
        width: auto !important;
        max-width: 280px !important;
      }
      /* Table full-width on small screens */
      .email-body table { width: 100% !important; }
      .email-body table td { display: block !important; width: 100% !important; }
      .email-body table tr td:first-child { width: 100% !important; }
    }

    @media (prefers-color-scheme: dark) {
      body { background-color: #030712 !important; }
      .email-card { background: #080f1d !important; }
    }
  </style>
</head>
<body>

@php
/**
 * Post-process the email body to inject inline styles for email client compatibility.
 * Gmail and many clients strip all CSS from <style> blocks, so we must inline critical styles.
 */
$processedBody = $body;

// ── 1. Inline table styles (catches Gmail which strips <style>) ──────────────────
$tableStyle = 'style="width:100%;border-collapse:collapse;border:2px solid rgba(0,200,212,0.32);margin:20px 0;font-family:\'Inter\',Arial,sans-serif;"';
$processedBody = preg_replace('/<table(?![^>]*style)[^>]*>/i', '<table ' . $tableStyle . '>', $processedBody);

// ── 2. Inline label <td> styles (first column) ─────────────────────────────────
$labelTd = 'style="padding:12px 15px;border:1px solid rgba(0,200,212,0.28);font-family:\'Inter\',Arial,sans-serif;font-size:13px;font-weight:600;color:#d4e8f8;background:rgba(0,200,212,0.06);width:40%;vertical-align:middle;"';
$valueTd  = 'style="padding:12px 15px;border:1px solid rgba(0,200,212,0.28);font-family:\'Inter\',Arial,sans-serif;font-size:13px;color:#a8c4dc;vertical-align:middle;"';

// Match <tr> (optional ws) <td> without style (the label cell)
$processedBody = preg_replace(
    '/<tr>\s*<td(?![^>]*style)[^>]*>/i',
    '<tr><td ' . $labelTd . '>',
    $processedBody
);
// Match </td> (optional ws) <td> without style (the value cell)
$processedBody = preg_replace(
    '/<\/td>\s*<td(?![^>]*style)[^>]*>/i',
    '</td><td ' . $valueTd . '>',
    $processedBody
);

// ── 3. Inject .email-cta-btn class on pill buttons for responsive CSS ───────────
$processedBody = preg_replace_callback('/<a\b([^>]*)>/i', function ($m) {
    $attrs = $m[1];
    // Only tag anchors that have our pill button indicator
    if (stripos($attrs, 'border-radius:50px') !== false && stripos($attrs, 'email-cta-btn') === false) {
        return '<a class="email-cta-btn"' . $attrs . '>';
    }
    return $m[0];
}, $processedBody);
@endphp

  <div class="email-wrapper">
    <div class="email-card">

      {{-- ─── HEADER ──────────────────────────────────── --}}
      <div class="email-header">
        <div class="email-header-inner">
          @if(!empty($site_logo))
            <img src="{{ $site_logo }}" class="header-logo-img" alt="{{ $site_name ?? config('app.name') }}">
          @else
            <div class="header-logo-text">{{ $site_name ?? config('app.name') }}</div>
          @endif
          <div class="header-tagline">Publisher Revenue Platform</div>
        </div>
      </div>

      {{-- ─── BODY ────────────────────────────────────── --}}
      <div class="email-body">
        {!! $processedBody !!}
      </div>

      {{-- ─── DIVIDER ──────────────────────────────────── --}}
      <div class="email-divider"></div>

      {{-- ─── FOOTER ──────────────────────────────────── --}}
      <div class="email-footer">

        {{-- ── Social icons ── --}}
        @if(!empty($social_facebook) || !empty($social_instagram) || !empty($social_x) || !empty($social_telegram))
        <div class="footer-socials" style="margin-bottom: 20px;">

          @if(!empty($social_facebook))
          <a href="{{ $social_facebook }}" class="footer-social-link" target="_blank" rel="noopener noreferrer" title="Facebook"
             style="display:inline-block;margin:0 6px;text-decoration:none;vertical-align:middle;">
            <img src="https://img.icons8.com/color/36/facebook-new.png" alt="Facebook" width="36" height="36"
                 style="display:block;width:36px;height:36px;border:none;">
          </a>
          @endif

          @if(!empty($social_instagram))
          <a href="{{ $social_instagram }}" class="footer-social-link" target="_blank" rel="noopener noreferrer" title="Instagram"
             style="display:inline-block;margin:0 6px;text-decoration:none;vertical-align:middle;">
            <img src="https://img.icons8.com/color/36/instagram-new.png" alt="Instagram" width="36" height="36"
                 style="display:block;width:36px;height:36px;border:none;">
          </a>
          @endif

          @if(!empty($social_x))
          <a href="{{ $social_x }}" class="footer-social-link" target="_blank" rel="noopener noreferrer" title="X (Twitter)"
             style="display:inline-block;margin:0 6px;text-decoration:none;vertical-align:middle;">
            <img src="https://img.icons8.com/color/36/twitterx--v2.png" alt="X (Twitter)" width="36" height="36"
                 style="display:block;width:36px;height:36px;border:none;">
          </a>
          @endif

          @if(!empty($social_telegram))
          <a href="{{ $social_telegram }}" class="footer-social-link" target="_blank" rel="noopener noreferrer" title="Telegram"
             style="display:inline-block;margin:0 6px;text-decoration:none;vertical-align:middle;">
            <img src="https://img.icons8.com/color/36/telegram-app.png" alt="Telegram" width="36" height="36"
                 style="display:block;width:36px;height:36px;border:none;">
          </a>
          @endif

        </div>
        @endif

        {{-- Support Hub link --}}
        <div style="margin-bottom:16px;">
          <a href="{{ ($frontend_url ?? '') . '/support' }}" class="footer-support-link"
             style="display:inline-block;font-size:12px;color:#00c8d4;text-decoration:none;border:1px solid rgba(0,200,212,0.35);border-radius:20px;padding:5px 16px;font-family:'Inter',Arial,sans-serif;font-weight:500;"
             target="_blank" rel="noopener noreferrer">
            Visit our Support Hub
          </a>
        </div>

        {{-- Subscription notice --}}
        <div class="footer-text"
             style="font-size:12px;color:#5c7a99;line-height:1.75;font-family:'Inter',Arial,sans-serif;">
          You are receiving this email because you are a registered publisher at&nbsp;<a href="{{ $frontend_url ?? '' }}"
            class="footer-brand"
            style="font-weight:600;color:#00c8d4;text-decoration:none;">{{ $site_name ?? config('app.name') }}</a>.
        </div>

        {{-- Physical address (CAN-SPAM compliance) --}}
        @if(!empty($company_address))
        <div class="footer-address"
             style="font-size:11px;color:#3d556d;margin-top:10px;line-height:1.6;font-style:italic;font-family:Arial,sans-serif;">
          {{ $company_address }}
        </div>
        @endif

        <div class="footer-divider" style="height:1px;background:rgba(255,255,255,0.05);margin:14px auto;width:60%;"></div>

        <div class="footer-copyright"
             style="margin-top:10px;font-size:10.5px;color:#293f54;letter-spacing:0.4px;font-family:Arial,sans-serif;">
          &copy; {{ date('Y') }} {{ $site_name ?? config('app.name') }}. All rights reserved.
        </div>

      </div>{{-- /email-footer --}}

    </div>{{-- /email-card --}}
  </div>{{-- /email-wrapper --}}

</body>
</html>
