# System Architecture — BestRevenue Platform

This document describes the high-level architecture, design patterns, and data flow of the Publisher Revenue Sharing Platform (BestRevenue).

---

## 1. High-Level Architecture Overview

The system is split into a decoupled **Client-Server Architecture**:
- **Frontend SPA**: React (React 19, Vite 8, React Router v6, Tailwind CSS, TanStack React Query, Recharts).
- **Backend REST API**: Laravel 12 (Sanctum authentication, Spatie role/permission guards, PHP 8.2+).
- **External Integration**: Google Ad Manager (GAM) API.

```mermaid
graph TD
    User([User / Publisher / Admin]) -->|HTTPS| Frontend[React SPA - Port 5173]
    Frontend -->|REST API + Sanctum| Backend[Laravel REST API - Port 8000]
    Backend -->|Eloquent ORM| DB[(Database: SQLite/MySQL)]
    Backend -->|OAuth2 / Google SDK| GAM[Google Ad Manager API]
    Backend -->|SMTP| MailServer[Mail Server]
```

---

## 2. Backend Architecture (Laravel 12 API)

The backend is built around standard MVC and Service Layer patterns. Key responsibilities include:

### A. Routing & Middlewares
- Public endpoints (`/api/v1/auth/*`, `/api/v1/translations/*`) are open or rate-limited.
- Authenticated endpoints use `auth:sanctum` middleware.
- Role-based access is protected by Spatie middleware:
  - `role:admin`: Restricts access to administrative endpoints (Publishers CRM, settings, synchronization control, manual adjustments, period closings, templates).
  - `role:publisher`: Restricts access to publisher dashboards, website registration, personal revenue charts, and payout accounts.

### B. Core Services & Integrity Safeguards
1. **Google Ad Manager Sync Service (with Lockout)**
   - Connects to the Google Ads API using stored refresh tokens for multiple authenticated `GamAccount` entries.
   - Triggers sync jobs that retrieve network info and fetch daily/hourly metrics (impressions, unfilled impressions, clicks, gross revenue).
   - Computes base publisher earnings using active revenue share ratios.
   - **Safeguard**: Before querying or batch-upserting records, the sync service queries `period_closings` to retrieve all periods in `closed` or `closing` status. Any traffic records falling within locked months are filtered out and skipped, protecting historical finalized calculations from modifications.
2. **Period Closing Engine (with Two-Layer Concurrency Locking)**
   - Processes the locking of revenue records for a complete calendar month.
   - **Concurrency Safety**: Employs a two-layer locking mechanism:
     1. An application-level Cache advisory lock (`period_close_lock_{year}_{month}`) with a 10-minute timeout.
     2. A database-level transactional row lock (`lockForUpdate()`) on the `PeriodClosing` record itself.
   - Iterates through active publishers, aggregates revenue, and applies active adjustments.
   - **Rerun & Double-Counting Protection**: Recalculates period totals using database `SUM` queries on locked records rather than cumulative additions.
   - Generates static `Payout` records and sets database references on synced `RevenueRecord` tables, avoiding double-closing.
3. **Manual Payment Service (with Idempotency Keys)**
   - Handles standalone manual payment generation completely independently of the Period Closing workflow.
   - **Safety**: Generates payouts in a `pending` status. Supports unique `idempotency_key` headers/parameters to prevent double-submitting. Linked payouts are locked using `lockForUpdate()` during updates.
4. **Security Cast Attribute**
   - Uses Laravel's encryption engine to automatically encrypt publisher payment details (IBAN, PayPal, crypto keys) when saved and decrypt them upon query, preventing database leak visibility.

---

## 3. Frontend Architecture (React SPA)

The frontend is a single-page application focused on high-performance state rendering, dashboard analysis, and multi-language support.

### A. State Management & Data Fetching
- **Client State**: Standard React hooks and Context API for authentication state and local configurations.
- **Server State**: Managed by **TanStack React Query** v5. This provides automatic caching, background fetching, pagination state holding, and cache invalidation upon API updates (mutations).
- **HTTP Client**: Axios instance configured with interception hooks to automatically include Bearer tokens and handle `401 Unauthorized` logouts.

### B. Structure & Layouts
- **Layout Guards**:
  - `AdminLayout`: Renders side navigation specific to admins, protecting paths using admin-only auth context checks.
  - `PublisherLayout`: Renders side navigation tailored to publishers, hiding configuration panels and presenting dashboard widgets.
- **Localization (i18n)**: Renders translations via `react-i18next`. Dynamically downloads vocabulary maps from backend translation tables.

---

## 4. Key System Workflows

### A. GAM Synchronizing Sequence (Locked Period Check)
```mermaid
sequenceDiagram
    participant CLI as Cron Job / Admin CLI
    participant Sync as GamSync Service
    participant GAM as Google Ad Manager API
    participant DB as Database
    
    CLI->>Sync: Trigger Sync (All accounts / Single account)
    Sync->>DB: Fetch Closed/Closing Periods & Active Credentials
    DB-->>Sync: Return Locked Periods, Client ID, Secret & Refresh Token
    Sync->>GAM: Authenticate & Request Performance Metrics
    GAM-->>Sync: Return Impression & Gross Revenue Data
    Sync->>Sync: Filter out data in Closed/Closing Periods
    Sync->>DB: Find Matching Ad Units & Websites
    Sync->>Sync: Apply Publisher Ratio (Gross * Ratio)
    Sync->>DB: Upsert RevenueRecords & Log Sync Execution
```

### B. Month-End Period Closing Workflow (With Double Locks)
```mermaid
sequenceDiagram
    participant Admin as Admin Panel
    participant Job as PeriodClosing Job
    participant DB as Database
    
    Admin->>Job: Trigger Period Close (e.g. May 2026)
    Note over Job: Acquire Cache Lock & Transaction DB lockForUpdate
    Note over Job: Set period status to 'closing'
    Job->>DB: Query Synced RevenueRecords for Month
    Job->>DB: Query Pending Publisher Adjustments (IVT/Bonus)
    loop For Each Publisher
        Job->>Job: Aggregate Earnings (Sum of RevenueRecords * ratio)
        Job->>Job: Add/Subtract Adjustments
        Job->>DB: Create Payout Record (State: Pending Approval)
        Job->>DB: Mark Adjustments as 'applied'
    end
    Job->>DB: Link RevenueRecords to PeriodClosing ID (Locks data)
    Note over Job: Set period status to 'closed'
    Note over Job: Release Cache Lock
    Job-->>Admin: Period Close Successfully Completed
```

### C. Manual Payment Workflow (With Idempotency)
```mermaid
sequenceDiagram
    participant Admin as Admin Panel
    participant Svc as ManualPaymentService
    participant DB as Database
    participant Mail as Mail Server
    
    Admin->>Svc: Trigger Manual Payment (Amount, Method, Idempotency Key)
    Svc->>DB: Check if Idempotency Key exists
    alt Key exists
        DB-->>Svc: Return existing manual payment Payout
        Svc-->>Admin: Return existing payout immediately (prevents duplicate)
    else Key does not exist
        Svc->>Svc: Validate Input (No PeriodClosing involved)
        Svc->>DB: Save Payout (is_manual_payment = true, period_closing_id = null, status = pending)
        Svc->>DB: Create negative deduction Adjustment for publisher
        Svc->>DB: Log Audit Event
        Svc->>Mail: Send Payment Notification to Publisher
        Svc-->>Admin: Manual Payment Success (Pending Approval)
    end
```
