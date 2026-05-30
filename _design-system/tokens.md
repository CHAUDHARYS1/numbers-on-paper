# Design Tokens — Numbers on Paper

## Brand
- App name: Numbers on Paper
- Tagline: "Invoicing that works as hard as you do."
- Business: SC Design and Consultation / Web Design & Consultation

## Color Palette

### Brand Blue (primary)
- `--color-brand-50:  #EBF3FC`
- `--color-brand-100: #C3DBFA`
- `--color-brand-200: #90BEF6`
- `--color-brand-400: #3B82F6`
- `--color-brand-600: #1D4ED8`
- `--color-brand-800: #1E3A8A`
- `--color-brand-900: #0F2260`

### Neutral (slate-based)
- `--color-neutral-0:   #FFFFFF`
- `--color-neutral-50:  #F8FAFC`
- `--color-neutral-100: #F1F5F9`
- `--color-neutral-200: #E2E8F0`
- `--color-neutral-300: #CBD5E1`
- `--color-neutral-400: #94A3B8`
- `--color-neutral-500: #64748B`
- `--color-neutral-600: #475569`
- `--color-neutral-700: #334155`
- `--color-neutral-800: #1E293B`
- `--color-neutral-900: #0F172A`

### Semantic
- `--color-success-bg:   #F0FDF4`
- `--color-success-text: #166534`
- `--color-success-border: #BBF7D0`
- `--color-warning-bg:   #FFFBEB`
- `--color-warning-text: #92400E`
- `--color-warning-border: #FDE68A`
- `--color-danger-bg:    #FEF2F2`
- `--color-danger-text:  #991B1B`
- `--color-danger-border: #FECACA`
- `--color-info-bg:      #EFF6FF`
- `--color-info-text:    #1E40AF`
- `--color-info-border:  #BFDBFE`

### Surface / Background
- `--color-bg-page:      #F8FAFC`   ← app background
- `--color-bg-surface:   #FFFFFF`   ← cards, panels
- `--color-bg-subtle:    #F1F5F9`   ← secondary surfaces, table rows
- `--color-bg-overlay:   rgba(15,23,42,0.5)` ← modals

### Text
- `--color-text-primary:   #0F172A`
- `--color-text-secondary: #475569`
- `--color-text-muted:     #94A3B8`
- `--color-text-inverse:   #FFFFFF`
- `--color-text-brand:     #1D4ED8`
- `--color-text-link:      #1D4ED8`

### Border
- `--color-border-default: #E2E8F0`
- `--color-border-strong:  #CBD5E1`
- `--color-border-brand:   #3B82F6`

## Typography

### Font Families
- `--font-display: 'DM Sans', sans-serif`       ← headings, logo, nav
- `--font-body:    'DM Sans', sans-serif`        ← body copy, UI
- `--font-mono:    'JetBrains Mono', monospace`  ← invoice numbers, amounts

### Scale
- `--text-xs:   11px / 1.5`
- `--text-sm:   13px / 1.5`
- `--text-base: 15px / 1.6`
- `--text-md:   17px / 1.5`
- `--text-lg:   20px / 1.4`
- `--text-xl:   24px / 1.3`
- `--text-2xl:  30px / 1.2`
- `--text-3xl:  38px / 1.15`
- `--text-4xl:  48px / 1.1`

### Weights
- Regular: 400
- Medium:  500
- Semibold: 600  ← use sparingly, headings only

## Spacing Scale
- `--space-1:  4px`
- `--space-2:  8px`
- `--space-3:  12px`
- `--space-4:  16px`
- `--space-5:  20px`
- `--space-6:  24px`
- `--space-8:  32px`
- `--space-10: 40px`
- `--space-12: 48px`
- `--space-16: 64px`
- `--space-20: 80px`

## Border Radius
- `--radius-sm:   4px`
- `--radius-md:   8px`
- `--radius-lg:   12px`
- `--radius-xl:   16px`
- `--radius-pill: 9999px`

## Shadows
- `--shadow-xs: 0 1px 2px rgba(15,23,42,0.06)`
- `--shadow-sm: 0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)`
- `--shadow-md: 0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.04)`
- `--shadow-lg: 0 10px 15px rgba(15,23,42,0.08), 0 4px 6px rgba(15,23,42,0.04)`
- `--shadow-xl: 0 20px 25px rgba(15,23,42,0.08), 0 8px 10px rgba(15,23,42,0.04)`

## Transitions
- `--transition-fast:   150ms ease`
- `--transition-base:   200ms ease`
- `--transition-slow:   300ms ease`

## Z-index
- `--z-dropdown: 100`
- `--z-sticky:   200`
- `--z-modal:    300`
- `--z-toast:    400`

## Layout
- Sidebar width: 240px (collapsed: 64px)
- Content max-width: 1200px
- App shell: sidebar + main content area
- Page padding: 32px (desktop), 16px (mobile)
