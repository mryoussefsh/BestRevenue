# Publisher Revenue Sharing Platform (Mindora X)

An enterprise-grade, multi-account Publisher Revenue Sharing Platform. The platform enables publisher networks to integrate Google Ad Manager (GAM) accounts, synchronize ad unit metrics (impressions, clicks, unfilled impressions, and revenue), manage custom revenue-share ratios, run monthly period closings with deductions (IVT) or bonuses, and process publisher payouts securely.

---

## 🚀 Key Features

### 1. Multi-Account Google Ad Manager (GAM) Integration
- Connect multiple GAM accounts via secure Google OAuth2 flow.
- Synchronize network details, ad unit structures, and daily/hourly performance metrics.
- Track synchronization history and monitor log files for troubleshooting sync runs.

### 2. Website & Ad Unit Management
- Map publisher websites to GAM network codes and configure specific ad units.
- Enable custom revenue-sharing ratio overrides per website or fall back to default publisher ratios.
- Automate creation of new ad units in Google Ad Manager directly from the Admin Panel.

### 3. Revenue Tracking & Earnings Calculation
- Automatically pull impressions, clicks, unfilled impressions, gross revenue, and CPM.
- Calculate publisher earnings dynamically based on active revenue-sharing ratios.
- Lock final earnings using a Monthly Period Closing workflow.

### 4. Adjustments & Deductions
- Apply Invalid Traffic (IVT) deductions to publishers to adjust final payouts based on clean traffic data.
- Credit publishers with manual bonuses or adjustments.
- Log audit histories for all manual adjustments and ratio changes.

### 5. Payout Lifecycle Management
- Track payouts from Draft/Pending through Approved to Paid.
- Support for secure, encrypted storage of publisher payment credentials.
- Export PDF summaries of monthly revenue sharing reports for publisher billing.

### 6. Interactive Dashboards & Settings Upgrades
- Fully responsive Admin Dashboard to manage settings, configurations, translation files, and audit logs.
- Platform-wide timezone settings dynamically loaded during backend boot for scheduler and logs alignment.
- Dynamic SEO controls to set page title, description, and keywords, automatically injected in public authentication HTML headers.
- Media uploaders for branding assets including Platform Logo, Favicon, and Open Graph (OG) social share images.
- Registration toggle to dynamically open or close platform self-registration, enforcing blocks at both frontend UI and API endpoints.
- Dedicated Publisher Portal featuring interactive charts (Recharts), announcements, performance reports, and self-managed payment configuration.
- Method-specific payment settings (PayPal, Bank Transfer, Wise, etc.) allowing admins to specify guidance texts and minimum thresholds validated automatically during period closings.
- Integrated translation system (i18n) enabling localization across multiple languages.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | [PHP 8.2+](https://php.net) | Core programming language |
| **Backend Framework** | [Laravel 12](https://laravel.com) | Modern MVC & RESTful API framework |
| **Database** | SQLite / MySQL | Relational database storage |
| **GAM API Client** | [Google Ads PHP SDK](https://github.com/googleads/googleads-php-lib) | Integration library for Google Ad Manager |
| **Auth** | Laravel Sanctum | Token-based SPA/API authentication |
| **Role Management** | Spatie Laravel Permission | Role and permission control (Admin, Publisher) |
| **PDF Generation** | barryvdh/laravel-dompdf | Generating downloadable revenue report PDFs |
| **Frontend** | [React 19](https://react.dev) | Interactive UI library |
| **Build Tool** | [Vite 8](https://vite.dev) | Fast module bundler and hot reload server |
| **Data Fetching** | TanStack React Query v5 | Server state management and caching |
| **Charts** | Recharts | Visualizing performance metrics and revenue trends |
| **Localization** | i18next | Multi-language translation support |

---

## 📁 Repository Structure

```text
BestRevenue/
├── gam_backend/           # Laravel 12 API Backend
│   ├── app/               # Core application logic (Models, Controllers, Middleware)
│   ├── config/            # Application configuration files
│   ├── database/          # Database migrations, seeders, and factories
│   ├── routes/            # API & web routes
│   └── tests/             # Automated PHPUnit tests
├── gam_frontend/          # React + Vite Frontend
│   ├── src/               # React components, pages, hooks, contexts, and api layers
│   ├── public/            # Static assets and index.html
│   └── vite.config.js     # Vite configuration
├── docs/                  # System documentation
│   ├── architecture.md    # Architecture and data flow overview
│   ├── database-schema.md # Database schema definitions and relationships
│   └── project-progress.md# Project status tracking and completed sprints
└── README.md              # Main project entry document
```

---

## ⚙️ Getting Started

### Prerequisites
Make sure you have the following installed on your system:
- **PHP 8.2** or higher
- **Composer**
- **Node.js 18+** and **npm**
- **SQLite** or **MySQL** database engine

### 1. Backend Installation & Setup
Navigate to the `gam_backend` directory:
```bash
cd gam_backend
```

Install dependencies:
```bash
composer install
```

Configure your environment variables:
```bash
cp .env.example .env
```
Open the `.env` file and set up your database connection, mail configuration, and Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`).

Generate application key:
```bash
php artisan key:generate
```

Run migrations and seeders:
```bash
php artisan migrate --seed
```

### 2. Frontend Installation & Setup
Navigate to the `gam_frontend` directory:
```bash
cd ../gam_frontend
```

Install dependencies:
```bash
npm install
```

Ensure the API base URL points to your Laravel backend (configured in `src/api/client.js` or via environment variables).

---

## 🏃 Running the Application

You can spin up both frontend and backend development servers simultaneously.

From the `gam_backend` folder, run the following command (which uses `concurrently` to run the Laravel server, queue listener, logs, and Vite dev server):
```bash
cd gam_backend
npm run dev
```

Alternatively, you can run them in separate terminal tabs:

**Backend Server:**
```bash
cd gam_backend
php artisan serve
```

**Frontend Server:**
```bash
cd gam_frontend
npm run dev
```

Access the frontend dashboard at `http://localhost:5173`.

---

## 🧪 Running Tests
To execute backend PHPUnit tests, run the following command inside `gam_backend`:
```bash
composer test
```
or
```bash
php artisan test
```
