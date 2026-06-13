# Changelog

All notable changes to the Publisher Revenue Sharing Platform (BestRevenue) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.9.6] - 2026-06-13

### Added
- **Admin Management & RBAC CRUD Console**: Developed dynamic user management interfaces for administrators to view, create, edit, and delete administrators, and custom roles definition controls under a new dedicated `/admin/admins` page, with self-deletion protection and default system roles safeguards.
- **Dynamic Role-Specific Dashboards**: Created specialized home dashboards designed with custom-tailored KPI widgets, logs, and action cards matching each of the 4 platform roles: Finance Manager (`/admin/finance`), Ad Ops Manager (`/admin/adops`), Support Agent (`/admin/support`), and Content Manager (`/admin/content`).
- **Support Agent View-Only Publisher Access**: Restructured system APIs, frontend listing tables, and details profiles (`/admin/publishers/:id`) so that Support Agent users can search, filter, and view publisher profiles, but all modifying controls (Adjust Balance, Suspend, Edit, Impersonate, Delete, Website/AdUnit edits) are hidden from their UI and rejected by backend route constraints.
- **Ad Ops Google API settings access**: Restricted settings retrieval and updating to only expose Google Client credentials settings to Ad Ops Manager users.
- **Browser Title & Dynamic Layout Labels**: Configured tab browser title updates for the role-specific dashboards, and updated sidebar/footer layouts to dynamically display the active user's role name instead of hardcoded strings.

### Fixed
- **Support Dashboard Ticket Action Link**: Fixed the "Manage" ticket action button in the Support Queue dashboard card to point directly to the individual ticket details page `/admin/tickets/:id` instead of the general tickets list.
- **View-Only Auxiliary Fetch Promises**: Handled 403 Forbidden responses inside secondary frontend profile promises (Websites, Ad Units, Payouts, Revenue, GAM Accounts) so they resolve gracefully to empty structures, allowing view-only profiles to load details without crashing.

## [1.9.5] - 2026-06-13

### Added
- **Announcement Severity Styles**: Implemented distinct severity styles (`info`, `success`, `warning`, `danger` / "Alert") for system announcements. Banners and modals automatically render with color themes, left-border accents, and custom Lucide icons (`Info`, `CheckCircle`, `AlertTriangle`, `AlertCircle`) corresponding to their configured style.
- **Admin Design Style Selector**: Added a dropdown selector for the announcement design style in the admin creation/editing modal, and rendered styled layout/severity badges in the admin announcements table.
- **Responsive Collapse & Expand for Banners**: Replaced the permanent dismiss button (`X` close trigger) on banner announcements with a collapse button (`ChevronUp`). Added a responsive, glassmorphic minimized banner state (collapsed view) showing a compact banner strip with a visible `Show` button pill and chevron (`ChevronDown`).
- **Mobile Collapsed Layout Optimization**: Optimized the collapsed banner style in CSS (`.announcement-banner-collapsed`) to prevent column-stacking or vertical wrapping on mobile screen sizes, enforcing clean horizontal alignment and text-overflow ellipses.
- **Dynamic Browser Tab Titles**: Created a global `<PageTitleUpdater>` component integrated with React Router DOM that automatically updates the browser tab title to reflect the active route dynamically upon navigation (e.g. `Maximize your revenue with WebsiteName` for landing page, `Dashboard - WebsiteName` for portals, and individual descriptive names for all administrator, publisher, and custom page detail views).
- **Timezone Synchronization Engine Alignment**: Standardized the Google Ad Manager synchronization backend engine (`gam:sync` command) on the administrator-configured Platform Default Timezone (`platform_timezone` setting) instead of the legacy `gam_timezone` property, ensuring scheduling, date-boundary queries, and runtime log calculations are executed relative to the chosen settings. Addressed integration and feature testing to guarantee correctness.

## [1.9.4] - 2026-06-13

### Changed
- **Manual Payout Warning Message**: Improved the info text inside the Record Manual Payment modal to clearly outline the full lifecycle of manual payouts, explicitly stating that requests enter the queue as "Pending" and must be approved by an administrator before processing.

