# Mindora X Design System

Welcome to the **Mindora X Design System**. This document defines the structural guidelines, visual styling paradigms, layout patterns, and user experience standards for the platform.

---

## 1. Visual Style & Theme Core
The core visual layout of the Mindora X platform is built on a **Layered Dark Mode Architecture** optimized for visual comfort and high contrast hierarchy.

* **Layered Surfaces**:
  * **Main Body Background**: `#13151f` (Cool dark gray, HSL 227, 23%, 10%)
  * **Sidebar**: `#11131e` (Distinct deep navy/slate blue to integrate brand accent, HSL 230, 27%, 9%)
  * **Header (Topbar)**: `rgba(19, 21, 31, 0.8)` (Translucent top navigation header with backdrop-filter blur)
  * **Cards & Widgets**: `#1b1e2c` (Slightly lighter than body background to create depth, HSL 227, 24%, 13.7%)
  * **Nested Panels & Headers**: `#222739` (Used for nested list overlays, table headers, and secondary child panels)
* **Soft Depth Shadows**: Components utilize refined multi-layered shadows (e.g., `var(--shadow-md)`) to elevate cards above the background.
* **Vibrant Accent Borders**: Cards and panels are bordered with thin, low-opacity styles (`1px solid rgba(255, 255, 255, 0.06)`) to simulate clean physical borders.

---

## 2. Palette Hierarchy & Usage

The color scheme utilizes a primary color to drive interactions, accents to highlight earnings, and warning hues to communicate pending states.

* **Primary (`#6366f1` / Indigo)**: Interactive actions, active navigation states, primary buttons.
* **Secondary (`#3b82f6` / Blue)**: Secondary actions and informative badge items.
* **Accent (`#10b981` / Emerald)**: Wallet balance, earnings increase indicator, paid/approved success badges.
* **Warning (`#f59e0b` / Amber)**: Pending balances, pending payouts, pending adjustments.
* **Danger (`#f43f5e` / Rose)**: Rejected payouts, delete actions, system error messages.

---

## 3. Typography Specifications

The system utilizes custom geometric headers for structure, matched with clean, highly readable body fonts.

* **Headers & Page Titles**: `Outfit`, sans-serif (Font weights: `600` for subtitles, `700` for titles).
* **Body, Forms & Tables**: `Inter`, sans-serif (Font weights: `400` for standard text, `500` for metadata, `600` for labels).
* **Code & Monospace Values**: `SFMono-Regular`, `Consolas`, monospace (used for transaction references, API parameters, UUIDs).

### Font Sizes & Weights
* **Page Titles (H1)**: `28px` (Line-height: `36px`, Bold)
* **Section Header (H2)**: `20px` (Line-height: `28px`, Semi-Bold)
* **Card Titles (H3)**: `16px` (Line-height: `24px`, Semi-Bold)
* **Body Large**: `15px` (Line-height: `22px`, Regular)
* **Body Standard**: `13px` (Line-height: `18px`, Regular)
* **Caption / Hint**: `11px` (Line-height: `14px`, Regular)

---

## 4. Spacing System
Enforce an **8px base grid** for paddings, margins, and layout offsets.

* **Card Padding**: `20px` default padding.
* **Page Margins**: `24px` on desktop viewports, `16px` on mobile viewports.
* **Grid gaps**: `16px` between adjacent summary cards and metric components.

---

## 5. Screen Breakpoints
Grids and flex wraps adapt dynamically to screen viewports:

* **Mobile (sm)**: `< 768px` -> Navigation collapses into toggle sidebar drawer, table columns hide, layout stacks vertically.
* **Tablet (md)**: `768px` to `1023px` -> Sidebar goes to mini-width icon panel, statistics grid displays in 2-column sets.
* **Desktop (lg)**: `≥ 1024px` -> Sidebar is fully expanded (`260px`), statistics display in 4-column configurations. Max container width limits to `1440px`.
