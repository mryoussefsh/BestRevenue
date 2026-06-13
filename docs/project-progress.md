# Project Progress — BestRevenue Platform

This document tracks the milestones, sprint tasks, and progress status of the Publisher Revenue Sharing Platform (BestRevenue).

---

## 🚦 Overall Project Status
- **Current Phase**: Phase 5 - Testing & Deployment
- **Completion Rate**: 100%
- **Current Focus**: Deployment configuration, staging setup, sandboxed end-to-end flow checks.

---

## 🏆 Development Milestones

### Milestone 1: Authentication & Publisher CRM (Sprints 1 - 2)
- [x] Bootstrapped Laravel 12 API & React 19 + Vite 8 frontend structures.
- [x] Implemented secure token-based user authentication using Laravel Sanctum.
- [x] Configured Spatie Role/Permission controls guarding Admin and Publisher layers.
- [x] Developed Admin Publisher Directory with full search, filters, and status controls.
- [x] Added customizable default revenue share ratios and log tracking for change histories.

### Milestone 2: GAM API & Sync Engine (Sprints 3 - 4)
- [x] Engineered Google Ad Manager (GAM) multi-account configuration settings.
- [x] Implemented Google OAuth2 authentication loop, saving refresh tokens securely.
- [x] Integrated Website/Domain controls allowing domain overrides and custom website ratios.
- [x] Connected GAM API services to pull impressions, unfilled impressions, clicks, gross revenue, and CPM metrics.
- [x] Created sync schedulers, progress indicators, and historical synchronization log outputs.
- [x] Developed bulk ad unit provision engines connecting backend API to GAM endpoints.

### Milestone 3: Earnings Closings & Payouts (Sprint 5)
- [x] Built monthly Period Closing system, implementing secure database transaction blocks.
- [x] Structuring record-locking logic linking processed revenue logs to closing periods.
- [x] Implemented manual balance adjustments supporting Invalid Traffic (IVT) deductions and bonus payouts.
- [x] Created stuck closing state recovery handlers (abort or complete).
- [x] Built the Payout pipeline state machine (`pending` ➡️ `approved` ➡️ `paid` / `rejected`).
- [x] Decoupled standalone manual payments from period closing engine (MPAY-1).

### Milestone 4: Portals, Reports & Notifications (Sprints 6 - 9)
- [x] Programmed Publisher Portal home displaying traffic analysis and Recharts revenue metrics.
- [x] Integrated Barryvdh PDF Generator allowing publishers to export PDF billing summaries.
- [x] Built internal Translation Editor enabling admins to update locales dynamically.
- [x] Created custom Email Template manager supporting variable injection and preview sends.
- [x] Encrypted publisher banking info using customcast attributes for privacy protection.
- [x] Configured system-wide Audit Log tables recording critical administrator actions.
- [x] Optimized paginated query performance using static caching mechanisms on setting values.

### Milestone 5: Financial Safety & Concurrency Hardening (Sprint 10)
- [x] Created database migration to add `idempotency_key` and composite indexes.
- [x] Implemented MySQL CHECK constraints for value safety (`final_amount >= 0`, `amount >= 0`, `adjustments.amount != 0`).
- [x] Integrated two-layer Period Closing locking (Cache lock + database `lockForUpdate()`).
- [x] Implemented GAM Sync lockout rules to skip fetching/syncing for `closing` or `closed` months.
- [x] Added API idempotency logic for manual payouts using `idempotency_key` headers.
- [x] Addressed manual payout rejection adjustment cleanup bugs (isolated deletion).
- [x] Deferred all balance cache updates (`syncPendingBalance`) using `DB::afterCommit(...)`.
- [x] Created the `FinancialConcurrencyTest` integration test suite to verify safety.
- [x] Implemented platform-wide timezone setting dynamically loaded on boot and corresponding admin panel settings dropdown select.

