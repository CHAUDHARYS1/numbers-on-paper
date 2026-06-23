-- Projects seed data
-- Run this in your Supabase SQL editor AFTER running the migration.
-- Replace the user_id below with your actual user ID from auth.users.
-- To find it: SELECT id FROM auth.users LIMIT 5;

DO $$
DECLARE
  uid uuid := auth.uid();  -- uses your current session's user
BEGIN

INSERT INTO projects (user_id, name, client_name, status, description, start_date, budget, last_activity_at, reminders, notes) VALUES

(uid,
 'Brand identity system',
 'Bluepeak Media',
 'waiting',
 'Full rebrand including logo, wordmark, color system, and brand guidelines PDF. Deliverables: primary + secondary marks, usage guide, social kit.',
 '2026-05-01',
 8500,
 '2026-06-08T10:22:00Z',
 '[
   {"id":"r1","text":"Follow up on logo direction feedback","date":"2026-06-13","done":false},
   {"id":"r2","text":"Send final brand guidelines PDF","date":"2026-06-20","done":false}
 ]',
 '[
   {"id":"n1","text":"Kick-off call completed. Client prefers minimal, dark palette with a strong wordmark. Avoid illustration-heavy styles.","created_at":"2026-05-03T09:00:00Z"},
   {"id":"n2","text":"Sent 3 logo directions for review. Waiting on feedback.","created_at":"2026-06-08T10:22:00Z"}
 ]'
),

(uid,
 'Pitch deck design',
 'Meridian Group',
 'waiting',
 'Series A pitch deck — 18 slides. Cover, problem, solution, market size, traction, team, financials, ask. Slide masters + editable PPTX.',
 '2026-05-15',
 6000,
 '2026-06-02T14:10:00Z',
 '[
   {"id":"r3","text":"Nudge Karl for slide copy & financials","date":"2026-06-15","done":false}
 ]',
 '[
   {"id":"n3","text":"Engagement kicked off. Karl is handling copy, I handle layout and design.","created_at":"2026-05-15T11:00:00Z"},
   {"id":"n4","text":"Draft deck (no financials) sent for review. Awaiting slide 14-16 copy.","created_at":"2026-06-02T14:10:00Z"}
 ]'
),

(uid,
 'Marketing site redesign',
 'Northwind Studio',
 'active',
 '8-page marketing site rebuild on the new design system, plus a logo motion package. Phased: discovery → design → build.',
 '2026-05-20',
 12000,
 '2026-06-11T09:45:00Z',
 '[
   {"id":"r4","text":"Send homepage hi-fi design for review","date":"2026-06-18","done":false},
   {"id":"r5","text":"Kick off responsive build once design is signed off","date":"2026-06-26","done":false},
   {"id":"r6","text":"Share project roadmap & timeline","date":"2026-05-20","done":true}
 ]',
 '[
   {"id":"n5","text":"Engagement kicked off. Deposit invoice INV-0042 sent.","created_at":"2026-05-21T08:00:00Z"},
   {"id":"n6","text":"Discovery workshop done — 5 stakeholder interviews. Audit deck shared.","created_at":"2026-06-02T10:00:00Z"},
   {"id":"n7","text":"Dana approved the wireframes. Moving to high-fidelity design this week.","created_at":"2026-06-11T09:45:00Z"}
 ]'
),

(uid,
 'Website proposal — redesign & brand',
 'Northwind Studio',
 'active',
 'Scope and cost estimate for a full website + brand refresh. Includes discovery, UX audit, design, and dev handoff.',
 '2026-06-01',
 2500,
 '2026-06-13T16:30:00Z',
 '[
   {"id":"r7","text":"Follow up on proposal PROP-0007 if unsigned by end of week","date":"2026-06-18","done":false}
 ]',
 '[
   {"id":"n8","text":"Proposal sent. Covers brand + site in two phases. Awaiting signature.","created_at":"2026-06-13T16:30:00Z"}
 ]'
),

(uid,
 'Quarterly design retainer',
 'Lumen Labs',
 'active',
 'Monthly retainer — 20 hrs/mo. Covers sprint collateral, product illustrations, and ad creative. Invoiced on the 1st.',
 '2026-04-01',
 4000,
 '2026-06-10T11:00:00Z',
 '[
   {"id":"r8","text":"Send June retainer summary + log hours","date":"2026-06-20","done":false}
 ]',
 '[
   {"id":"n9","text":"Retainer renewed for Q2. Rate unchanged.","created_at":"2026-04-01T09:00:00Z"},
   {"id":"n10","text":"April hours: 19.5 hrs. May hours: 21 hrs (1 hr over, waived).","created_at":"2026-06-10T11:00:00Z"}
 ]'
),

(uid,
 'Packaging design — 4 SKUs',
 'Cedar & Co.',
 'on-hold',
 'Sustainable packaging for 4 product lines. Dielines provided by printer. Needs final product names before design can continue.',
 '2026-05-10',
 5500,
 '2026-05-16T13:00:00Z',
 '[
   {"id":"r9","text":"Check in — are product names finalized?","date":"2026-07-01","done":false}
 ]',
 '[
   {"id":"n11","text":"Initial concepts approved for SKUs 1 & 2. SKUs 3 & 4 on hold pending naming decision from client marketing team.","created_at":"2026-05-16T13:00:00Z"}
 ]'
),

(uid,
 'Dashboard UI engagement',
 'Atlas Freight',
 'completed',
 'Internal ops dashboard — shipment tracking, driver management, and reporting views. Delivered as Figma + dev-ready spec.',
 '2026-03-01',
 9200,
 '2026-05-18T10:00:00Z',
 '[]',
 '[
   {"id":"n12","text":"Project kicked off. 3-week sprint with weekly check-ins.","created_at":"2026-03-01T09:00:00Z"},
   {"id":"n13","text":"All screens delivered and approved. Dev handoff package sent. Project closed.","created_at":"2026-05-18T10:00:00Z"}
 ]'
),

(uid,
 'Wellness app screens',
 'Verde Wellness',
 'completed',
 'iOS app UI — onboarding, home, habit tracker, and journal screens. 24 screens total, delivered with component library.',
 '2026-02-15',
 7800,
 '2026-04-29T15:00:00Z',
 '[]',
 '[
   {"id":"n14","text":"Kicked off. Mood board approved in week 1.","created_at":"2026-02-15T09:00:00Z"},
   {"id":"n15","text":"All screens signed off. Final Figma file + export package delivered. Invoice settled.","created_at":"2026-04-29T15:00:00Z"}
 ]'
);

END $$;
