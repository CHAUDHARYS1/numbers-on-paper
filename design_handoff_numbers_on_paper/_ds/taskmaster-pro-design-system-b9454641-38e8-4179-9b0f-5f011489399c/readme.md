# Taskmaster Pro — Design System

A complete, branded design system for **Taskmaster Pro**, a real-time collaborative task-board app. It packages the product's typography, color, spacing, and effect tokens; its reusable React UI primitives; and high-fidelity recreations of the product's two surfaces — the **Kanban app** and the **marketing landing page** — so any agent can generate on-brand interfaces and assets.

> **Tagline:** *One board. Every workflow.*

---

## 1. Product context

Taskmaster Pro is a Trello-style **Kanban task manager** built around configurable workspaces. The core ideas:

- **Workspaces** group a board. Each ships from a **template** — *Job Application Tracker*, *Freelance Project Tracker*, or *Blank Board* — then everything (columns, colors, labels) is user-editable.
- **Columns** are fully configurable status lanes with their own color from a 10-hue palette (e.g. To Do · In Progress · In Review · Done).
- **Tasks** are rich cards: title, description, **priority** (Low → Urgent), workspace-scoped **labels**, **assignee**, **due date**, **checklist**, and **comments**. A colored left rule encodes state (green done · red overdue · amber due-soon).
- **Four views** over one dataset: Board, List, Calendar, Archive — plus a Dashboard and a "Writes" notes area.
- **Real-time collaboration**: live presence, editing locks, and instant sync.

The product voice is confident and plain-spoken; the visual language is calm, dense, and utilitarian — a productivity tool, not a toy.