### Milestone 6: Platform Settings, Branding, SEO & Payout Setup (Sprint 11)
- [x] Configured database migration and settings seed data for SEO tags, branding file URLs, and registration switches.
- [x] Implemented public settings read endpoints and secure file uploads to storage for admin branding controls.
- [x] Injected dynamic SEO tags and browser tab title overrides at runtime on public authentication screens (Login, Register, Password Reset).
- [x] Added customizable branding logo and site title configurations that update header/sidebar layouts in real time.
- [x] Implemented dynamic self-registration checks blocking new publisher registrations if status is set to `'closed'`.
- [x] Activated publisher portal payment configuration form allowing publishers to self-setup payment details.
- [x] Integrated method-specific payout validation where period auto-close calculations check individual publisher settings against payment method minimum thresholds before creating payouts.
- [x] Added integration tests for registration block and auto-close minimum payout threshold enforcement.
- [x] Implemented robust publisher payment account details viewer and copy button in the Admin Payout Manager with multi-format parsing support.
- [x] Integrated personalized time-of-day welcome greetings dynamically tailored for publishers on the dashboard header.
- [x] Integrated comprehensive metrics filter panel (date range, presets, websites, ad units, and status) with backend parameter mapping on the publisher dashboard.
- [x] Fixed dashboard status queries by resolving virtual accessors to database queries, and added Today/Yesterday range presets.
- [x] Implemented authenticated Axios blob download flow for PDF statements in the publisher dashboard and revenue pages, resolving route redirection errors.
- [x] Redesigned the publisher PDF statement with a professional corporate-grade template (site logo, name, and description support).
- [x] Configured defensive fallback to text-based brand name in PDF rendering if PHP GD extension is missing or disabled.
- [x] Removed time component from record dates in PDF statements.
- [x] Created a live timezone-aware ticking clock on the publisher dashboard header reflecting the active platform timezone.
- [x] Integrated platform-wide timezone support in all date/time views (Audit Logs, Payouts, Adjustments, Closings, Announcements, Sync history) using dynamic context formatting utilities.
- [x] Added dynamic last sync/update time timestamp to the publisher dashboard header with robust fallbacks.
- [x] Integrated missing dashboard cards (Total Clicks, Average CTR, Average CPM, and Unfilled Impressions) to the publisher portal statistics grid.
- [x] Extended GAM report query with Active View metrics (`TOTAL_ACTIVE_VIEW_ELIGIBLE_IMPRESSIONS`, `TOTAL_ACTIVE_VIEW_VIEWABLE_IMPRESSIONS`) and stored them in new `revenue_records` columns.
- [x] Added Viewability Rate stat card to both publisher and admin dashboards with graceful `N/A` fallback and eligible impression count subtitle.
- [x] Added Unfilled Impressions stat card to the admin dashboard Performance Metrics section.
- [x] Upgraded publisher earnings chart from a single-series area to a dual-series split showing Approved (solid green) and Pending (dashed amber) earnings per day with legend and updated tooltip.
- [x] Switched GAM report metrics fetching from combined `TOTAL_*` columns to source-specific `AD_EXCHANGE_*` columns to ensure only Ad Exchange (AdX) metrics are imported.
- [x] Renamed the publisher dashboard card to "Monetized CPM" and added a tooltip explanation about the net earnings basis to avoid publisher confusion.
- [x] Removed the "Recent Payouts (Account-wide)" table section from the publisher dashboard page.
- [x] Added a paginated Daily Performance table under the charts in the publisher dashboard supporting sorting by date, impressions, clicks, CTR, CPM, approved, pending, and total earnings.
- [x] Implemented platform-wide compact amount and number formatting (compaction >= 1,000 to `k`, >= 1,000,000 to `M`) across both Publisher and Admin portals, featuring interactive circle-i info icons, hover tooltips, and click-to-toggle behaviors with safe comma sanitation and customizable decimals, added a totals footer row to the publisher daily performance table, removed "Custom Range" dropdown choice in favor of direct Start Date and End Date selections, and integrated searchable website/ad-unit select dropdown elements with parent-dependent disabling.
- [x] Fixed Google API Configuration credentials saving failure under Admin Settings by pre-seeding `google_client_id` and `google_client_secret` rows in the database settings table.
- [x] Resolved Google OAuth redirect URI mismatch (Error 400: `redirect_uri_mismatch`) by standardizing the default config redirect URIs to `http://127.0.0.1:8000/...` instead of `http://localhost:8000/...` in `.env` and `config/services.php`.
- [x] Added Google API Credentials Form Toggle to conditionally collapse the Google API Configuration setup card once configured, replacing it with a premium status button ("✅ Google API Configured") that expands the form when clicked.
- [x] Fixed timezone shift date alignment bug on the daily performance table where dates were displayed 1 day behind actual database dates (e.g. showing May 31 instead of June 1 as pending) due to backend Eloquent model date cast converting calendar dates to ISO-8601 UTC strings. Standardized casts to `date:Y-m-d` and custom controller mapping to format Carbon instances to string `Y-m-d` values. Refactored publisher and admin dashboard preset/initial date range selectors to calculate values strictly relative to the configured platform timezone instead of browser-local time.
- [x] Standardized available balance metrics to show Approved Earnings on the publisher dashboard and payouts page (representing what will be paid in the next cycle).
- [x] Streamlined the payouts listing interface by moving rejection reasons inline with the status badge (as a warnings-styled mini-pill) instead of underneath the table row.
- [x] Added a filters header bar (Status, Year, Month) placed above the stats cards on the publisher payouts page.
- [x] Cleaned up the publisher payouts page by removing the Payment Method Settings section entirely.
- [x] Implemented a filter bar on the admin payouts page featuring backend status and searchable publisher dropdown select (`PublisherSelect` with inline search) along with client-side year and month options.
- [x] Added reactive "Total Paid Out" and "Available Balance" statistics cards on the admin payouts page that dynamically refresh after actions like Approve, Reject, or Mark Paid.
- [x] Created a new publisher Settings page featuring Profile Info (name, email (read-only), phone with country-code dropdown search, telegram, and read-only country), password security tabs, and a side-by-side Active Payout Setup status card displaying the current payment method, account, and minimum threshold. Completely removed Skype ID from the platform (including all admin list views, modals, profile sheets, and database models), updated the phone number in the admin publisher profile to be a click-to-chat WhatsApp link, and placed the Country field under the Created Account date.
- [x] Integrated searchable Ad Unit dropdown filter on the admin dashboard with backend parameter mapping, supporting dependent filter resets (publisher -> website -> ad unit) and updating all charts and daily performance tables dynamically.
- [x] Restructured publisher announcements to display only on the publisher dashboard page (moved from layout to page component), replaced the large top impersonation banner with a premium bottom-centered capsule pill indicator (showing "Viewing as [Publisher Name]" with a green status dot and a red "✕ Exit" button) to maximize viewport space and match modern aesthetics, and hid all internal revenue sharing ratio percentages and ratio override values from the publisher portal websites and ad units view.
- [x] Secured backend APIs and resources to completely prevent exposure of revenue sharing ratios, default ratios, and override values to publishers (via network inspection, API endpoint guessing, or developer console), verified with comprehensive integration test coverage in `IndependentAuditFixTest`.
- [x] Added `ads.txt` content management to Google Ad Manager (GAM) accounts in the admin dashboard, allowing publishers to view and copy the configured ads.txt entries from their "My Websites" dashboard view via a modal clipboard-copy dialog.
- [x] Removed the internal "GAM Path" column from the ad units breakdown table on the publisher websites portal page for a cleaner UI layout.
- [x] Integrated a "Get Code" button inside the publisher websites ad units table that displays a dynamic GPT tag generator modal containing copy-pasteable Header and Body scripts with clipboard copy shortcuts.
- [x] Extended ad unit type options (Banner, Reward, Interstitial, Anchor, Float Top, Float Bottom, Float Full Screen) and reward subtypes (Normal / Repeated) in creation, edit, and bulk generator workflows.
- [x] Implemented dynamic script generator configurations in the publisher's "Get Code" modal, supporting customizable delay, repeat count settings, dynamic page URL metadata, and specific layouts.
- [x] Resolved Google Ad Manager collision errors by querying InventoryService dynamically before bulk auto-generating new round names, appending ad type/subtype suffixes to names.
- [x] Integrated customizable Top and Bottom Anchor ad unit position choices selected at creation time, yielding clean ready-to-use publisher tag codes.
- [x] Fixed floating ads 1-second auto-hide bug, resolved race conditions, and consolidated show/hide timings, CSS transition animations, and unremovability verification loop into a single external `br-float.js` script.
- [x] Extracted all inline CSS from publisher-facing templates, and removed siteName/platformUrl parameters from tags to prevent client-side publisher tampering, resolving them dynamically inside the scripts.
- [x] Added a second "Delete Only" button for ad units in the admin panel websites and publisher profile views, allowing local deletion from the database without archiving in Google Ad Manager. Implemented support in both individual row actions and multi-selected bulk actions, backed by automated feature tests verifying Google Ad Manager API conditional bypass behavior.
- [x] Implemented customizable preselected ad sizes depending on the ad type (Banner, Reward, Interstitial, Anchor, etc.) in the Settings panel, and configured the "Generate Ad Units in GAM" modal to automatically pre-populate sizes based on the selected ad type dropdown.
- [x] Migrated GAM Sync scheduler definition from dynamic cron/database queries on boot to a static minutely scheduler entry, handling settings check internally in command and supporting immediate settings changes without service restarts. Added detailed instructions for Hostinger and generic Shared Hosting panels with Custom Cron configuration.
- [x] Cleaned up Admin Settings UI list view by removing unused config items ("Display Currency", "GAM Report Timezone", and "Auto Payout Day of Month (1–28)").
- [x] Created the home landing page featuring a dark-themed glassmorphism marketing interface, an interactive revenue calculator, and dynamic FAQ accordions.
- [x] Configured dynamic platform statistics (impressions served, total paid, active publishers, approved websites) to load dynamic database values via public settings controller API.
- [x] Added a "Verified Payout Proofs" ledger matching target layout specifications (Publisher region masking, amount styling, formatted dates, paid success badges) integrated with transaction receipt modals.
- [x] Added a site footer to the publisher portal layout (`PublisherLayout.jsx`) containing dynamic platform info and help links.
- [x] Reconfigured root `/` routing in React `App.jsx` to load the new home landing page.
- [x] Created database migration to add `support_email`, `support_telegram`, and `support_whatsapp` settings, making support contacts fully editable by the administrator.
- [x] Created backend contact form submission controller and public POST route (`/public/contact`) with built-in rate-limiting.
- [x] Created public Support Hub page (`SupportPage.jsx`/`SupportPage.css`) containing direct links to Telegram/WhatsApp/Email channels and a validation contact form.
- [x] Integrated Support page navigation links across all public page headers and footers.
- [x] Implemented dynamic runtime mailer purging in MailConfigService to ensure SMTP settings saved in the admin settings dashboard take effect immediately.

