/* ── Numbers on Paper — sample data (no backend) ──────────
   Stand-in for the Supabase `invoices` table. Shape mirrors the
   real app: invoice_number, bill_to, dates, status, line items,
   totals. "Today" is pinned to 2026-06-13 for due/overdue logic.
   ──────────────────────────────────────────────────────── */
(function () {
  const TODAY = '2026-06-13';

  const business = {
    name: 'SC Design & Consultation',
    email: 'hello@scdesign.co',
    line1: '120 Roberts Street, Suite 4',
    line2: 'Fargo, ND 58102',
    phone: '(701) 555-0148',
    owner: 'Shital Chaudhary',
  };

  const clients = {
    northwind: { name: 'Northwind Studio',  contact: 'Dana Whitlock', email: 'dana@northwind.studio', city: 'Minneapolis, MN' },
    bluepeak:  { name: 'Bluepeak Media',    contact: 'Marcus Reyes',  email: 'marcus@bluepeak.io',     city: 'Austin, TX' },
    harborview:{ name: 'Harborview Co.',    contact: 'Lena Park',     email: 'lena@harborview.co',     city: 'Seattle, WA' },
    lumen:     { name: 'Lumen Labs',        contact: 'Priya Nair',    email: 'priya@lumenlabs.dev',    city: 'Denver, CO' },
    cedar:     { name: 'Cedar & Co.',       contact: 'Tom Albright',  email: 'tom@cedarandco.com',     city: 'Portland, OR' },
    atlas:     { name: 'Atlas Freight',     contact: 'Rosa Méndez',   email: 'rosa@atlasfreight.com',  city: 'Chicago, IL' },
    verde:     { name: 'Verde Wellness',    contact: 'Aimee Lowell',  email: 'aimee@verde.health',     city: 'Boulder, CO' },
    meridian:  { name: 'Meridian Group',    contact: 'Karl Jensen',   email: 'karl@meridian.group',    city: 'Boston, MA' },
  };

  const li = (description, qty, rate) => ({ description, qty, rate, amount: +(qty * rate).toFixed(2) });

  // total is derived from line items + tax in computeTotals()
  const invoices = [
    { id:'i43', invoice_number:'INV-0043', client:'lumen',     issue_date:'2026-06-08', due_date:'2026-06-20', status:'unpaid', tax:0.07,
      items:[ li('Design retainer — June', 1, 2500), li('Component library updates', 1, 600) ] },
    { id:'i42', invoice_number:'INV-0042', client:'northwind', issue_date:'2026-06-02', due_date:'2026-06-16', status:'unpaid', tax:0.07,
      items:[ li('Brand identity system', 1, 3200), li('Logo motion package', 1, 1000) ] },
    { id:'i41', invoice_number:'INV-0041', client:'bluepeak',  issue_date:'2026-05-28', due_date:'2026-06-11', status:'paid',   tax:0.07,
      items:[ li('Landing page design', 1, 1800), li('Responsive build', 1, 950) ] },
    { id:'i40', invoice_number:'INV-0040', client:'harborview',issue_date:'2026-05-20', due_date:'2026-06-03', status:'unpaid', tax:0.07,
      items:[ li('Marketing site — 6 pages', 6, 850), li('CMS integration', 1, 1300) ] },
    { id:'i39', invoice_number:'INV-0039', client:'lumen',     issue_date:'2026-05-15', due_date:'2026-05-29', status:'paid',   tax:0.07,
      items:[ li('UX audit & report', 1, 1980) ] },
    { id:'i38', invoice_number:'INV-0038', client:'cedar',     issue_date:null,         due_date:null,         status:'draft',  tax:0.07,
      items:[ li('Packaging design — 4 SKUs', 4, 720), li('Print prep', 1, 270) ] },
    { id:'i37', invoice_number:'INV-0037', client:'atlas',     issue_date:'2026-05-02', due_date:'2026-05-16', status:'paid',   tax:0.07,
      items:[ li('Dashboard UI design', 1, 4200), li('Design tokens & handoff', 1, 1400) ] },
    { id:'i36', invoice_number:'INV-0036', client:'verde',     issue_date:'2026-04-28', due_date:'2026-05-12', status:'paid',   tax:0.07,
      items:[ li('Wellness app screens', 12, 200) ] },
    { id:'i35', invoice_number:'INV-0035', client:'meridian',  issue_date:null,         due_date:null,         status:'draft',  tax:0.07,
      items:[ li('Pitch deck — 18 slides', 18, 70) ] },
    { id:'i34', invoice_number:'INV-0034', client:'northwind', issue_date:'2026-04-10', due_date:'2026-04-24', status:'paid',   tax:0.07,
      items:[ li('Quarterly retainer — design', 1, 3800) ] },
  ];

  function computeTotals(inv) {
    const subtotal = inv.items.reduce((s, it) => s + it.amount, 0);
    const taxAmt = +(subtotal * (inv.tax || 0)).toFixed(2);
    const total = +(subtotal + taxAmt).toFixed(2);
    return { subtotal, taxAmt, total };
  }

  // attach derived total + overdue flag
  invoices.forEach(inv => {
    const { total } = computeTotals(inv);
    inv.total = total;
    inv.overdue = inv.status === 'unpaid' && inv.due_date && inv.due_date < TODAY;
    inv.clientName = clients[inv.client].name;
  });

  // effective status used for badges (unpaid + past due → overdue)
  function effStatus(inv) {
    if (inv.overdue) return 'overdue';
    return inv.status;
  }

  // ── Monthly collected revenue for the dashboard chart ──
  const revenue = [
    { m:'Jan', v:6200 }, { m:'Feb', v:8900 }, { m:'Mar', v:7400 },
    { m:'Apr', v:11300 }, { m:'May', v:9800 }, { m:'Jun', v:5550 },
  ];

  const fmt = n => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n || 0);
  const fmt0 = n => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(n || 0);
  const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
  const fmtDateShort = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' }) : '—';

  window.NOP = {
    TODAY, business, clients, invoices, revenue,
    computeTotals, effStatus, fmt, fmt0, fmtDate, fmtDateShort,
  };
})();
