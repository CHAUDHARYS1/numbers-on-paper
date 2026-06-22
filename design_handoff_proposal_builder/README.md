# Handoff: Proposal / Quote Builder

## Overview

The **Proposal Builder** is a new surface for *Numbers on Paper* (a small-business invoicing app). It lets the user create a client proposal/quote by filling out a form and seeing a **live preview** of the finished proposal "paper" beside it. Key capabilities:

- A **two-column editor**: form on the left, live-scaled proposal preview on the right (sticky).
- **Toggleable sections** — the user turns proposal sections (Introduction, Scope, Deliverables, Investment, Timeline, Terms, Acceptance) on/off; the preview updates and section numbering stays sequential.
- **Line-item pricing** (Investment) with qty × rate, optional tax, and computed subtotal/tax/total.
- **Export as PDF** via the browser print path (print CSS isolates just the proposal paper).
- A **fullscreen preview** modal.
- A **mobile version** (form as stacked cards + a bottom-sheet preview + export).

This package documents *only* the proposal feature. It assumes the surrounding app shell, design tokens, and design-system components already exist (they are shared with the rest of Numbers on Paper — see the full-app handoff for the shell, nav, and complete token reference).

---

## About the Design Files

The files in this bundle are **design references created in HTML/CSS/React-via-Babel** — prototypes that show the intended look, layout, and behavior. **They are not production code to ship directly.** They render in a browser using in-browser Babel, a `window.NOP` global for mock data (`app/data.js`), and a bundled design-system JS file (the "Taskmaster Pro" design system, loaded as `window.TaskmasterProDesignSystem_b94546`).

**The task is to recreate this design in the target codebase's real environment** (the original product context is a React + Supabase app, so React + Vite is the natural target) using its established patterns — real components, real routing, a real data/persistence layer. Treat the HTML/JSX as the **visual + interaction spec**, not the file structure to copy.

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, radii, copy, and interactions are specified. Recreate the UI pixel-accurately using the app's existing component library and tokens, then wire it to real data and persistence.

---

## Files in this bundle

| File | What it is |
|---|---|
| `ProposalEditor.html` | **Desktop** editor page — the whole form + live preview + fullscreen modal + export wiring. The `Editor()` component is the screen; `Field`, `ListEditor`, `ScaledPaper`, `SECTION_DEFS` are its helpers. |
| `app/proposal-preview.jsx` | The shared **proposal "paper"** presentational component (`ProposalDoc`) + `ProposalStatusBadge`. Renders the document for live preview, fullscreen, and print. Desktop + mobile both feed it the same `docData` shape. |
| `app/proposal.css` | All proposal-specific styles: split layout (`.pe-*`), section-toggle panel (`.sectoggle*`), list/timeline editors, the proposal-paper section styles (`.ps-*`), the fullscreen overlay (`.pv-*`), and the **`@media print`** rules. |
| `mobile/m-proposal.jsx` | **Mobile** version — `ProposalEditorScreen` (stacked form cards), `MProposalDoc` (mobile proposal paper), bottom-sheet preview, and PDF export. |
| `app/data.js` | Mock data layer (`window.NOP`): `business`, `clients`, currency/date formatters. Stand-in for the real Supabase data. Replace with real queries. |

> Not included (shared, already in the app): the app shell/sidebar (`app/shell.jsx` → `window.AppShell`, `window.Switch`), base styles (`app/app.css`, `app/forms.css`), and the design-system bundle. The README enumerates every class/token the proposal relies on so you don't strictly need them.

---

## Screen 1 — Desktop proposal editor (`ProposalEditor.html`)

### Purpose
Create/edit a proposal. The user fills the form; a scaled live preview of the final document sits to the right and updates on every keystroke/toggle.

### Layout
- Rendered inside the app shell: `<AppShell active="proposals" title="New proposal" description="Fill in the details, toggle sections, and preview." actions={…} maxWidth={1320}>`. The shell provides the 248px sidebar + topbar; `actions` are topbar-right buttons.
- A "← Back" link (`.back-link`) sits above the grid.
- **`.pe-grid`** — CSS grid, `grid-template-columns: minmax(0,1fr) minmax(0,540px)`, `gap: var(--space-7)` (28px), `align-items:start`.
  - **Left (`.pe-form`)**: vertical flex, `gap: var(--space-6)` (24px) — a stack of `.card` sections.
  - **Right (`.pe-preview`)**: `position:sticky; top: var(--space-6)`. A bar (`.pe-prev-bar`) with an uppercase mono "Live preview" label + a "Fullscreen" button, then the scaled paper.