### Milestone 7: Support Ticketing System (Sprint 12)
- [x] Implemented database migrations and models (`Ticket`, `TicketMessage`) for Support Ticketing system.
- [x] Designed and built publisher tickets dashboard and interactive support chatroom (`publisher/Tickets.jsx` & `publisher/TicketDetail.jsx`).
- [x] Created admin tickets command center with status, category, priority, assignee filters and quick updating dropdowns (`admin/Tickets.jsx` & `admin/TicketDetail.jsx`).
- [x] Integrated automated SMTP mail alerts notifying support email of new publisher tickets and notifying publishers when administrators reply.
- [x] Enforced support ticket active concurrency limit, restricting publishers to a maximum of one active ticket (`open` or `in_progress`) at any given time.
- [x] Implemented secure closed ticket locking, blocking any replies (from both publisher and admin sides) once a ticket is marked `closed`, replacing response boxes with warning notices.
- [x] Created comprehensive test coverage in `SupportTicketsTest.php` to validate ticket creation limit, closed ticket reply blocking, and resolved ticket reopening.

### Milestone 8: Dynamic Pages & Social Integration (Sprint 13)
- [x] Engineered `pages` database migration and seeded default Privacy Policy and Terms of Service documents.
- [x] Developed `Page` Eloquent model utilizing UUID primary key casts and toggles.
- [x] Implemented Admin PageController for full CRUD operations and PublicPageController for reading page content by slug.
- [x] Configured public settings endpoint to aggregate active page metadata, enabling zero-latency headers and footers across the application.
- [x] Designed responsive, dark-themed public `PageDetail` route rendering formatted rich-text contents.
- [x] Added Page Management panel under Admin Portal with WYSIWYG editor and auto-slugify features.
- [x] Integrated dynamic links inside headers and footers across Landing page, Support page, and Publisher dashboard layout.
- [x] Developed database migration seeding Facebook, Instagram, X, and Telegram social setting keys.
- [x] Updated SettingController update validation to allow clearing (nullable) values for optional display/social keys.
- [x] Exposed social keys to getPublicSettings API and added 📱 tab icon for Social Settings group in Admin panel.
- [x] Integrated conditional social icons inside public footers (Landing, Support, Dynamic Pages) and publisher dashboard layout footer.
- [x] Created and placed layout footer in the Admin dashboard layout showing the copyright notice and "Administrator" portal indicator.

