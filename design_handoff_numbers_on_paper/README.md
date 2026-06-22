# Handoff: Numbers on Paper — Invoicing App

## Overview

**Numbers on Paper** is a small-business **invoicing app** — create, send, and track invoices, manage clients, and see what you've billed vs. what's still outstanding. This package contains a **complete, high-fidelity design** for the product across two surfaces:

- **Desktop web app** — sidebar + topbar shell with Dashboard, Invoices, Clients, Invoice view, Invoice editor, Settings, plus a marketing Landing page and Login / Sign-up.
- **Mobile app** — a native-feeling phone UI (home, invoices, clients, invoice detail, invoice editor, settings, login) in a single file.
- **Brand / logo pack** — wordmark, mark, app icon, favicon in SVG + PNG.

> Tagline / voice: confident, plain-spoken, utilitarian. The numeric, money-centric nature of the product is expressed by setting **every number, date, and amount in a monospace face with tabular figures**.

---

## About the Design Files

The files in this bundle are **design references created in HTML/CSS/React-via-Babel** — prototypes that show the intended look, layout, and behavior. **They are not production code to ship directly.** They render in a browser using in-browser Babel, a `window.NOP` global for mock data, and a bundled design-system JS file.

**The task is to recreate these designs in the target codebase's real environment** (e.g. a Vite + React app, Next.js, etc.) using its established patterns — real components, a real router, a real data layer (the original product context is a React + Supabase app). If no codebase exists yet, React + Vite is the natural choice and matches how these were authored. Treat the HTML as the **visual + interaction spec**, not as the file structure to copy.

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, radii, shadows, copy, and interactions are all specified. Recreate the UI pixel-accurately using the codebase's component library, then wire it to real data. Every value you need is enumerated in **Design Tokens** below.

---

## Design Tokens

These designs are built on a shared token layer (the "Taskmaster Pro" token set) with **the font families overridden to this project's brand type**. Reproduce these as CSS variables (or your framework's theme equivalent). Light theme is default; a dark theme is provided.

### Brand fonts (THIS project's identity — overrides the base type)
```css
--font-body:    'Space Grotesk', -apple-system, system-ui, sans-serif;
--font-mono:    'Space Mono', ui-monospace, 'SF Mono', monospace;
--font-display: 'Space Grotesk', sans-serif;
```
Loaded from Google Fonts:
`Space Grotesk` weights 400/500/600/700 · `Space Mono` weights 400/700.
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```
**Rule:** Space Mono (tabular figures) for ALL numbers, currency, dates, counts, invoice numbers, and uppercase mono eyebrows/labels. Space Grotesk for everything else.

### Colors — light (default)
```css
/* Surfaces — warm-gray paper stack, lightest → darkest */
--bg:        #f5f5f7;   /* page background */
--card:      #ffffff;   /* cards, sidebar, inputs */
--surface:   #fafafa;   /* inset boxes, table + column headers */
--paper-2:   #f0f0f2;   /* pill fills, hover, count badges */
--paper-3:   #e8e8ec;   /* track fills (switch off-state) */

/* Ink — four-step text ramp (never pure black) */
--ink:       #1a1a1a;   /* primary text, headings */
--ink-2:     #444444;   /* secondary text, table cells */
--ink-3:     #666666;   /* tertiary text, captions */
--ink-4:     #888888;   /* placeholder, meta, disabled, chevrons */

/* Borders — hairlines */
--line:      #eeeeee;   /* dividers, input borders */
--line-soft: #f3f3f3;   /* row separators inside cards, card border */

/* Brand accent — ONE accent, ONE primary action per screen */
--accent:       #2563EB;
--accent-2:     #1D4ED8;                 /* hover / pressed */
--accent-tint:  rgba(37, 99, 235, 0.10); /* tinted fills, focus ring */