- **Responsive**: at `max-width:1080px` the grid collapses to one column and the preview becomes static (`position:static`).

### Topbar actions (right side)
Three buttons (design-system `Button`), left→right:
1. **Preview** — `variant="ghost"`, icon `ph-arrows-out` — opens the fullscreen modal.
2. **Export PDF** — `variant="ghost"`, icon `ph-file-pdf` — calls `window.print()`.
3. **Save proposal** — `variant="primary"`, icon `ph-floppy-disk` — on click flips to a "Saved" state with `ph-check` for 1600ms (mock; wire to real persistence).

### Form sections (each is a `.card`, in order)

**Card structure** (existing app pattern): `.card` > `.card-head` (contains `.card-title` h2, optional `.card-sub` or right-aligned actions) > `.card-body`.

1. **Proposal details**
   - `Proposal title` — text input, full width. Default copy: "Website redesign & brand refresh".
   - Row of two (`.row2`): `Proposal number` (mono, **readOnly**, e.g. `PROP-0007`) · `Status` (select: Draft / Sent / Accepted / Declined).
   - Row of two: `Date` (date input, mono) · `Valid until` (date input, mono).

2. **Prepared for**
   - `Saved client` — select; options are `NOP.clients` keys plus a "New client…" empty option. Picking one autofills the fields below; hint: "Pick a saved client to autofill, or type a new one below."
   - Row: `Client name` · `Contact`.
   - Row: `Email` (type=email) · `City`.

3. **Sections** (the toggle panel)
   - `.card-sub`: "Toggle what appears in the proposal".
   - `.sectoggles` — 2-column grid (`1fr 1fr`, `gap: 2px var(--space-6)`), collapses to 1 column under 680px.
   - Each row `.sectoggle` = a `Switch` + a text block (`.sectoggle-name` 14px/600, `.sectoggle-hint` 13px/`--ink-4`). When off, the name dims to `--ink-4`. Rows separated by `1px solid var(--line-soft)` bottom borders.
   - The 7 sections + hints:
     | key | name | hint |
     |---|---|---|
     | `intro` | Introduction | Opening note to the client |
     | `scope` | Scope of work | Overview & objectives |
     | `deliverables` | Deliverables | What they receive |
     | `investment` | Investment | Pricing & line items |
     | `timeline` | Timeline | Phases & milestones |
     | `terms` | Terms & conditions | Payment & legal terms |
     | `acceptance` | Acceptance | Signature block |

4. **Section content cards** (one per toggleable section) use the `SectionCard` wrapper:
   - `SectionCard` renders a `.card` that gets `.card--off` when its toggle is false → `opacity:.55` and `.card-body { display:none }`, and the head shows a mono "Hidden" flag (`.card-head-flag`) instead of its action. Each head also has its own `Switch` mirroring the panel above.
   - **Introduction**: one `.fld-textarea`.
   - **Scope of work**: `Overview` textarea + `Objectives` (a `ListEditor`).
   - **Deliverables**: a `ListEditor`.
   - **Investment**: see below — the most complex.
   - **Timeline**: repeatable `.mile-row` (grid `1fr 200px 36px`): phase name input + duration input (mono) + delete button. "Add phase" ghost button in the head.
   - **Terms & conditions**: textarea + `.snips` quick-fill chips ("50% deposit", "Milestones", "Net 30") that replace the textarea content.
   - **Acceptance**: no inputs — just a hint that a signature block prints as signing lines.

### ListEditor (reusable)
Repeatable single-line list (used for Objectives & Deliverables). Each row `.listed-row`: a drag-handle glyph `ph-dots-six-vertical` (`.li-handle`, visual only in mock), a `.fld-input` (flex:1), and a delete button `.li-del` (`ph-trash`). Below: a ghost "Add …" button. Deleting the last item leaves one empty row. (In production, make the handle actually reorder.)