### Milestone 9: Admin Profile & Password Management (Sprint 14)
- [x] Created backend PUT `/admin/profile` and `/admin/change-password` routes and `AdminProfileController` to handle updates.
- [x] Added automated validation checking email uniqueness in `users` database table.
- [x] Programmed frontend React layout settings page `/admin/profile` supporting tabs and premium UI inputs.
- [x] Connected administrator profile name card in sidebar navigation footer to link directly to profile page.
- [x] Completed `AdminProfileTest.php` feature tests checking name, email, duplicate emails, password validation, and hash comparison.
### Milestone 10: Portal UI Polish & Viewability Formatting (Sprint 15)
- [x] Reorganized publisher Settings view to display "Profile Info" and "Security Preferences" side-by-side.
- [x] Wrapped the publisher profile block inside the sidebar navigation in a React Router Link pointing to settings.
- [x] Converted the language select buttons in the topbar header into a custom-styled dropdown selector matching the brand design.
- [x] Removed the redundant "Publisher Portal" header and user email address text block from the topbar left section.
- [x] Redesigned the country code phone search box dropdown to hide search emojis and use vector SVG magnifying glass icon instead.
- [x] Reformatted the Viewability Rate card subtitle to render compact amounts (e.g. `1.2M ⓘ / 1.7M ⓘ measurable`) with interactive hover tooltips.
- [x] Resolved card layout overflows by updating `.stat-card` to use `minmax(0, 1fr) auto` grid columns and adding `flex-wrap: wrap` to `.stat-change`.