/* Semantic — status only, never decoration */
--green:      #15803d;  --green-tint: rgba(21,128,61,0.10);   /* Paid */
--red:        #b91c1c;  --red-tint:   rgba(185,28,28,0.10);   /* Overdue / danger */
--amber:      #92400e;  --amber-tint: rgba(146,64,14,0.10);   /* Due / draft warn */
```

> **Note on brand-asset color:** the logo pack defines a slightly brighter "Signal Blue" `#0A5FFF` for the mark/dot and `#0047CC` for the app-icon gradient base, with `#0B1B34` ink navy. The *running UI* uses `--accent #2563EB` as its interactive blue. Keep both: brand blue for the logo/marks, `--accent` for interactive UI.

### Colors — dark theme (`html[data-theme="dark"]`)
```css
--bg:#111113; --card:#1c1c21; --surface:#161619; --paper-2:#252530; --paper-3:#2e2e3a;
--ink:#ededf0; --ink-2:#c8c8cc; --ink-3:#88889a; --ink-4:#55555a;
--line:#2a2a35; --line-soft:#222230;
--accent:#4f8ef7; --accent-2:#3b7ef4; --accent-tint:rgba(79,142,247,0.15);
--green:#4ade80; --red:#f87171; --amber:#fbbf24; (each with 0.12 tint)
```

### Spacing scale (8px-derived, 4px base step)
```css
--space-1:4px;  --space-2:8px;  --space-3:12px; --space-4:16px;
--space-5:20px; --space-6:24px; --space-7:28px; --space-8:32px;
```

### Radius
```css
--radius-sm:3px;   /* tracks, small chips, dots */
--radius:5px;      /* UNIVERSAL: cards, buttons, inputs, pills, modals (desktop) */
--radius-lg:8px;   /* special boxes */
--radius-circle:50%; /* avatars */
```
**Mobile uses softer radii** (defined in `mobile/m-app.css`): card 16px, tile 14px, input 12px, pill 999px.

### Typography scale (compact — most body text is 13–14px)
```css
--text-xs:10px;  --text-sm:11px;  --text-body:13px; --text-md:14px;
--text-lg:15px;  --text-xl:16px;  --text-2xl:20px;  --text-3xl:22px;
--text-4xl:28px; --text-display:40px;
/* weights */ 400 regular · 500 medium · 600 semibold · 700 bold
/* line-heights */ tight 1.15 · snug 1.45 · body 1.6
```

### Shadows / effects
Three-tier elevation (from the base `tokens/effects.css`):
- `--shadow-card` — cards (1px border + soft low shadow). Lifts slightly on hover, **no movement**.
- `--shadow-pop` — popovers, toasts.
- `--shadow-float` — modals, side panels, bottom sheets, the invoice "paper".

### Motion
```css
--ease-spring: cubic-bezier(.34,1.56,.64,1);  /* press/tap, switch thumb, swatch pops */
--ease-enter:  cubic-bezier(.32,1,.45,1);     /* side-panel / sheet / screen entrances */
```
- Button press: `transform: scale(0.97)` (desktop) / `0.98` (mobile), spring easing.
- Card hover: shadow lifts only.
- Focus (keyboard): inputs get `border-color:var(--accent)` + `box-shadow:0 0 0 3px var(--accent-tint)`.
- Respect `prefers-reduced-motion`.

### Iconography
**Phosphor Icons**, regular weight, via `<i class="ph ph-{name}">`.
```html
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">
```
Glyphs in use: `ph-squares-four` (dashboard), `ph-file-text` (invoices), `ph-users-three` (clients), `ph-gear-six` (settings), `ph-magnifying-glass`, `ph-plus`, `ph-arrow-left`, `ph-sign-out`, `ph-list`, `ph-x`, `ph-check-circle`, `ph-clock-countdown`, `ph-trend-up`, `ph-file-dashed`, `ph-caret-down`. **No emoji** in the UI.

---

## CSS Architecture (how the references are organized)

Token CSS is loaded first, then layered app CSS overrides only the fonts. Recreate this layering or fold it into your design system.

| File | Role |
|---|---|
| `tokens/*.css` (from the bundled design system) | colors, spacing, typography, effects, base reset |
| `app/app.css` | **font override** + desktop app shell (sidebar, topbar, cards, data table, mobile drawer) |
| `app/forms.css` | fields, switches, line-item editor, totals, filter bar, settings rows, the printable invoice "paper" |
| `app/auth.css` | split-screen login / sign-up (gradient brand panel + form card) |
| `app/landing.css` / `app/marketing.css` | marketing landing page |
| `mobile/m-app.css` | the entire mobile design language (own component set, prefixed `m-`) |