### Investment line-item table
Full-bleed within the card (`margin: 0 calc(-1 * var(--space-5))`). `.li-table`:
- `.li-head` — column labels: Description · Notes · Qty (right) · Rate (right) · Amount (right) · (delete spacer).
- `.li-row` per item: `description` input · `note` input (optional detail) · `qty` number input (right) · `rate` number input (right) · computed **amount** (`.li-amount`, currency) · delete (`.li-del`, disabled when only one row).
- Below the table (`.opt-toggles`): an "Apply tax" `Switch`; when on, a `Tax rate (%)` number field (max-width 160px) appears.
- **`.totals`** block, right-aligned: Subtotal · (Tax (n%) if enabled) · **Total** (`.total-grand`, emphasized).

### Math
```
amount  = qty * rate                       (per line)
subtotal = Σ amount
taxAmt   = showTax ? round(subtotal * taxRate/100, 2) : 0
total    = round(subtotal + taxAmt, 2)
```
`taxRate` is held as a whole number (e.g. `7`); the doc receives `taxRate/100`.

### ScaledPaper (live preview mechanism)
The preview renders the **full-size** `ProposalDoc` (design width **760px**) inside `ScaledPaper`, which measures the available column width and applies `transform: scale(min(1, avail/760))` with `transform-origin: top center`. It uses two `ResizeObserver`s (on frame + inner content) to recompute scale and the frame's height so the scaled doc isn't clipped. Frame `.pe-paper-frame`: `--paper-2` bg, 1px `--line` border, 5px radius, `var(--space-5)` padding. The inner `.paper` keeps `--shadow-card`.

> In a real React app, prefer a `ResizeObserver` hook or CSS container queries; the logic is in the `ScaledPaper` component — replicate the behavior, not necessarily the imperative refs.

### Fullscreen preview modal
`.pv-overlay` (fixed, `rgba(0,0,0,.32)` scrim, scrollable, `var(--space-7)` padding, fade-in 0.2s) > `.pv-modal` (max-width 880px) with a bar (`.pv-modal-bar`): white uppercase mono "Preview" title + two icon buttons (`.pv-close`): Export PDF (`ph-file-pdf` → `window.print()`) and Close (`ph-x`). Renders `ProposalDoc` at full size. Closes on scrim click or **Escape** (keydown listener).

---

## The proposal "paper" — `ProposalDoc` (`app/proposal-preview.jsx`)

Pure presentational component. Takes one `data` object and renders the document. Mirrors the app's `InvoiceDoc` paper but adds toggleable narrative sections.

### `docData` shape (what the editor passes)
```js
{
  number, title, status,            // 'draft'|'sent'|'accepted'|'declined'
  issue_date, valid_until,          // 'YYYY-MM-DD'
  preparedBy,                       // NOP.business  {name,line1,line2,email,…}
  preparedFor,                      // {name, contact, email, city}
  sections,                         // {intro:bool, scope:bool, …} the 7 keys
  introText, scopeText,
  objectives,                       // string[]
  deliverables,                     // string[]
  items,                            // [{description, note?, qty, rate, amount}]
  subtotal, taxRate, taxAmt, total, // numbers; taxRate is a fraction (0.07)
  showTax,                          // bool
  timeline,                         // [{phase, duration}]
  termsText,
}
```

### Document structure & key styles (design width 760px, white `.paper`)
- **`.pp-top`** — header row: brand lockup (`.pp-logo` 30px white mark on accent, `.pp-biz` business name, `.pp-tag` "Web Design & Consultation") on the left; document block (`.pp-doc`) on the right with `.pp-doc-word` "Proposal", `.pp-num` (mono number), and a **status badge**.
- **`.ps-title`** — the proposal title: **32px / 700**, `letter-spacing:-.02em`, line-height 1.12, color `#0B1B34` (ink navy), `max-width:24ch`, `text-wrap:balance`. (26px under 1080px.)
- **`.pp-divider`** — hairline rule.
- **`.pp-meta`** — three columns: *Prepared for* (client) · *Prepared by* (business) · *Date* + *Valid until*. Labels `.pp-meta-label` (mono uppercase, muted), values `.pp-meta-val`.
- **Sections** — only enabled **and non-empty** sections render. Each `.ps-sec` (margin-top `var(--space-7)`):
  - `.ps-sec-head` — a mono accent number `.ps-sec-n` (`01`, `02`, … re-counted over the *visible* blocks so numbering is always sequential), an `h2.ps-sec-title` (20px/700, `#0B1B34`), and a trailing hairline (`::after` flex rule).
  - `.ps-sec-body`:
    - **Introduction / Terms** → `.ps-text` paragraph (Terms uses `.ps-text--sm`). Body text color `#334155`, line-height 1.7, `max-width:68ch`.
    - **Scope** → optional overview `.ps-text` + numbered `.ps-list.ps-list--num` (mono index `.ps-list-n`).
    - **Deliverables** → `.ps-list.ps-list--check` (accent `ph-check-circle` per item).
    - **Investment** → `.pp-table` (Description/Qty/Rate/Amount; numeric cells `.pp-num-cell` right-aligned, amount bold `#0B1B34`) + right-aligned `.pp-totals` (Subtotal / Tax / **Total** `.pp-grand`).
    - **Timeline** → `.ps-timeline` vertical line with `.ps-mile` rows: an accent ring dot `.ps-mile-dot`, phase name `.ps-mile-phase`, duration `.ps-mile-dur` (mono, right).
    - **Acceptance** → a short line + `.ps-sign` (2-col grid): two `.ps-sign-line` rules with mono `.ps-sign-lbl` ("Signature · {client}", "Date").

