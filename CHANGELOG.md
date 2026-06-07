# Changelog

All notable changes to the Publisher Revenue Sharing Platform (BestRevenue) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-06-07

### Added
- **Multi-Account GAM Syncing**: Connect multiple Google Ad Manager accounts via OAuth2 and pull impressions, unfilled impressions, clicks, gross revenue, and CPM metrics.
- **Period Closing Workflow**: Freeze revenue records for a specific calendar month, locking data and preventing future changes.
- **Adjustment System**: Apply Invalid Traffic (IVT) deductions or credit manual bonuses to a publisher's balance before period closing.
- **Payout State Machine**: Track payout cycles through `draft`, `pending`, `approved`, and `paid` states.
- **Payment Info Encryption**: Encrypt/decrypt publisher payment details in the database automatically using Laravel Eloquent custom cast attributes to meet strict data privacy compliance.
- **Email Template Manager**: Dynamic email sending based on configurable templates (HTML/Markdown) for platform notifications like registration approval, password resets, and payout status changes.
- **Audit Logs**: Comprehensive event tracking for user activities, including settings changes, ratio updates, payouts, and sync attempts.
- **Publisher Dashboard**: Dynamic data rendering using Recharts for daily/monthly earnings, impressions, active websites, and payment summaries.
- **PDF Revenue Exporting**: Downloadable billing PDFs generated via Dompdf containing detailed month-by-month reports.
- **Multi-Language Support (i18n)**: Interface translating dynamically between English and multiple custom locales with an integrated admin Translation Editor.

### Changed
- Refactored `Setting::get` to cache static config lookup within a request lifecycle, reducing database query overhead on paginated views.
- Upgraded Google Ads PHP SDK to version 73.0.
- Enhanced database transaction integrity on Period Closing jobs.

### Fixed
- Fixed precision issues by replacing raw floats with `bcadd` decimals when aggregating publisher balance adjustments.
- Resolved race conditions in stuck `closing` state period closings with standard abort/complete recovery workflows.
- Restored unique constraints on payouts table to prevent duplicate transaction entries.

---

## [0.9.0] - 2026-05-20

### Added
- Admin translation manager to update key-value language strings.
- System-wide search and pagination filters for publishers and websites.
- Impersonate feature enabling administrators to view the platform from any publisher's dashboard.

---

## [0.8.0] - 2026-05-01

### Added
- Google OAuth callback flow and token storage mechanisms.
- Scheduled console commands to automatically sync metrics daily.
- Active/Inactive toggles for publisher website domains.

---

## [0.7.0] - 2026-04-10

### Added
- Basic revenue record schema and calculation rules.
- User authentication utilizing Laravel Sanctum.
- Spatie Laravel Permissions setup separating Admin and Publisher roles.
- Draft UI layout structures using Vite and React.