Shared mock data + helpers live in `app/data.js` as `window.NOP` (business, clients, invoices, `fmt`/`fmt0` currency formatters, `fmtDate`, `computeTotals`, `effStatus`). "Today" is pinned to **2026-06-13** so due/overdue logic is deterministic. Replace this with real data fetching.

Reusable React primitives (`Avatar`, `Badge`, `Button`, `SegmentedControl`, plus `userColor`) come from the design-system bundle on `window.TaskmasterProDesignSystem_b94546`. Map these to your component library.

---

## Screens / Views

### Shell (every desktop app page) — `app/shell.jsx`
- **Layout:** fixed **248px sidebar** (`--card` bg, right hairline border, sticky full-height) + fluid main column. Main has a **sticky, blurred topbar** (`backdrop-filter: blur(8px)`, 86%-opaque `--bg`) with page title (`--text-4xl`, weight 700, `-0.02em` tracking) + description, and right-aligned actions. Content is centered with a per-page `maxWidth` (1080 default; 1120 Invoices/Clients; 920 Invoice; 820 Editor; 760 Settings).
- **Sidebar:** logo lockup (24px tall) → nav list → user footer card (Avatar + name + business name + sign-out icon).
- **Nav items:** icon + label, `--text-md` medium, `--ink-3`; hover → `--paper-2` bg + `--ink`; **active → `--accent-tint` bg + `--accent` text, semibold**. Order: Dashboard · Invoices · Clients · Settings.
- **Responsive (≤880px):** sidebar hides; a **mobile topbar** (burger + logo) appears; nav becomes a **left drawer** (272px, slides in over a `rgba(0,0,0,.42)` scrim, `--ease-enter`). Topbar de-stickies and stacks; dense tables scroll horizontally (`min-width:640px` inside `.tbl-wrap`).