### Status badge tones (`ProposalStatusBadge`)
Uses the design-system `Badge` with these tone mappings:
```
draft → gray "Draft" · sent → amber "Sent" · accepted → green "Accepted" · declined → red "Declined"
```

> **Note on paper colors:** the proposal paper intentionally uses fixed document colors (`#0B1B34` ink navy, `#334155`/`#475569`/`#64748B` slate body text, `#E2E8F0` rules, `#94A3B8` muted) rather than the app's UI ink ramp — it's a print document, so it reads as ink-on-white regardless of the app theme. Keep these literal in production.

---

## Screen 2 — Mobile proposal editor (`mobile/m-proposal.jsx`)

Mirrors the desktop feature in the app's mobile vocabulary (`m-*` classes, defined in `mobile/m-app.css`). Two exports: `ProposalEditorScreen` and `MProposalDoc`.

### Layout & behavior
- A scrollable screen with `ScreenHead` ("New proposal" + subtitle) and a stack of **`.m-form-card`** sections — same content as desktop: Proposal details, Prepared for, **Sections** toggle panel (`MSwitch` per row), then per-section cards (Introduction, Scope + Objectives, Deliverables, Investment with line items + tax, Timeline, Terms with quick-fill, Acceptance).
- Section cards only render when their toggle is on (mobile hides the whole card rather than dimming).
- **Line items** are stacked cards (`.m-li`) — description + a qty/rate row + computed amount — rather than a table. Same math as desktop.
- **Bottom action bar** (`.m-actionbar`): "Preview" (ghost) and "Save" (primary).
- **Preview** opens a bottom **`Sheet`** ("Preview") containing `MProposalDoc`, with an "Export PDF" button in the sheet footer that calls `window.print()`.
- `MProposalDoc` is the mobile-scaled proposal paper (`.m-paper` / `.m-pp-*` classes) — same section logic and ordering as the desktop `ProposalDoc`, smaller type.

### Mobile-specific helpers it relies on (already in the mobile app)
`window.ScreenHead`, `window.Sheet`, `window.MSwitch`, plus `.m-form-card`, `.m-field/.m-label/.m-input/.m-select/.m-textarea`, `.m-row2`, `.m-btn` variants, `.m-paper`/`.m-pp-*`, `.m-listrow`, `.m-li*`, `.m-toggle-row`, `.m-seg`, `.m-snips`. Mobile radii are softer (card 16px, input 12px, pill 999px).

---

## Export as PDF (both platforms)

Export is the **browser print path** — `window.print()`, with print CSS isolating the proposal paper. Desktop rules (`app/proposal.css`, `@media print`):
```css
@media print{
  .side, .topbar, .m-topbar, .pe-form, .pe-prev-bar, .back-link, .pv-overlay { display:none !important; }
  .main, .content { padding:0 !important; max-width:none !important; }
  .pe-grid { display:block !important; }
  .pe-preview { position:static !important; }
  .pe-paper-frame { background:#fff !important; border:none !important; padding:0 !important; border-radius:0 !important; }
  .pe-paper-scale { transform:none !important; width:100% !important; }  /* un-scale to full size */
  .paper { box-shadow:none !important; max-width:none !important; border-radius:0 !important; padding:0 !important; }
  body { background:#fff !important; }
  .ps-sec { break-inside:avoid; }   /* don't split a section across pages */
}
```
Mobile has an equivalent print block in `mobile/m-app.css` that isolates the open preview sheet's `.m-paper`.

