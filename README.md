# Numbers on Paper

Free invoice generator for freelancers and small businesses.

**Stack:** React + Vite · Supabase (auth + Postgres) · CSS Modules · html2pdf.js · Netlify

---

## Quick start

```bash
npm install
cp .env.example .env   # fill in your Supabase URL and anon key
npm run dev
```

## Supabase setup

1. Create a new project at supabase.com
2. Copy your Project URL and anon key into `.env`
3. Run `supabase-schema.sql` in the Supabase SQL editor
4. Enable email auth in Supabase Dashboard > Authentication > Providers

## Deploy to Netlify

1. Push to GitHub
2. Connect repo to Netlify
3. Set build command: `npm run build`, publish dir: `dist`
4. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## Project structure

```
numbers-on-paper/
├── _design-system/        ← Read before writing any UI
│   ├── tokens.md          ← All colors, fonts, spacing
│   ├── components.md      ← Component markup patterns
│   └── patterns.md        ← Layout, spacing, do/don't rules
├── src/
│   ├── components/
│   │   ├── ui/            ← Button, Input, Badge, Card
│   │   ├── layout/        ← AppShell, PageHeader
│   │   └── invoice/       ← InvoicePreview
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── lib/
│   │   └── supabase.js
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── InvoicesPage.jsx
│   │   ├── InvoiceEditorPage.jsx
│   │   ├── InvoicePreviewPage.jsx
│   │   └── SettingsPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css          ← Design tokens + global reset
└── supabase-schema.sql    ← Run this in Supabase SQL editor
```

## For Claude Code

Before writing any UI code, read `_design-system/tokens.md`, then `components.md`, then `patterns.md`.

### Pending work (Claude Code to complete)
- [ ] Toast notification system
- [ ] Client autocomplete on invoice form
- [ ] Autosave draft every 30s
- [ ] Invoice number auto-override UX
- [ ] Logo image upload (Supabase Storage)
- [ ] PDF print styles (page breaks, margins)
- [ ] Mobile line item editing (collapsed rows)
- [ ] Skeleton loaders on all data pages
- [ ] Clients management page (`/clients`)
- [ ] Delete invoice with confirmation modal
- [ ] Duplicate invoice action
- [ ] Mark as paid quick action from invoice list
- [ ] Overdue detection (due_date < today && status = unpaid)
