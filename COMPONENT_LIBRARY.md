# Mindora X Component Library

This catalog documents specifications, interactive states, styling, and design rules for the reusable components within the Mindora X platform.

---

## 1. Glass Card Component
* **Purpose**: Primary dashboard container.
* **CSS Structure**:
  ```css
  .glass-card {
    background: rgba(17, 24, 39, 0.7);
    backdrop-filter: blur(12px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    padding: 20px;
    transition: all 0.2s ease;
  }
  ```
* **Interactive Rule**: Hovering causes a lift (`transform: translateY(-2px)`) and highlights the border-color to `rgba(255,255,255,0.15)`.

---

## 2. Interactive Buttons
* **Primary Button**: Solid background `#4f46e5`, white text. Used for main form submissions (e.g. Save Settings, Add Website).
* **Secondary Button**: Outline design with `rgba(255,255,255,0.15)`. Used for secondary actions (e.g. Adjust Balance, Impersonate, Cancel).
* **Danger Button**: Solid `#ef4444` background. Used exclusively for destructive actions (e.g. Delete website, delete ad unit, suspend publisher).
* **Loading State**: When `disabled` or `loading`, the button displays a spinner icon, disables pointer events, and sets opacity to `0.6`.

---

## 3. Data Tables & Paginator
* **Purpose**: List impressions, payouts, and revenue records.
* **Layout Standards**:
  * **Headers**: Left-aligned for text (Domain, Payer, Method), right-aligned for numeric data (Impressions, Clicks, Balance).
  * **Values**: All currency and metrics columns use monospace font (`font-variant-numeric: tabular-nums`) to align decimal points vertically.
  * **Action Columns**: Icon-only actions must always have descriptive hover tooltips.
* **Paginator Panel**: Renders at the bottom right. Left and right arrows collapse into icons, and page numbers highlight on hover.

---

## 4. Input Fields, Textareas & Selects
* **Visual Rule**: Input elements use Surface 2 background (`#1f2937`) with a solid border `rgba(255, 255, 255, 0.1)`.
* **State Highlights**:
  * **Focus**: Border changes to `var(--color-primary)` with an indigo outer glow ring (`box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2)`).
  * **Disabled**: Background turns to `rgba(255,255,255,0.03)`, text opacity is lowered to `0.5`, cursor is set to `not-allowed`.

---

## 5. Collapsible Filter Bars
* **Purpose**: Filters records by websites, date ranges, and statuses.
* **Behavior**: Renders immediately below page headers as a collapsible card panel. Activating a filter changes the status badge to purple and updates charts reactively.

---

## 6. Dynamic Modals & Backdrop Overlays
* **Purpose**: Capture user input for critical workflow states (e.g. create page, edit template, record manual payout).
* **Backdrop**: Black transparent wash (`rgba(0,0,0,0.6)`) with `backdrop-filter: blur(4px)`.
* **Lock Behavior**: Backdrop click closure is disabled. User must explicitly click a close icon (`✕`) or the `Cancel` button.

---

## 7. Status Badges & Indicators
Renders as a pill with a colored left-aligned dot indicator:

* **Active / Paid**: Green (`var(--color-accent)`) background wash.
* **Pending / Holding**: Orange (`var(--color-warning)`) background wash.
* **Inactive / Suspended / Rejected**: Red (`var(--color-danger)`) background wash.
* **Impersonation Pill**: Center bottom capsule with a green status dot and a red exit button:
  ```css
  .impersonation-pill {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(17, 24, 39, 0.95);
    border: 1px solid var(--color-accent);
    box-shadow: var(--shadow-md);
  }
  ```