### Milestone 11: OAuth Token Auto-Refresh & Filters Polish (Sprint 16)
- [x] Implemented pre-flight OAuth token expiration checks in the backend `buildSession` method of `GamApiService` to automatically request new tokens from Google using stored refresh tokens, writing them back to the database.
- [x] Updated status badge logic in the `GamAccount` model so that accounts with a valid refresh token remain labeled as `active` rather than showing as "EXPIRED" every hour.
- [x] Redesigned the filter button inside the admin Publisher Profile portal view, moving it to the top-right header section to align with other page structures.
- [x] Restructured the vertically stacked filter fields inside the Publisher Profile filter card into a clean, horizontal responsive grid layout for desktop viewports.
- [x] Redesigned the Period Closings admin panel page layout to use a full-width card layout with CSS grid safeguards (`minWidth: 0` and `overflow: 'hidden'`) to enable responsive horizontal scrolling on mobile viewports.
- [x] Implemented a premium, floating modal-based breakdown viewer (`BreakdownModal`) for Period Closings payouts detail summaries.
- [x] Integrated a "Pending Payouts" summary card (displaying total pending amount and count) on the admin payouts page, updated the layout to stretch summary cards to full screen width on desktop, and added a "Created Date" column to the payouts listing table.
- [x] Integrated a searchable publisher select dropdown inside the admin support tickets filter panel to allow search filtering by publisher.
- [x] Standardized the admin Announcements and Custom Pages creation/edit modal layouts to stack columns vertically on mobile, and added z-index positioning overrides to admin filter bars to prevent dropdown search overlap bugs.
- [x] Disabled click-to-close backdrop interactions for all modals and popups across the entire platform (Admin, Publisher, and Public sections), requiring close buttons to dismiss them.