> In a production app you may instead generate the PDF server-side or with a library (react-pdf, Puppeteer) for pixel control and headless export. If you keep the browser-print approach, the key requirements are: hide all chrome, un-scale the preview to full size, white background, and `break-inside:avoid` on each section.

---

## State (desktop `Editor`)

All local component state in the mock (replace with form state + persistence):
```
number (readonly)         title           status
issue (date)              valid (date)
clientKey                 client {name,contact,email,city}
sections {intro,scope,deliverables,investment,timeline,terms,acceptance} : bool
introText                 scopeText       objectives: string[]
deliverables: string[]
items: [{id,description,note,qty,rate}]   showTax: bool   taxRate: number
timeline: [{phase,duration}]              termsText
previewOpen: bool         savedFlash: bool (transient "Saved" affordance)
```
Derived (recomputed each render): `lineItems` (with `amount`), `subtotal`, `taxAmt`, `total`, and `docData` (the object handed to `ProposalDoc`).

**To productionize:** persist a proposal record (fields above + line items + section flags), generate the next `PROP-####` number server-side, replace `NOP.clients`/`NOP.business` with real queries, and make Save/Status changes write through. Add the proposal to the app's nav (`active="proposals"`) and list views as needed.

---

## Design tokens (quick reference)

These are shared with the rest of the app. Reproduce as CSS variables / theme.

**Fonts** — `--font-body: 'Space Grotesk'`, `--font-mono: 'Space Mono'` (tabular figures for ALL numbers/dates/counts), `--font-display: 'Space Grotesk'`. Google Fonts: `Space Grotesk` 400/500/600/700, `Space Mono` 400/700.

**Color (light)** — `--bg #f5f5f7` · `--card #fff` · `--surface #fafafa` · `--paper-2 #f0f0f2` · `--paper-3 #e8e8ec` · ink ramp `--ink #1a1a1a / --ink-2 #444 / --ink-3 #666 / --ink-4 #888` · `--line #eee` · `--line-soft #f3f3f3` · accent `--accent #2563EB / --accent-2 #1D4ED8 / --accent-tint rgba(37,99,235,.10)` · semantic `--green #15803d` `--red #b91c1c` `--amber #92400e` (each with .10 tint). Dark theme under `html[data-theme="dark"]`.

**Proposal-paper literals (keep as-is, not theme tokens):** ink navy `#0B1B34`, body slate `#334155` / `#475569` / `#64748B`, rules `#E2E8F0`, muted `#94A3B8`.

**Spacing** — `--space-1 4 / -2 8 / -3 12 / -4 16 / -5 20 / -6 24 / -7 28 / -8 32` (px).

**Radius** — `--radius-sm 3` · `--radius 5` (universal desktop) · `--radius-lg 8` · circle 50%. Mobile: card 16 / input 12 / pill 999.

**Type scale** — `--text-xs 10 / -sm 11 / -body 13 / -md 14 / -lg 15 / -xl 16 / -2xl 20 / -3xl 22 / -4xl 28 / -display 40` (px); weights 400/500/600/700.

**Shadows** — three-tier: `--shadow-card` (cards) → `--shadow-pop` (popovers) → `--shadow-float` (modals/panels). Don't nest.

---

## Components used (design system — `window.TaskmasterProDesignSystem_b94546`)

- **Button** — `variant="primary|ghost"`, `size="sm"`, optional Phosphor icon child. One primary action per screen.
- **Badge** — `tone="gray|amber|green|red"` — the proposal status pill (read-only).
- **AppShell** (app-local, `app/shell.jsx`) — page chrome: `active`, `title`, `description`, `actions`, `maxWidth`.
- **Switch** (app-local) — the section on/off toggles. Mobile: **MSwitch**.

**Icons:** Phosphor (regular webfont), `<i class="ph ph-{name}">`. Used here: `ph-arrows-out`, `ph-file-pdf`, `ph-floppy-disk`, `ph-check`, `ph-plus`, `ph-trash`, `ph-dots-six-vertical`, `ph-eye`, `ph-check-circle`, `ph-arrow-left`, `ph-x`.

## Assets
- **Brand mark** in the paper header: `numbers-on-paper-assets/mark/mark-white.svg` (white checkmark mark, shown 30px on an accent tile). Use the app's existing brand asset.
- No photography or other imagery.
