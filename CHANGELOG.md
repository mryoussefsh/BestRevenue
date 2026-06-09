# Changelog

All notable changes to the Publisher Revenue Sharing Platform (BestRevenue) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.2] - 2026-06-09

### Added
- **Publisher Payouts Filter Bar**: Added a filters bar (Status, Year, Month) placed prominently above the statistics cards on the publisher payouts page.
- **Admin Payouts Filter Bar**: Added a complete filter panel on the admin payouts page featuring backend status and searchable publisher dropdown (`PublisherSelect` with inline search) along with client-side year and month options.
- **Admin Payouts Statistics Cards**: Added reactive, real-time "Total Paid Out" and "Available Balance" cards to the admin payouts page, dynamically updating after actions like Approve, Reject, or Mark Paid.

### Changed
- **Publisher Payouts Available Balance**: Standardized the available balance on the publisher dashboard and payouts page to display Approved Earnings (representing what will be paid in the next cycle, matching the dashboard's design).
- **Inline Payout Rejection Reasons**: Streamlined the payout listing table layout by moving the rejection reasons inline inside the status badge column (as warning-styled mini-pills) instead of rendering it in a separate row underneath.
- **Removed Payment Method Settings**: Cleaned up the publisher payouts page by removing the Payment Method Settings section entirely to keep the view focused on payout history.

## [1.3.1] - 2026-06-09

### Added
- **Google API Credentials Form Toggle**: Conditionally hide the Google API configuration card in the Admin Panel when successfully configured. Replaced it with a premium green status button ("✅ Google API Configured") that reveals the form when clicked.
- **Immediate Auto-Close on Settings Update**: Configured `SettingController` to immediately run the `period:auto-close` command if `close_period_day`, `payout_auto_enabled`, or `approve_earnings_day` are updated and auto-closing is enabled.

### Fixed
- **Publisher Dashboard and My Revenue Card Aggregations**: Resolved an issue where metric cards on the publisher Dashboard and My Revenue pages calculated sums on the client-side using only the first page of paginated results, resulting in incorrect totals when records exceeded the pagination limit. Replaced client-side reduces with a backend-aggregated JSON metadata block (`aggregates`) calculated directly on the database query.
- **Admin Dashboard Approved Earnings Alignment**: Updated the Admin Dashboard's "Approved Earnings" card to sum the `approved_balance` attributes of filtered publishers, aligning it with the publisher dashboard's logic which excludes closed periods and applies pending manual payment adjustments.
- **Publisher Manual Payout Deduction**: Integrated pending balance adjustments (which contain negative deductions from standalone manual payouts) into the publisher's "Approved Earnings" card calculations on the Dashboard and My Revenue pages, ensuring that manual payments correctly reduce the available ready-to-be-paid balance on the publisher's view.
- **Publisher Approved Earnings Card**: Excluded closed (payout generated) records from the "Approved Earnings" card calculations on the publisher Dashboard and My Revenue pages, ensuring that once a payout is generated, those earnings are deducted from the ready-to-be-paid balance to prevent visual double-counting.
- **Google API Configuration Saving**: Resolved the "Failed to save credentials" admin error by pre-seeding `google_client_id` and `google_client_secret` settings in `SettingsSeeder.php`. This prevents a `ModelNotFoundException` (404) when updating the Google OAuth credentials keys, allowing them to persist correctly.
- **Google OAuth Redirect URI Mismatch**: Fixed a `redirect_uri_mismatch` error by changing the default redirect URI in `.env` and `config/services.php` from `http://localhost:8000/...` to `http://127.0.0.1:8000/...`, matching the URI displayed in the admin panel and registered in the Google Cloud Console.
- **Calendar Date Timezone Shift**: Resolved a 1-day date timezone shift bug where local dates (e.g. June 1st database records) were shifted back by one day to the previous day (e.g. May 31st) in the frontend UI due to Eloquent date serialization converting local dates to UTC/ISO-8601 strings. Standardized `RevenueRecord` date casts to serialize as a timezone-neutral `Y-m-d` string format. Also corrected the custom collection mapping inside `PublisherRevenueController@index` to output explicit `Y-m-d` string dates, and aligned the publisher dashboard, publisher revenue page, admin dashboard, and manual sync date selectors to perform preset calculations relative to the configured platform timezone setting rather than the user's browser local time.
- **Auto-Close Period Scheduling Day**: Fixed auto-close scheduler command skipping when the target day of the month has already arrived or passed in the current month. Changed strict equality date checking (`$today !== $closePeriodDay`) to a less-than comparison (`$today < $closePeriodDay`), ensuring that if the closing day has passed and the previous month's period remains open, the job will immediately run and close it.

## [1.3.0] - 2026-06-09

### Added
- **Compact Amount & Number Formatting**: Introduced a reusable frontend component `CompactAmount.jsx` to automatically format values greater than 1,000 (e.g. `1k`, `1.5M`) across all Admin and Publisher views.
  - Implemented dynamic circle info icon (`ⓘ` SVG) showing the exact full amount on hover and toggling between compact and full formats inline when clicked.
  - Integrated support for configuring decimal counts (`decimals`) and robust input parsing to handle pre-formatted string commas.
- **Platform-wide Portal Integration**:
  - **Publisher Portal**: Applied formatting to stats cards (earnings, payouts, impressions, clicks) and daily logs/table rows. Added a totals footer row (`<tfoot>`) to the daily performance table aggregating impressions, clicks, average CTR, average monetized CPM, approved earnings, pending earnings, and total earnings across all filtered days.
  - **Admin Portal**: Integrated formatting on the main dashboard metrics, publishers list columns, publisher details/adjustments/payout tables, period closings, manual payment modals, and revenue logs.
- **Improved Date Range Controls**: Removed "Custom Range" from the Time Range dropdown menu and enabled direct manual editing of Start and End Date date pickers at any time, which automatically switches the active preset to "Custom Range".
- **Searchable Website & Ad Unit Selects**: Upgraded the publisher dashboard filter panel to use the custom `SearchableSelect` dropdown component for both the Website and Ad Unit filters, and extended `SearchableSelect` to support disabled interactions when no parent website is selected.

## [1.2.0] - 2026-06-08

### Changed
- **Publisher Dashboard Recent Payouts**: Removed the "Recent Payouts (Account-wide)" table section from the bottom of the publisher dashboard page.
- **Publisher Dashboard Daily Performance Table**: Added an interactive Daily Performance table underneath the charts in the publisher dashboard, displaying date, impressions, clicks, CTR, CPM, approved earnings, pending earnings, and total earnings with full sorting and pagination controls.

## [1.1.9] - 2026-06-08

### Changed
- **GAM Ad Exchange (AdX) Only Fetching**: Updated GAM report query to pull metrics exclusively from Ad Exchange (AdX) sources. Replaced `TOTAL_LINE_ITEM_LEVEL_IMPRESSIONS`, `TOTAL_LINE_ITEM_LEVEL_CLICKS`, `TOTAL_LINE_ITEM_LEVEL_CPM_AND_CPC_REVENUE`, `TOTAL_LINE_ITEM_LEVEL_WITH_CPD_AVERAGE_ECPM`, `TOTAL_ACTIVE_VIEW_ELIGIBLE_IMPRESSIONS`, and `TOTAL_ACTIVE_VIEW_VIEWABLE_IMPRESSIONS` with their corresponding `AD_EXCHANGE_*` variants:
  - `AD_EXCHANGE_LINE_ITEM_LEVEL_IMPRESSIONS`
  - `AD_EXCHANGE_LINE_ITEM_LEVEL_CLICKS`
  - `AD_EXCHANGE_LINE_ITEM_LEVEL_REVENUE`
  - `AD_EXCHANGE_LINE_ITEM_LEVEL_AVERAGE_ECPM`
  - `AD_EXCHANGE_ACTIVE_VIEW_ELIGIBLE_IMPRESSIONS`
  - `AD_EXCHANGE_ACTIVE_VIEW_VIEWABLE_IMPRESSIONS`
  Note that unfilled impressions remain at the inventory level (`TOTAL_INVENTORY_LEVEL_UNFILLED_IMPRESSIONS`) since there is no source-specific unfilled equivalent.
- **Publisher Dashboard CPM Display**: Renamed "Average CPM" card to "Monetized CPM" and added an information tooltip explaining that this CPM is calculated based on net earnings after the platform share has been applied.

## [1.1.8] - 2026-06-08


### Added
- **GAM Active View (Viewability) Metrics**: Extended the GAM report query to fetch `TOTAL_ACTIVE_VIEW_ELIGIBLE_IMPRESSIONS` and `TOTAL_ACTIVE_VIEW_VIEWABLE_IMPRESSIONS` columns alongside existing traffic metrics.
- **Database Migration — Viewability Columns**: Added `active_view_eligible_impressions` (bigint) and `active_view_viewable_impressions` (bigint) columns to `revenue_records` table, defaulting to 0.
- **Viewability Rate Card — Publisher Dashboard**: Added a new stat card computing viewability rate (`viewable ÷ eligible × 100`), showing `N/A` gracefully when no eligible impressions exist. Subtitle displays raw counts (`X,XXX / Y,YYY eligible`).
- **Viewability Rate Card — Admin Dashboard**: Added the same Viewability Rate card to the Performance Metrics section of the admin dashboard, computed from aggregated revenue records across all publishers.
- **Unfilled Impressions Card — Admin Dashboard**: Added an Unfilled Impressions stat card in the Performance Metrics section of the admin dashboard, showing total unserved inventory for the selected period and filters.
- **Publisher Chart — Approved vs. Pending Split**: Replaced the single-series earnings area chart in the publisher dashboard with two separate area series: Approved Earnings (solid green) and Pending Earnings (dashed amber). Added a visual legend in the chart card header and updated tooltip labels accordingly.

### Fixed
- **Wrong GAM Column Constants**: Fixed `Undefined constant` sync crash caused by incorrect Active View column names. The correct constants in the v202605 library are `Column::TOTAL_ACTIVE_VIEW_ELIGIBLE_IMPRESSIONS` and `Column::TOTAL_ACTIVE_VIEW_VIEWABLE_IMPRESSIONS` (not the unprefixed `ACTIVE_VIEW_*` variants).

## [1.1.7] - 2026-06-08

### Added
- **Dynamic Timezone Formatting Context Helpers**: Implemented `formatDate`, `formatDateTime`, and `formatDateTimeLocal` functions inside `SettingsContext.jsx` to dynamically align UTC timestamps with the admin-configured `platform_timezone` setting. Pure calendar dates are preserved as-is.
- **Publisher Dashboard Last Sync Time**: Added a timezone-aware update timestamp display in the publisher dashboard header reflecting the maximum `synced_at` date of this publisher's revenue records, with a fallback to the max `last_synced_at` of GAM accounts linked to their websites.
- **Publisher Last Sync API Metadata**: Exposes the computed `last_sync_at` timestamp inside `PublisherRevenueController@index` payload.
- **Publisher Dashboard Metric Cards**: Expanded the publisher dashboard statistics grid to render missing metrics: Total Clicks, Average CTR, Average CPM, and Unfilled Impressions.
- **Exposed Unfilled Impressions API Parameter**: Modified `PublisherRevenueController` to include `unfilled_impressions` inside the fetched records mapped arrays.

### Fixed
- **Platform-wide Timezone Support**: Updated Audit Logs, Payouts, Adjustments, Closings, Announcements, Sync history, Publisher Profile, and Payout sheets to consume the dynamic timezone formatting helpers, replacing raw timezone-ignorant string slicing.

## [1.1.6] - 2026-06-08

### Added
- **Branded PDF Statement Layout**: Overhauled the publisher PDF statement template to feature a professional corporate style with dynamic platform branding. It now automatically pulls and displays the site logo, site description, and site name from the backend configuration.
- **Defensive GD Fallback**: Added dynamic detection of the PHP GD extension (`extension_loaded('gd')`) to prevent Dompdf crashes. If GD is disabled, the layout cleanly falls back to a text-based brand logo.
- **Live Platform Timezone Clock**: Added a live ticking clock to the publisher dashboard header displaying the current platform time in the configured `platform_timezone` setting.

### Fixed
- **Clean PDF Date Format**: Stripped the time component (`00:00:00`) from the record dates in the PDF statement grid to display only the date part.

## [1.1.5] - 2026-06-08

### Fixed
- **PDF Export Sanctum Authentication**: Resolved the `Route [login] not defined` error when clicking `Export PDF Statement`. Replaced direct browser tab navigation (which stripped out JWT/Bearer tokens) with an authenticated Axios blob file download stream in both the Publisher Dashboard and Revenue views.

## [1.1.4] - 2026-06-08

### Added
- **Today & Yesterday Date Presets**: Added "Today" and "Yesterday" as options in the dashboard's Time Range preset dropdown.

### Fixed
- **Status Filter Query Bug**: Fixed a SQL exception when filtering the dashboard by status by mapping virtual runtime attributes (`approval_status`) to actual database column criteria (`period_closing_id` and date thresholds relative to the approved limit date) in the backend.

## [1.1.3] - 2026-06-08

### Added
- **Publisher Dashboard Filter System**: Added a comprehensive filtering panel to the publisher dashboard allowing users to filter statistics cards, charts, and table rows by preset date ranges, start/end dates, website domain, individual ad unit, and approval status.
- **Backend Filter Parameters**: Extended backend publisher revenue API and PDF statement generation query handlers to support website, ad unit, status, and dynamic per-page limits.

## [1.1.2] - 2026-06-08

### Added
- **Publisher Welcome Greeting**: Integrated a dynamic welcome message header at the top of the publisher dashboard that greets the publisher using their registered name and adjusts based on the time of day (Good morning / afternoon / evening).

## [1.1.1] - 2026-06-08

### Added
- **Platform-wide Timezone Configuration**: Added a new dynamic setting `platform_timezone` stored in the database. Loaded dynamically on boot within `AppServiceProvider` to apply globally to PHP and Laravel application timezone contexts.
- **Admin Settings Timezone Dropdown**: Created a curated dropdown select box for common global timezones in the Admin Settings page interface.

## [1.1.0] - 2026-06-07

### Added
- **Manual Payment Idempotency Keys**: API clients can now pass an `idempotency_key` via headers or body to prevent duplicate manual payout creations.
- **Two-Layer Period Closing Locking**: Integrated application Cache locks and database transactional row locks (`lockForUpdate()`) for closing periods.
- **Database Safety Constraints**: MySQL-conditional CHECK constraints ensuring numerical integrity (`final_amount >= 0`, `amount >= 0`, `adjustments.amount != 0`).
- **Composite Index**: Added composite database index on `revenue_records(period_closing_id, date)` to accelerate month-end closing scans.
- **Financial Concurrency Test Suite**: Added a robust integration test suite (`FinancialConcurrencyTest`) verifying race conditions, idempotency, sync lockout, and adjustment rejections.

### Changed
- **GAM Sync Lockout**: Blocked synchronization queries and flushes for any periods currently in `closing` or `closed` status.
- **Deferred Balance Syncing**: Defer cached balance updates (`syncPendingBalance`) using `DB::afterCommit(...)` callbacks to prevent transaction deadlocks and dirty reads.
- **Rerun Protection**: Recalculates `PeriodClosing` aggregates directly from DB `SUM` queries on locked records instead of additive accumulation to prevent double-counting on rerun attempts.

### Fixed
- **Targeted Manual Rejection**: Rejections of standalone manual payouts now clean up only their specific deduction adjustments without touching other adjustments or unlocking unclosed records.

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
- **Decoupled Manual Payments**: Completely decoupled manual payments from the Period Closing engine. Admins can now record standalone manual payments at any time without creating or referencing a period close, and without affecting future automatic period closes.
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