### Fixed
- **Manual Payouts for Zero-Balance Publishers**: Fixed a bug allowing admins to trigger manual payouts when the publisher's balance is `$0.00` or less. Updated the frontend action button and modal validation to check the publisher's true, unfiltered `ready_for_payout_balance` (instead of the dynamically-filtered `approved_balance`). The button is now disabled when the wallet balance is $\le 0$.
- **Adjustment Deletion Double-Payout Loop**: Fixed a vulnerability where admins could delete the negative offset adjustment linked to a pending manual payout, restoring the publisher's balance and allowing a double payout. Added a validation check in `AdjustmentController@destroy` blocking direct deletion of adjustments linked to active manual payouts.

## [1.9.3] - 2026-06-12

### Added
- **Pending Payouts Summary Card**: Added a new warning-themed summary card to the admin payouts page displaying the total pending payout amount and count (e.g., "3 payouts pending") calculated dynamically from active lists.
- **Created Date Table Column**: Added a "Created" column to the admin payouts table to display the formatted date when each payout was requested.
- **Searchable Publisher Select inside Tickets Filter**: Replaced the native select dropdown for the publisher parameter in the admin Tickets page filter panel with the searchable custom `PublisherSelect` dropdown, enabling administrators to search by publisher name or email address.

### Changed
- **Desktop Stat Cards Stretching**: Updated the summary card grid layout from `auto-fill` to `auto-fit` with dynamic flex boundaries, causing the three metrics cards to stretch to fill the entire desktop screen width.
- **Responsive Announcement & Custom Page Modal Forms**: Switched static grid template columns (`1fr 1fr`) in Announcement and Custom Page creation/editing modals to utilize the standardized `.form-row` responsive utility, automatically stacking input columns vertically on mobile screen widths (< 768px).
- **Modal Overlay Backdrop Click Behavior**: Disabled click-to-close triggers on all application modal backdrops and popups across the Admin, Publisher, and Public landing portals, ensuring modals can only be dismissed explicitly using close buttons (`X`, `Cancel`, or `Close`).

### Fixed
- **Bonus Website Selector Label**: Fixed a hardcoded text reference in `WebsiteSelectionModal` so that it displays "Select websites to apply the bonus" instead of "IVT deduction" when triggered from the Apply Bonus modal.
- **Dropdown Search Z-Index Overlap**: Fixed a z-index stacking context bug by adding `position: 'relative'` and `zIndex: 10` style overrides to the admin Tickets, Payouts, and Revenue page collapsible filter cards, preventing the searchable dropdown list from rendering behind the table.

## [1.9.2] - 2026-06-12

### Added
- **Automatic OAuth Token Refreshing**: Implemented automatic pre-flight OAuth token expiration checks in the backend (`GamApiService`), which requests a new access token using the refresh token and writes the updated credentials to the database dynamically when initializing GAM API sessions.
- **Period Closing Floating Modal**: Added a clean, modal-based breakdown viewer (`BreakdownModal`) in the Period Closings admin panel to show detailed publisher payouts overlaying the page.

### Changed
- **Publisher Profile Filters Redesign**: Restructured the publisher profile filter panel layout from a vertical column to a clean, responsive horizontal grid to match the styling guidelines of other pages.
- **Top Header Filters Placement**: Relocated the filters toggle button to the top-right header section alongside the "Back to Publishers List" navigation, and positioned the collapsible filter bar card immediately below it.
- **GAM Account Status Logic**: Updated status checks in the `GamAccount` model so that accounts configured with a valid refresh token remain labeled as `active` instead of flipping to `expired` after the 1-hour access token timeframe.
- **Period Closing Responsiveness**: Simplified the main closings grid layout to use full-width columns on all screens instead of a side-by-side split grid when details are opened, preventing overflows and rendering beautifully on mobile viewports.

## [1.9.1] - 2026-06-11

### Changed
- **Emoji Elimination**: Replaced old emojis with modern Lucide icons in the Adjustments, Audit Logs, GAM Accounts, and Translations admin views.

### Fixed
- **Publisher Profile Blank Page**: Fixed a runtime ReferenceError crashing the Publisher Profile page due to missing `Lock` and `Clock` imports from `lucide-react`.

