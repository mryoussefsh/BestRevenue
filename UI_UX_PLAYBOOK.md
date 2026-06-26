# Mindora X UI/UX Playbook

This playbook establishes the user experience guidelines, navigation principles, cognitive load reduction tactics, and visual validation checklists for the Mindora X platform.

---

## 1. UX Design Philosophy
Our UX methodology focuses on **minimizing payout and numeric anxiety**. In a financial software ecosystem, users are sensitive to numbers shifting, calculations loading, and payment timelines. The UI must always maintain clarity and reassurance.

### Key Rules
1. **Never hide data adjustments**: If a publisher's balance is deducted (e.g. for IVT or manual payout offset), display this transparently as a negative adjustment entry in their log dashboard.
2. **Explicit Balance Segregation**: Split wallet status metrics into distinct parts:
   * **Ready for Payout**: Absolute wallet balance that is approved and ready for payment.
   * **Approved Balance**: Dynamically-filtered earnings matching the active search parameters.
   * **Pending Balance**: Earnings still inside the holding period awaiting calendar approval.
   * **Upcoming Adjustment**: Pending manual adjustments that will apply in the next closure cycle.

---

## 2. Navigation Architecture
* **Admin Sidebar**:
  * Persistent drawer listing core management lanes: Dashboard, Publishers, Websites, Closings, Payouts, Support Tickets, Custom Pages, Settings.
  * Bottom footer is anchored with the active Administrator profile card linking to `/admin/profile`.
* **Publisher Sidebar**:
  * Publisher links focus on metrics and support: Dashboard, My Websites, Revenue Logs, Payout History, Support Tickets, Settings.
  * Active profile block links to `/publisher/settings`.
* **Impersonation State Indicator**:
  * When an admin impersonates a publisher, the top warning banner is replaced by a bottom-anchored, floating capsule ("Viewing as [Name]") containing a red exit trigger. This keeps the layout viewport clean.

---

## 3. Cognitive Load Reduction Tactics
* **Progressive Disclosure**: Detailed statistics and sync progress logs are kept closed unless explicitly clicked.
* **Layout Consistency**: Keep page quadrants uniform. Every primary detail view displays aggregates at the top, trends in the center, and tables at the bottom.
* **Filter Reset Cascades**: Changing a parent filter (e.g., Publisher) automatically resets child parameters (e.g., Website, Ad Units) to prevent empty query configurations.

---

## 4. Mobile & Responsive Layout Rules
* **Tables**: Wrap tables in a container element with:
  ```css
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  ```
  This enables smooth touch-based scrolling.
* **Interactive Elements**: All clickable items (buttons, pagination, tabs) must maintain a minimum touch target size of **`44px` × `44px`** on mobile viewports.
* **Column Collapse**: On mobile viewports (< 768px), hide secondary metadata columns in tables (e.g. impression averages, CTRs) to preserve space for core metrics (e.g. Date and Earnings).

---

## 5. UI/UX Verification Checklist
Before approving any new view layout, verify:

- [ ] **Glass Core**: Background is dark `#0b0f19` and card panels use frosted glass opacity styling.
- [ ] **Zero Emojis**: Emojis are replaced by uniform Lucide vector icons.
- [ ] **Tabular Alignment**: Numeric columns are right-aligned and use monospace numbers (`font-variant-numeric: tabular-nums`).
- [ ] **Modal Backdrop Lock**: Modals block backdrop clicks and require clicking close buttons (`X` or `Cancel`).
- [ ] **No Double Submits**: Button submissions display loading states and disable pointer events.
- [ ] **Timezone Sync**: Timestamps use dynamic timezone-aware date formatting.
- [ ] **Mobile Responsiveness**: Elements do not overflow or cause horizontal scrolling on the page body.