### Sources used to build this system
- **GitHub repo:** [`CHAUDHARYS1/taskmaster-pro`](https://github.com/CHAUDHARYS1/taskmaster-pro) — the live React + Vite app. Tokens were lifted from `src/index.css`; component classes, the board, the task card, the auth screen, and the landing page were recreated from `src/components/**`, `src/pages/LandingPage.jsx`, and `src/pages/landing.css`. Brand assets came from `assets/brand-assets/`.
  - Explore this repo further to recreate additional surfaces (Calendar, Dashboard, Archive, Writes) with higher fidelity.

> ⚠️ **Note:** the repo's own `design-system/*.md` docs are a stale template from a different (loan/finance) app and do **not** describe Taskmaster Pro — they were ignored. This system was built from the *actual* product code.

---

## 2. Content fundamentals — how Taskmaster Pro writes

**Voice:** direct, warm, lightly editorial. Marketing leans on a serif display face for a confident, human headline voice; the product UI is terse and functional.

- **Casing:** Sentence case everywhere — buttons ("Add task", "Sign in", "Create your workspace"), titles, nav. **UPPERCASE** is reserved for tiny mono eyebrows, field labels, and status pills (`TO DO`, `DONE`, `3/8`).
- **Person:** Marketing speaks to **you** ("Your work, your board."). Product UI is impersonal and object-first ("Add a task…", "Unassigned", "No account yet?").
- **Headlines** use short, punchy two-part constructions with an italic emphasis on the second clause:
  - *"One board. **Every workflow.**"*
  - *"Start with purpose, **make it yours.**"*
  - *"Your work, your board. **Finally.**"*
- **Microcopy** is helpful and quiet: placeholders like "Add a task…", "Write a comment…", "e.g. Q3 Launch"; hints like "No credit card required."
- **Numbers & data** are always set in mono (IBM Plex Mono) with tabular figures — counts (`3/8`), dates (`Aug 28`, `2d ago`), versions, board labels.
- **Emoji:** **not** used in the product UI. The marketing page uses a few restrained geometric glyphs (⬛ ◈ ☑ ⚡ ⬡) as bento-icon accents and template-tab markers only — never in running copy. Prefer Phosphor icons over emoji.
- **Punctuation:** ellipses on placeholders; em-dashes for asides; arrows ("→") on primary CTAs to imply forward motion.
- **Tone checklist:** confident, not hypey · concrete, not abstract · respectful of the user's existing workflow ("not the other way around").

---

## 3. Visual foundations

### Color
- **Surfaces** form a warm-gray paper stack: `--bg #f5f5f7` (page) → `--card #fff` → `--surface #fafafa` (inset/headers) → `--paper-2/-3` (fills, tracks). Light is the default; a full **dark theme** is provided under `html[data-theme="dark"]`.
- **Ink** is a four-step neutral ramp (`--ink #1a1a1a` → `--ink-4 #888`) — never pure black.
- **One accent**: brand blue `--accent #2563EB` (hover `--accent-2 #1D4ED8`). Exactly **one primary action per screen**. Tints (`--accent-tint`) back focus rings and selected nav.
- **Semantic** colors are status-only — green/red/amber, each with a 10–12% tint companion. Never decorative.
- **Column/project hues**: a 10-color palette (indigo, blue, sky, teal, green, amber, red, pink, violet, gray) for column top-rules, project avatars, and workspace squares.
- **Priority ramp**: green → amber → orange → red for Low/Medium/High/Urgent.
- **User colors**: deterministic — `userColor(id) = hash % 6` — so a person reads the same color on every avatar, dot, and lock.
- **Imagery vibe:** the app ships almost no photography. The one rich surface — the marketing hero — uses a cool deep-blue diagonal gradient (`#0a1628 → #2563eb`) with soft radial glows. Overall palette is cool, flat, and high-contrast; no warmth, grain, or duotone.

### Typography
- **Plus Jakarta Sans** — all product UI and body (weights 400–800). Geometric, friendly, tight.
- **IBM Plex Mono** — every numeric, date, count, code snippet, and uppercase eyebrow. Tabular figures always on.
- **Instrument Serif** — marketing display headings only (Regular + Italic), set large with negative tracking (~−1.5px) for an editorial feel.
- **Scale is compact** — most body text is 13–14px; the UI is information-dense. Sizes run 10 → 40px (see `tokens/typography.css`).

### Spacing, radius & layout
- **8px-derived scale** with a 4px base step (`--space-1` 4px → `--space-8` 32px). Map every gap to the nearest token.
- **Radius is restrained**: **5px** is the universal card/button/pill/modal radius; 3px for tracks and small chips; 8px for special boxes; 50% for avatars. No big pill-y rounding.
- **Layout:** the app is a fixed sidebar (248px) + fluid board of horizontally-scrolling columns. The marketing page is a centered max-1100px column with full-bleed gradient hero and bento feature grid.

### Borders, shadows & elevation
- **Hairline borders** everywhere: `--line #eee` / `--line-soft #f3f3f3`. Cards use a 1px border *plus* a soft low shadow.
- **Three-tier shadow system** by elevation: `--shadow-card` (cards) → `--shadow-pop` (toasts, popovers) → `--shadow-float` (modals, side panels). Never nest shadowed elements.
- **No protection gradients or scrims** beyond the modal/panel backdrop (`rgba(0,0,0,0.32)`).

### Motion
- **Two signature curves:** `--ease-spring` (cubic-bezier(.34,1.56,.64,1)) for press/tap feedback and swatch pops; `--ease-enter` (cubic-bezier(.32,1,.45,1)) for side-panel and sheet entrances.
- **Press state:** buttons scale to `0.97`; hovers shift background/color, never both dramatically. Progress fills animate width over ~0.5s.
- **Entrances:** the task panel slides in from the right (0.28s) over a fading scrim. Respect `prefers-reduced-motion` (handled globally in `tokens/base.css`).

### Cards (the signature object)
A task card = white surface, 1px soft border, **3px colored left rule** (state), 5px radius, low shadow that lifts slightly on hover. Internally: optional priority chip, bold title, muted description, label chips, then a footer row with assignee pill, checklist/comment meta, and a mono due date.

### Hover / press / focus summary
| Interaction | Treatment |
|---|---|
| Button hover | darker fill (primary) / paper-2 fill (ghost) |
| Button press | `scale(0.97)`, spring easing |
| Card hover | shadow lifts, no movement |
| Nav/row hover | `--paper-2` background |
| Focus (keyboard) | 2px `--accent` outline, 2px offset; inputs get a 3px `--accent-tint` ring |
| Destructive hover | `--red-tint` background |

---

## 4. Iconography

- **Phosphor Icons** (`@phosphor-icons/react` in the app) is the product's icon system — regular weight, ~1.5px stroke, rounded terminals. In this design system the UI kits load Phosphor's **regular** webfont from CDN (`@phosphor-icons/web`) and use `<i class="ph ph-{name}">`.
  - Common glyphs in use: `ph-squares-four` (board), `ph-list`, `ph-calendar-blank`, `ph-chart-bar`, `ph-archive`, `ph-note-pencil`, `ph-bell`, `ph-magnifying-glass`, `ph-funnel`, `ph-plus`, `ph-x`, `ph-sign-out`, `ph-check-circle`.
  - To match the app's other weights, swap the CDN path to `@phosphor-icons/web@2.1.1/src/{bold,fill,duotone}/style.css`.
- **No emoji** in product UI. The marketing page uses a handful of geometric Unicode glyphs as decorative bento accents only.
- **Logo & mark** live in `assets/brand-assets/` — `logo-lockup.svg` (mark + wordmark, "Pro" in accent blue), `logo-mark.svg` (rounded-square white checkmark on accent — the app icon/favicon), plus PNG PWA icons. The mark is a 24%-radius rounded square; tint it white on accent for on-brand placements.
- **Arrows** as priority glyphs (↓ → ↑ !!) are set in mono, not icons.

> If you need an icon Phosphor doesn't cover, pick the nearest Phosphor glyph before reaching for another set — consistency of stroke and corner radius matters more than a perfect metaphor.

---

## 5. Index / manifest

### Root
- `styles.css` — **the single entry point** consumers link. An `@import` manifest only.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill front-matter wrapper for use in Claude Code.

### Tokens (`tokens/`)
`fonts.css` · `colors.css` · `typography.css` · `spacing.css` · `effects.css` · `base.css` (reset + element defaults). All reached from `styles.css`.

### Components (`components/`) — `window.TaskmasterProDesignSystem_*`
| Group | Components |
|---|---|
| `core/` | **Button**, **Avatar** (+`userColor`), **Badge**, **PriorityTag** (+`PRIORITIES`), **LabelChip**, **Field**, **Checkbox**, **SegmentedControl**, **ProgressBar**, **Modal** |
| `board/` | **TaskCard** (the signature object), **Column** |

Each component ships `.jsx` + `.d.ts` (props) + `.prompt.md` (usage) and is showcased in a `@dsCard` HTML in its directory. Component class styles live in `components/ui.css` (imported by `styles.css`).

### Foundation cards (`guidelines/`)
~16 specimen cards feeding the **Design System tab** — type (display/body/mono/scale), color (surfaces/ink/brand/semantic/hues/priority/users), spacing/radius/shadow, and brand (logo/mark).

### UI kits (`ui_kits/`)
- `app/` — the **Kanban app**: sign-in → board → task detail panel, with sidebar, header, and quick-add. Interactive (`index.html`). Recreated from the app source.
- `marketing/` — the **landing page**: hero with live board mockup, stats, switchable template showcase, bento features, testimonials, CTA. Recreated from `LandingPage.jsx` + `landing.css`.

---

## 6. How to use this system

1. **Link the styles:** `<link rel="stylesheet" href="styles.css">` — you now have every token, the font faces, and all component classes.
2. **Use components** in a Babel/React page by loading `_ds_bundle.js` and reading from `window.TaskmasterProDesignSystem_*` (run `check_design_system` for the exact namespace).
3. **Or hand-write HTML** with the `tm-*` classes from `components/ui.css`.
4. **Stay on-brand:** one accent, one primary action per screen, mono for numbers, 5px radius, colored left rule for task state, Phosphor for icons.

### Caveats
- Fonts are loaded from Google Fonts (Plus Jakarta Sans, IBM Plex Mono, Instrument Serif) and Phosphor from its CDN — all matches/exact to the live app, but they require a network connection. For offline/standalone use, bundle them locally.
- Only two of the app's surfaces are recreated (board + marketing). Calendar, Dashboard, Archive, and Writes are documented but not built — extend from the repo if you need them.