## [1.9.0] - 2026-06-11

### Added
- **Clickable Sidebar Profile Block**: Wrapped the publisher profile block inside a React Router `<Link>` pointing to settings with a hover highlight.
- **Custom Language Select Dropdown**: Converted inline buttons into a custom-styled HTML select dropdown with glass aesthetics.
- **Settings Tab Reorganization**: Reorganized settings to display "Profile & Contact Details" and "Security & Password Preferences" side-by-side.
- **Search Emoji Elimination**: Redesigned the country code phone search box to hide the search emoji and render a vector SVG search background icon instead.

### Changed
- **Viewability Rate Card Subtitle Formatting**: Configured viewability rate subtitles on both publisher and admin dashboards to render compact values (e.g., `1.2M / 1.7M measurable`) with interactive hover tooltips and toggle actions bound directly to the numbers.
- **Topbar Text Removal**: Removed the "Publisher Portal" heading and user email address text block from the left side of the topbar.

### Fixed
- **Viewability Rate Card Overflow**: Solved layout overflows where displaying full uncompacted numbers pushed the right-side eye icon out of the card by modifying CSS grid columns to `minmax(0, 1fr) auto` and enabling `flex-wrap: wrap` on subtitles.

## [1.8.0] - 2026-06-11

### Added
- **Admin Profile Edit Page**: Designed and built a dedicated Profile page for administrators to edit their name and email, integrated with the global auth context for immediate visual updates.
- **Admin Password Change Controls**: Added secure password update forms for the administrator requiring current password confirmation, new password validation, and secure password hashing.
- **Admin Profile API Endpoints**: Created PUT endpoints `/admin/profile` and `/admin/change-password` with request validators, email uniqueness validation, and password hash checks.
- **Integrated Sidebar Footer Link**: Linked the administrator user card at the bottom of the sidebar navigation to redirect to the new `/admin/profile` page, replacing static details with a NavLink.
- **Robust Integration Test Coverage**: Added `AdminProfileTest.php` feature tests verifying name/email updates, validation constraints, and password changing sequences.

## [1.7.0] - 2026-06-11

### Added
- **Dynamic Pages Management**: Built complete CRUD capabilities for custom pages (Privacy Policy, Terms of Service, etc.) inside the Admin Portal.
- **Selective Page Placements**: Added administrative configuration options allowing pages to be assigned to the public footer, logged-in publishers footer, both footers, or the landing page navigation menu.
- **Wysiwyg Content Editor**: Integrated the built-in rich-text editor into the Page Management panel, enabling custom HTML layout formatting.
- **Automatic Slugification**: Enabled automated, real-time generation of URL-friendly slugs during title entry, with support for manual overrides.
- **Optimized Frontend Cache**: Appended active page lists directly to the public settings endpoint, allowing headers and layouts to render links dynamically without making extra API calls.
- **Public Page Detail view**: Programmed public route `/page/:slug` and matching stylesheet (`PageDetail.css`) displaying structured page content inside a responsive, premium glassmorphic dark mode layout.
- **Auto-Seeded Default Pages**: Seeded working Privacy Policy and Terms of Service layouts during database migration.
- **Social Media Link Settings**: Added settings for Facebook, Instagram, X (Twitter), and Telegram under a new "Social Settings" tab in the Admin panel.
- **Conditional Social Icons**: Rendered social icons inside the public footers (Landing, Support, Dynamic Pages) and publisher dashboard footer only if their links are set, hiding empty ones automatically.
- **Nullable Settings Clearing**: Configured the backend settings updater to allow clearing (making null) values for optional branding, support, and social settings.
- **Admin Dashboard Footer**: Added a layout footer to the administrator dashboard showing the copyright notice and the "Administrator" portal label.

## [1.6.0] - 2026-06-11

