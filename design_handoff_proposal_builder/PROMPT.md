# Claude Code Prompt — SC Design Proposal Builder

Paste this into Claude Code from the root of the target app. Drop the `design_handoff_proposal_builder/` folder into the repo first (or adjust the path below).

---

I'm adding a **proposal/quote builder** to this app for SC Design & Consultation, a web-design studio. A complete hi-fi design reference lives in `design_handoff_proposal_builder/` — read **README.md** first (it has every measurement, color, token, the data model, and the exact layout), then open `SC Design Proposal Template.html` in a browser to see the working behavior.

**Important:** the HTML file is a *design reference*, not code to copy. Recreate it in this app's existing stack and conventions — use our component library, state management, styling system, and routing. Match the visual design of the proposal document (the right-hand "paper") pixel-faithfully; the editor form can use our existing form components as long as it captures all the same fields.

## What to build
A single feature with two parts:
1. **Editor** — a form capturing all proposal fields (see the data model in the README): proposal details, client + sender info, overview narrative, repeatable scope groups, repeatable line items (name/sub/qty/rate), tax + discount, repeatable payment stages, and terms.
2. **Live document preview** — a branded, US-Letter proposal that renders from that data in real time and exports to PDF.

## Requirements
- **Match the design tokens and typography exactly** (colors, Helvetica Neue / SF Mono, sizes, spacing, radii, shadows) as documented in the README.
- **Live computation:** line amount = qty × rate; subtotal; discount; optional tax; **total = (subtotal − discount) + tax**; each payment stage $ = total × stage %. Currency = USD, `en-US`, 2 decimals. Show a soft warning when payment percentages don't sum to 100%.
- **Repeatable lists** with add/remove for scope groups, scope items, line items, payment stages, and terms.
- **PDF export** of the document (print stylesheet or a PDF lib — match our existing approach if we have one). Letter size, editor/chrome hidden, sensible page breaks (`break-inside: avoid` on sections, table rows, scope items, pay lines, terms).
- **Persistence:** in the prototype this is `localStorage`. In our app, **persist proposals to the backend** instead — a proposal should be a saved record with an auto-incrementing proposal number and a creation date. Wire create / save / load. (If we don't have a backend layer for this yet, stub a clean data service and tell me what's needed.)
- Use the brand SVGs in `design_handoff_proposal_builder/assets/` (logo + Chicago skyline). Move them into our assets pipeline.
- Keep the default template pre-populated with SC Design's real services (website design, development, maintenance retainer) as starter content for a new proposal.

## Before you start
1. Read the README fully and the HTML source.
2. Tell me which framework/components/state/persistence patterns in this repo you'll use, and propose where the feature, routes, and data model will live.
3. Flag anything in the design that conflicts with our existing patterns so we can decide together.

Then implement, and give me a short summary of the files you added/changed and how to run it.