### Milestone 12: Manual Payout Safeguards & UI Polish (Sprint 17)
- [x] Disabled "Manual Payout" trigger buttons and forms in frontend profile views when a publisher's true wallet balance (`ready_for_payout_balance`) is `$0.00` or less, resolving the 0-balance payout bug.
- [x] Improved the manual payout warning modal info text to explicitly clarify the pending/approval workflow lifecycle.
- [x] Implemented a strict deletion guard in `AdjustmentController` `destroy` method, blocking direct deletion of negative adjustments linked to pending/active manual payouts to prevent double-payout loops.
- [x] Added unit tests verifying validation rules and adjustment deletion blocks.

### Milestone 13: Announcement Severity Styles & Collapse Features (Sprint 18)
- [x] Created database migration to add the `style` column (`enum('info', 'success', 'warning', 'danger')`, default `'info'`) to `announcements` table and updated model fillable attributes.
- [x] Added style validation rules inside admin announcement CRUD endpoints (`store` and `update`).
- [x] Integrated design style selector in the admin creation/edit announcement forms, and added layout and style badges in the announcements dashboard list table.
- [x] Added custom severity-based styling, dynamic left-border colors, matching backgrounds, and interactive hover transitions for each announcement style in CSS.
- [x] Configured announcements rendering to load dynamic Lucide icons (`Info`, `CheckCircle`, `AlertTriangle`, `AlertCircle`) and layouts dynamically for both banners and modals.
- [x] Replaced the permanent dismiss button (`X`) on banner announcements with a toggle-collapse (`ChevronUp`) button.
- [x] Developed a premium minimized banner state (collapsed strip) displaying the icon, title, and a visible expand `Show` button with a chevron (`ChevronDown`).
- [x] Optimized the collapsed layout in CSS to prevent stacked list item wrapping on mobile screens, preserving unified horizontal alignments.
- [x] Created a backend feature test suite (`AnnouncementTest.php`) verifying validation rules, style updates, and publisher-side API style retrievals.
- [x] Programmed a centralized `PageTitleUpdater` component in `App.jsx` listening to route changes and setting browser tab titles dynamically based on paths (supporting custom dynamic title formats, site_name configurations, and dynamic page-load title updates).

---

## 📅 Remaining Roadmap Tasks

### Phase 5: Testing & Deployment
- [ ] Configure GitHub Actions CI/CD workflows for automated backend PHPUnit tests and frontend linting.
- [ ] Set up staging environment on web server.
- [ ] Conduct end-to-end sandbox testing of OAuth callback sequences with production GAM accounts.
- [ ] Set up backup routines for DB and logs.