### Added
- **Support Ticket Active Limit**: Enforced a business rule preventing publishers from opening more than one active support ticket at a time. The publisher index endpoint returns a `has_active_ticket` metadata attribute, and the UI disables the new ticket button and displays a warning prompt.
- **Support Ticket Reopen & Reply Lock**: Blocked replies on closed support tickets. Updated the backend controllers to reject replies with status `closed` for both publishers and admins.
- **Closed Ticket Banner Notices**: Redesigned the messaging area for closed tickets. The publisher detail page displays a locked message: *"🔒 This ticket is closed. Please open a new ticket if you need more help or have other problems."* The administrator detail page displays: *"🔒 This ticket is closed. Please update the status to reopen and reply."*
- **Feature Test Enhancements**: Extended `SupportTicketsTest.php` with new integration tests verifying locking behaviors on replies and ticket creation limit validation.

## [1.5.0] - 2026-06-10

### Added
- **Public Support Hub**: Designed and implemented a modern glassmorphic Support Page (`SupportPage.jsx` & `SupportPage.css`) serving public support channels (Email, Telegram, WhatsApp) and an interactive email contact form.
- **Admin Support Config**: Added dynamic database options (`support_email`, `support_telegram`, `support_whatsapp`) editable through the Admin Settings panel to configure contact channels and the destination contact form mail.
- **Public Header/Footer Nav**: Placed public navigation anchors linking to the Support Hub page in the landing page and support page headers/footers.
- **Support Contact API & Rate-limiting**: Developed `ContactController` endpoint with SMTP-backed mail dispatching and a rate-limit throttle configuration of 5 posts per minute.
- **Feature Tests**: Developed robust test coverage (`ContactFormTest.php`) validating required form fields, mail delivery, and SMTP integration fakes.

## [1.4.0] - 2026-06-10

### Added
- **Home Landing Page**: Built a premium dark-themed glassmorphic home landing page (`LandingPage.jsx`/`LandingPage.css`) equipped with interactive calculator slider, steps pipeline, feature catalog, and dynamic FAQ accordions.
- **Dynamic Platform Statistics**: Replaced hardcoded banner statistics with live, dynamic counters querying active publishers, approved websites, total paid payout final amounts, and total impressions served directly from the database.
- **Mockup Payout Proofs**: Reconstructed the payout proofs table to match reference designs showing masked publisher regions (e.g. `H*** A***`), styled amounts, standard dates, and Paid success badges, integrated with digital receipt verification popups.
- **Publisher Portal Footer**: Inserted a clean, responsive footer at the bottom of the logged-in publisher layout providing dynamic site settings copyrights and external support resource links.
- **Vite Router Integration**: Serves the landing page at the root route (`/`) and conditionalized call-to-actions based on visitor authentication status.

## [1.3.13] - 2026-06-10

### Removed
- **Unused Settings**: Removed "Display Currency", "GAM Report Timezone", and "Auto Payout Day of Month (1–28)" from the Admin Settings list view in the backend settings controller to keep the UI clean and uncluttered.

## [1.3.12] - 2026-06-10

### Changed
- **GAM Sync Scheduler Refactoring**: Migrated the GAM sync scheduling definition from dynamic cron/database queries during Laravel boot to a static `everyMinute()` scheduler entry. Evaluation of the sync frequency (daily, hourly, minutes) and interval parameters is now done internally within the CLI command handler.
- **Shared Hosting Cron Instructions**: Enhanced the Admin Settings UI scheduler help box to include detailed instructions for configuring Custom Cron Jobs in Hostinger hPanel and generic cPanel environments, highlighting the choice of the "Custom" option to support command arguments.
- **Dynamic Path Detection**: Restored server-side absolute project path detection using `base_path()` in the settings endpoint, allowing the UI to automatically render the correct server path for copy-pasting.

## [1.3.11] - 2026-06-10

### Added
- **Ad Type Preselected Sizes Config**: Added a new setting `ad_type_preselected_sizes` stored as JSON, letting administrators preselect default sizes for different ad types (Banner, Reward, Interstitial, Anchor, and Float variations) in the Settings page.
- **Premium Sizes Settings Editor**: Built a clean, chip-based size manager inside the Admin Settings panel. Allows admins to dynamically add or delete preselected sizes for each ad type with immediate database synchronization.
- **Ad Generator Auto-Population**: Configured the "Generate Ad Units in GAM" modal to fetch the configured defaults and automatically pre-populate the sizes based on the selected ad type dropdown.
- **Automated Tests**: Included comprehensive unit tests in `SettingControllerTest.php` to verify validation, retrieval, and updating of the preselected sizes configuration.

