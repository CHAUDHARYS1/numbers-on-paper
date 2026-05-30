# Patterns — Numbers on Paper

## App Shell

```
┌─────────────────────────────────────────────┐
│  Sidebar (240px fixed)  │  Main Content      │
│  ┌──────────────────┐   │  ┌──────────────┐  │
│  │  Logo + App Name │   │  │ Page Header  │  │
│  │──────────────────│   │  │──────────────│  │
│  │  Nav Items       │   │  │ Page Content │  │
│  │  ...             │   │  │              │  │
│  │──────────────────│   │  │              │  │
│  │  User Profile    │   │  │              │  │
│  └──────────────────┘   │  └──────────────┘  │
└─────────────────────────────────────────────┘
```

- Sidebar: fixed left, full height, bg-surface, border-right border-default
- Main: margin-left 240px, bg-page, min-height 100vh
- Content area: max-width 1200px, mx-auto, px-8 py-8 (desktop), px-4 py-4 (mobile)
- On mobile (< 768px): sidebar becomes drawer, triggered by hamburger

## Page Layout

Standard page structure:
```jsx
<AppShell>
  <PageHeader title="..." action={...} />
  <div className="page-content">
    {/* cards, tables, forms */}
  </div>
</AppShell>
```

## Form Layout

- Single-column forms: max-width 640px
- Two-column grids for short paired fields (e.g. First Name / Last Name)
- Label always above input, never inline (except toggles)
- Group related fields in Cards with CardHeader labels
- Submit button: bottom-right of form, primary variant
- Cancel/Back: secondary, left of submit
- Unsaved changes: show warning before navigating away

## Data Table Page Pattern

```
PageHeader (title + "New Invoice" button)
──────────────────────────────────────────
Filter Bar (search input + status filter + date range)
──────────────────────────────────────────
Table (sortable columns, clickable rows)
──────────────────────────────────────────
Pagination (if > 25 rows)
```

- Clicking a table row → navigates to detail/edit view
- Bulk actions appear in a bar above table when rows are selected
- Empty state shown when no results

## Invoice Editor Pattern

Split view on desktop (≥ 1024px):
```
┌─────────────────────┬──────────────────────┐
│   Form (left)       │  Live Preview (right) │
│   60% width         │  40% width            │
│                     │  (scrollable)         │
└─────────────────────┴──────────────────────┘
```

On tablet/mobile: tabs — "Edit" | "Preview"

Form sections (in order):
1. Invoice meta (number, date, due date, status)
2. Bill From (pre-filled from user profile, editable)
3. Bill To (client info)
4. Line Items table
5. Totals (subtotal auto-calc, optional discount/tax)
6. Notes / Terms (optional, toggleable)

## Spacing Rules

- Between page sections: space-8 (32px)
- Between cards: space-6 (24px)
- Between form fields: space-5 (20px)
- Between label and input: space-1 (4px)
- Inside card body: p-6 (24px)
- Table cell padding: py-3 px-4

## Typography Hierarchy

- Page title: text-2xl, weight 600
- Section/card title: text-md, weight 600
- Label: text-sm, weight 500
- Body: text-base, weight 400
- Caption/hint: text-xs, weight 400, text-muted
- Amounts: font-mono, text-sm

## Responsive Breakpoints

- Mobile:  < 640px
- Tablet:  640px – 1023px
- Desktop: ≥ 1024px

## Do's

- Use cards to group related content
- Keep primary actions in the top-right (Page Header)
- Use monospace font for all currency and invoice numbers
- Show status badges everywhere a document is listed
- Provide inline validation (don't wait for submit)
- Autosave drafts to Supabase every 30s
- Keep sidebar nav to ≤ 6 items

## Don'ts

- Don't use more than 2 levels of nesting in nav
- Don't stack multiple primary buttons on one page
- Don't show empty table cells — use "—" as placeholder
- Don't use color alone to convey meaning (always pair with text/icon)
- Don't break out of the shell layout on interior pages
- Don't use full-bleed backgrounds inside the content area

## Loading States

- Page-level: skeleton loaders (match shape of content)
- Button-level: spinner in button, disable click
- Table: shimmer rows (3 placeholder rows)
- Invoice preview: opacity-50 + spinner overlay

## Error States

- Form validation: inline, below field, danger color
- API errors: toast notification + inline message where relevant
- Empty data: EmptyState component (never a blank page)
- 404: friendly page with back button

## Confirmation Patterns

- Destructive actions (delete): always require Modal confirmation
- Non-destructive (archive, send): toast with undo action (5s)
- Unsaved changes navigation: browser beforeunload + custom modal