### 1. Dashboard — `Dashboard.html`
Purpose: at-a-glance read of billed vs. incoming.
- **4 stat cards** (`repeat(4,1fr)`, → 2-col ≤1080px → 1-col ≤560px). Each: rounded-square tinted icon (36px), optional mono count, big mono value (`30px`/700), label. Tones: Outstanding (amber), Collected (green), Total invoiced (accent), Drafts (gray).
- **Two-column row** (`1.7fr 1fr`): **Revenue chart** card (CSS flex bar chart, bars `--accent`, the current/in-progress month rendered as a dashed tinted bar; mono value above each bar, mono month label below; legend; a `6 mo / 12 mo` SegmentedControl) + **Outstanding rail** card (list of unpaid invoices sorted by due date, colored dot = overdue red / due-soon amber / else gray, client name + mono "Due in Nd · INV-####" + mono amount; footer total).
- **Recent invoices** card: full-width data table (Invoice # / Client / Issued / Status badge / Amount). Rows clickable → `Invoice.html?id=`.

### 2. Invoices — `Invoices.html`
Purpose: manage and track all invoices.
- **Filter bar:** search box (flex:1) + segmented status tabs (All / Draft / Due / Overdue / Paid) styled as `.filter-tabs`.
- **Data table** with sortable headers (`.th-sort`, active sort shows accent caret): Invoice # · Client (avatar + name) · Issued · Due · Status badge · Amount · row actions (view link, mark-paid pill `.act-paid`, icon buttons; danger hover = red tint).
- Empty state component for filtered-to-zero.

### 3. Clients — `Clients.html`
Purpose: everyone you bill, with history at a glance.
- **Summary stats** strip (clients count, etc.).
- Client list/table: avatar (deterministic `userColor`), name, contact, email, city, invoice count + total billed (mono).

### 4. Invoice view — `Invoice.html?id=`
Purpose: read-only rendered invoice + actions (download/print, edit, mark paid).
- Back link → Invoices. Renders the **invoice "paper"** (`app/forms.css` `.paper`): max-820px white sheet, `--shadow-float`, 56px padding. Header = brand lockup (accent rounded-square logo + business name in ink-navy `#0B1B34`) + right-aligned mono doc number. Meta grid (Billed to / Issued / Due). Line-item table with a 2px ink-navy header rule. Totals block (subtotal, tax, **grand total in accent**). Notes.
- **Print stylesheet** hides all chrome and prints only the paper full-bleed.

### 5. Invoice editor — `InvoiceEditor.html` (and `?id=` to edit)
Purpose: build/edit an invoice.
- Back link + editor top bar with actions (Preview, Save). Title is "New invoice" or "Edit invoice".
- **Form sections** (`.stack`/`.row2`/`.row3` grids, collapse to 1-col ≤680px): business/client fields (`.fld` labeled inputs — mono uppercase labels, `--surface` inputs that turn `--card` + accent ring on focus), dates.
- **Line-item editor** (`.li-table`): grid header (Item / Description / Qty / Rate / Amount / delete), editable inline cells (transparent until hover→surface, focus→accent ring), mono right-aligned numbers, add-row button, quick-fill snippet chips.
- **Totals** block right-aligned (subtotal, optional tax/discount toggles, grand total `--text-2xl`/accent).

### 6. Settings — `Settings.html`
Purpose: business profile, defaults, account.
- Sectioned cards (max 760px): logo upload (`.logo-preview` dashed box + upload button), business profile fields, default tax/terms, toggle rows using the **iOS-style `.switch`** (accent track when on, spring thumb), security/MFA badge, and a **danger zone** card (red-tinted border, destructive action).

### 7. Landing page — `Landing Page.html` (`app/landing.css`)
Marketing site: hero, feature sections, CTA. Uses Space Grotesk display + the deep-blue gradient brand panel language (`#0a1628 → #2563eb`). Headlines use short two-part constructions with an emphasized second clause.

### 8. Auth — `Login.html` / `Signup.html` (`app/auth.css`)
Split screen: **left brand panel** (gradient `#0a1628 → #14306b → #2563eb`, radial glows, headline with `<em>` accent-blue emphasis, feature list with Phosphor check icons, italic tagline) + **right form card** (max 404px: badge, title, fields, password show/hide eye, remember/forgot row, error state, OR divider, Google OAuth button, switch-to-other-auth link, legal). **≤880px:** left panel hides, a small logo appears above the form.

### 9. Mobile app — `Numbers on Paper Mobile.html` (`mobile/m-app.css` + `mobile/m-*.jsx`)
A single-file, multi-screen **native-feeling phone app** (own component system, prefixed `m-`). Renders in a centered 440px "device" column (rounded 28px on desktop ≥480px, full-bleed on phones), with a faux status bar, scrolling viewport, and a **bottom tab bar** with a center FAB.
- **Screens:** Home (`m-home`), Invoices (`m-invoices`), Clients (`m-clients`), Invoice detail, Invoice editor (`m-editor`), Settings (`m-settings`), Login.
- **Signature elements:** dark gradient **hero outstanding card** (`#1f2b44 → #101a2e`, 42px mono value), 2-col **stat tiles**, mini bar chart, **list rows** (avatar + title + mono meta + amount + chevron), horizontally-scrolling **filter chips** (active = ink fill), **bottom sheets** (drag-grip, slide up `--ease-enter`), **action bar** for detail/editor, iOS **switch** + **segmented control**, **toast**, status **banners**, and a mobile **invoice paper**. Tab bar uses `backdrop-filter` blur; FAB is a 54px accent rounded-square that floats above the bar.
- Radii are softer than desktop (16/14/12px). Buttons are full-height 50px (`.m-btn`).

### 10. Brand / logo — `Numbers on Paper Logo.html`, `Numbers on Paper Logo Pack.html`
Specimen pages for the identity. See **Assets**.

---

## Interactions & Behavior

- **Navigation:** sidebar/tab links route between pages. Table rows and list rows navigate to `Invoice.html?id=` (web) or push the detail screen (mobile). "New invoice" → editor.
- **Status logic** (`app/data.js`): an unpaid invoice past `due_date` (vs. pinned today `2026-06-13`) becomes **Overdue**. Status → badge tone: paid→green "Paid", unpaid→amber "Due", overdue→red "Overdue", draft→gray "Draft".
- **Currency / dates:** always formatted via `Intl.NumberFormat` USD (`fmt` full, `fmt0` no-cents) and short month-day-year dates, set in Space Mono with tabular figures.
- **Filtering / sorting:** Invoices page filters by status tab + search; sortable columns toggle an accent caret.
- **Editor:** line items recompute subtotal/tax/total live (`computeTotals`: `total = subtotal + subtotal*tax`, tax default 0.07). Add/remove rows; delete disabled when only one row.
- **Forms / focus:** inputs show accent border + 3px tint ring on focus. Switches animate the thumb with `--ease-spring`.
- **Mobile:** screen entrances animate (`push` slide-in for drilled screens, `fade` for tab switches); bottom sheets slide up over a scrim; toasts auto-show on actions (e.g. mark paid). Press states scale slightly.
- **Print:** `Invoice.html` print CSS outputs only the invoice paper.

## State Management

State needed when wiring to a real backend:
- **Auth/session** (current user/business), used by the sidebar footer and Settings.
- **Invoices collection** — each: `invoice_number`, `client`, `issue_date`, `due_date`, `status` (draft/unpaid/paid), `tax`, `items[]` (`description`, `qty`, `rate`, `amount`); derived `total`, `overdue`, `clientName`. (Original product persists these in Supabase.)
- **Clients collection** — name, contact, email, city; derived invoice count + total billed.
- **Editor draft state** — line items, totals, dates, optional tax/discount toggles; save/preview.
- **UI state** — active filter tab, sort column/direction, search query, mobile drawer/sheet open, settings toggles.
- **Revenue series** for the dashboard chart (monthly collected totals).

---

## Assets

All in `numbers-on-paper-assets/` (see its `README.txt` for full usage):
- `lockup/` — horizontal logo lockup, SVG (font embedded) + reversed + PNG. Used in sidebar, drawer, auth, landing (height ~24–26px).
- `mark/` — the geometric lowercase "n" + square dot mark (primary / black / white / blue), SVG + 512px PNG.
- `app-icon/` — blue-gradient rounded-square app icon (SVG + 1024/512/180 PNG).
- `favicon/` — `.ico` + SVG + 16/32/48/64 PNG.
- **Brand colors:** Signal Blue `#0A5FFF`, Blue Deep `#0047CC`, Ink Navy `#0B1B34`, Paper `#FFFFFF`. Clear space = height of the dot; min mark size 16px; don't recolor the dot.

Fonts: Google Fonts (Space Grotesk, Space Mono). Icons: Phosphor web font (CDN). For offline/production, self-host both.

---

## Files in this bundle

**Desktop pages (HTML):** `Dashboard.html`, `Invoices.html`, `Invoice.html`, `InvoiceEditor.html`, `Clients.html`, `Settings.html`, `Login.html`, `Signup.html`, `Landing Page.html`
**Mobile:** `Numbers on Paper Mobile.html`
**Brand specimens:** `Numbers on Paper Logo.html`, `Numbers on Paper Logo Pack.html`
**Shared logic / styles:**
- `app/` — `app.css`, `forms.css`, `auth.css`, `landing.css`, `marketing.css`, `shell.jsx`, `data.js`, `auth.jsx`, `preview.jsx`
- `mobile/` — `m-app.css`, `m-home.jsx`, `m-invoices.jsx`, `m-clients.jsx`, `m-editor.jsx`, `m-settings.jsx`, `m-shared.jsx`
- `numbers-on-paper-assets/` — full brand asset pack
- `_ds/taskmaster-pro-design-system-…/` — the design-system token CSS + component bundle the pages load (the source of every `var(--*)` token value). Reference for exact values; map components to your own library.

To preview a page as the designers intended, open any HTML file in a browser (it loads React + Babel from CDN). To **build**, follow this README's tokens and screen specs in your real framework.