## [1.3.10] - 2026-06-10

### Added
- **Ad Unit Deletion Without Archiving (Local)**: Integrated a second warning-styled "Delete Only" trash button under the Ad Units Action columns on the Admin Websites page and Publisher Profile page. This allows administrators to remove an ad unit from the platform database without triggering the archiving action in Google Ad Manager.
- **Bulk Local Deletion Support**: Added a `Delete Selected (Local)` bulk action button alongside the `Archive Selected` action banner, enabling multi-select local deletions of ad units.
- **Backend Conditional Archiving**: Modified `destroy` and `bulkDelete` endpoints in `AdUnitController` to validate and process an optional `archive` request parameter, defaulting to true to retain the legacy behavior.
- **Automated Test Coverage**: Added comprehensive test coverage inside the newly created `AdUnitDeleteTest` feature suite to verify conditional archiving logic for both individual and bulk actions.

## [1.3.9] - 2026-06-10

### Fixed
- **1-Second Disappearing Bug for Float Ads**: Resolved a race condition where instantly loading float ads would show for exactly 1 second and then auto-hide. Fixed the missing `container.appendChild(label)` in fullscreen float ads and hosted the script on the frontend server public assets to prevent 404 load errors. Updated labels dynamically on settings fetch resolution.
- **Anti-Tampering Platform Parameters**: Prevented publishers from spoofing or altering settings by resolving the `platformUrl` dynamically from the script tag source (`document.currentScript.src`) and the `siteName` from an asynchronous background settings query. Removed configuration parameters from generated HTML tags entirely.

### Added
- **Consolidated External Script `br-float.js`**: Moved CSS layout, slide-in/scale transitions, timing configurations, close button event bindings, and safeguard checks into a single, hosted script (`br-float.js`), drastically shrinking publisher tag size by over 70%.

## [1.3.8] - 2026-06-10

### Added
- **Premium Float Top & Float Bottom Ad Units**: Enhanced code generation templates to include slide-in/slide-out animations, absolute close overlay badges, and smooth element dismissal from the DOM.
- **Configurable Display Delays**: Integrated input fields in the Admin Ad Unit form and Bulk Generator Modal to allow admins to define timed delays (minimum of 0 seconds to support instant page load, up to 3600 seconds) before floating ad containers slide into view.
- **Close Button Delay for Floating Ads**: Allowed setting a Close Button Delay parameter (in seconds) during floating ad unit creation/editing, hiding the close trigger initially to maximize ad visibility time.

## [1.3.7] - 2026-06-10

### Added
- **Ad Unit Type Settings**: Implemented settings for `repeat_count` and `delay_between_ads` in ad unit forms and bulk generator templates for rewarded ad types.
- **Custom Anchor Positioning**: Added customizable `top` and `bottom` position settings for anchor ad units in admin modals and bulk generator, dynamically compiling clean final code output.
- **GAM Collision Prevention**: Query Google Ad Manager `InventoryService` with `LIKE` wildcard search before auto-generating round names, ensuring unique names across database and GAM.
- **Ad Unit Name Suffixes**: Appended descriptive suffixes (e.g. `_Banner`, `_Reward_Normal`, `_Reward_Repeated`, `_Interstitial`, `_Anchor_Top`, `_Anchor_Bottom`, etc.) to bulk generated ad unit names and previews.
- **Dynamic Interstitial Code**: Upgraded the interstitial ad tag templates to dynamically set the `page_url` using the website domain and call `googletag.display()`.

## [1.3.6] - 2026-06-10

### Added
- **GAM Account Ads.txt Management**: Added `ads_txt` field to Google Ad Manager (GAM) Accounts. Administrators can configure custom ads.txt contents when creating or editing GAM accounts in the admin dashboard.
- **Publisher Ads.txt Display**: Rendered a "📋 Show ads.txt" button next to each website on the publisher's "My Websites" view when an ads.txt configuration is present.
- **Interactive Ads.txt Clipboard Copy**: Created a premium monospaced modal popup dialog inside the publisher portal websites page displaying the ads.txt entries, with a single-click "Copy Content" action button and success toast feedback.
- **Interactive GPT Ad Tag Code Modal**: Added a **"Get Code"** action button to the publisher websites ad units table. Clicking it opens a modal overlay generating copy-pasteable Google Publisher Tag (GPT) Header and Body script blocks, with individual and full block copy-to-clipboard actions.
- **Cleaned Publisher Inventory View**: Removed the internal **GAM Path** column from the Ad Units details table inside the publisher websites page to keep their portal dashboard clean and focused.
- **Automated Integration Testing**: Wrote feature tests inside `IndependentAuditFixTest` verifying database migrations, validation logic, and the complete ads.txt admin-to-publisher flow.

## [1.3.5] - 2026-06-10

### Fixed
- **Publisher Ratio Secrecy Backend Reinforcement**: Removed the `ratio_override` field from backend `PublisherWebsiteController` website lists and ad unit lists endpoints to prevent publishers from inspecting ratio override structures.
- **Publisher Resource Cleanup**: Cleaned up the `PublisherResource` response representation by removing the `default_ratio` field.
- **Security Coverage Integration Test**: Implemented automated test coverage in `IndependentAuditFixTest` to assert that publisher-authenticated queries strictly exclude ratio settings, default ratios, and overrides from responses.

## [1.3.4] - 2026-06-10

### Added
- **Admin Dashboard Ad Unit Filter**: Added a searchable Ad Unit filter dropdown to the admin dashboard, allowing administrators to filter all revenue metrics, trend charts, and daily performance tables by individual ad units.
- **Dependent Filter Resetting**: Implemented cascade resetting of filters (selecting/changing a Publisher resets Website and Ad Unit filters; selecting/changing a Website resets the Ad Unit filter).
- **Backend All Ad Units Retrieval**: Added support for a `per_page=all` query parameter in `AdUnitController@index` to retrieve all matching ad units without pagination for dropdown lists.

### Fixed
- **Publisher Impersonation Indicator Redesign**: Replaced the large top warning banner for impersonation mode with a premium bottom-centered capsule pill (displaying "Viewing as [Publisher Name]" with a green active status dot and a red "✕ Exit" button) to maximize viewport space and match modern design guidelines.
- **Publisher Announcement Scoping**: Restricted the rendering of publisher announcements to only display on the main `Dashboard` page, rather than on every page layout across the publisher portal.
- **Publisher Ratio Transparency**: Hidden all internal revenue sharing ratio percentages and ad unit ratio override columns from the publisher websites listing to prevent publishers from seeing backend ratio splits.

## [1.3.3] - 2026-06-09

### Added
- **Publisher Settings Page**: Created a dedicated settings hub for publishers containing Profile details, Payment Info configurations, and Password security controls.
- **Active Payout Setup Card**: Added a side-by-side status card displaying the currently configured payment method, account details, and its associated minimum payout threshold.
- **Settings API Endpoint**: Added profile modification (`PUT /api/v1/publisher/profile`) and password change (`PUT /api/v1/publisher/change-password`) REST API endpoints.
- **Integration Test Coverage**: Added the `PublisherSettingsTest` feature suite verifying validation, profile synchronization, and password update logic.

### Changed
- **Phone Input Country Code Search**: Integrated search filter functionality (`enableSearch={true}`) in the Phone/WhatsApp country code dropdown on both the Registration page and the Settings page.
- **Complete Skype ID Removal**: Completely removed the Skype ID field from the entire platform, including registration, publisher settings, admin list views, edit modals, database model fillables, API request validators, and response resources.
- **Read-Only Country Profile**: Formatted the Country input field under profile settings to be completely read-only with a lock icon.
- **Admin Profile Detail Layout**: Moved the Country field to sit under the Created Account field in the admin publisher profile overview.
- **WhatsApp Chat Redirect**: Labeled the phone field in the admin profile as "Phone / WhatsApp" and wrapped it in a click-to-chat hyperlink targeting `https://wa.me/` for direct messaging.

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
