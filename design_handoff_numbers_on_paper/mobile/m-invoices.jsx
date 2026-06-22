/* ── Invoices list + Invoice detail ───────────────────── */
const M_TABS = ['all', 'draft', 'unpaid', 'overdue', 'paid'];

function InvoicesScreen({ app }) {
  const NOP = window.NOP;
  const { effStatus } = NOP;
  const { useState, useMemo } = React;
  const invoices = app.invoices;

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(app.invoicesFilter || 'all');

  const counts = useMemo(() => {
    const c = { all: invoices.length, draft: 0, unpaid: 0, overdue: 0, paid: 0 };
    invoices.forEach(r => { c[effStatus(r)]++; });
    return c;
  }, [invoices]);

  const view = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter(r => {
      const es = effStatus(r);
      const matchTab = tab === 'all' || es === tab;
      const matchQ = !q || r.invoice_number.toLowerCase().includes(q) || r.clientName.toLowerCase().includes(q);
      return matchTab && matchQ;
    }).sort((a, b) => (b.issue_date || '0').localeCompare(a.issue_date || '0'));
  }, [invoices, search, tab]);

  const LABELS = { all: 'All', draft: 'Drafts', unpaid: 'Due', overdue: 'Overdue', paid: 'Paid' };

  return (
    <div className="m-scroll">
      <window.ScreenHead eyebrow="Invoices" title="Invoices"
        trailing={<button className="m-iconbtn m-iconbtn--accent" onClick={() => app.newInvoice()} aria-label="New invoice"><i className="ph ph-plus"></i></button>}>
        <div style={{ marginTop: 14 }}>
          <div className="m-search">
            <i className="ph ph-magnifying-glass"></i>
            <input placeholder="Search invoice # or client…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search" />
          </div>
        </div>
        <div className="m-chips" style={{ marginTop: 12 }}>
          {M_TABS.map(t => (
            <button key={t} className={'m-chip' + (tab === t ? ' m-chip--on' : '')} onClick={() => setTab(t)}>
              {LABELS[t]} <span className="ct">{counts[t]}</span>
            </button>
          ))}
        </div>
      </window.ScreenHead>

      <div className="m-body">
        {view.length === 0 ? (
          <div className="m-card">
            <div className="m-empty">
              <i className="ph ph-file-magnifying-glass"></i>
              <div className="m-empty-t">No invoices found</div>
              <div className="m-empty-s">Try a different search or filter.</div>
              <button className="m-btn m-btn--ghost" style={{ maxWidth: 200, margin: '0 auto' }} onClick={() => { setSearch(''); setTab('all'); }}>Clear filters</button>
            </div>
          </div>
        ) : (
          <div className="m-list m-card">
            {view.map(inv => <window.InvoiceRow key={inv.id} inv={inv} onClick={() => app.openInvoice(inv.id)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* build the document data shape from a NOP invoice record */
function buildDoc(inv) {
  const NOP = window.NOP;
  const c = NOP.clients[inv.client] || {};
  const { subtotal, taxAmt, total } = NOP.computeTotals(inv);
  return {
    invoice_number: inv.invoice_number, issue_date: inv.issue_date, due_date: inv.due_date,
    status: NOP.effStatus(inv), billFrom: NOP.business,
    billTo: { name: c.name, contact: c.contact, email: c.email, city: c.city },
    items: inv.items, subtotal, taxRate: inv.tax || 0, taxAmt, total,
    showTax: (inv.tax || 0) > 0,
    notes: inv.notes || 'Payment is due within 14 days of the invoice date. Thank you for your business!',
  };
}

function InvoiceDetailScreen({ app, id }) {
  const NOP = window.NOP;
  const { useState } = React;
  const inv = app.invoices.find(i => i.id === id) || app.invoices[0];
  const es = NOP.effStatus(inv);
  const data = buildDoc(inv);
  const [menuOpen, setMenuOpen] = useState(false);

  const [tone, label, bnClass, icon] = window.M_STATUS[es];
  const dleft = inv.due_date ? window.daysUntil(inv.due_date) : null;
  const bannerSub = es === 'paid' ? 'Paid in full'
    : es === 'overdue' ? `${Math.abs(dleft)} days past due`
    : es === 'unpaid' ? `Due in ${dleft} days · ${NOP.fmtDate(inv.due_date)}`
    : 'Not yet sent';

  const canPay = es === 'unpaid' || es === 'overdue';

  return (
    <React.Fragment>
      <div className="m-scroll">
        <window.ScreenHead
          onBack={app.pop}
          title={inv.invoice_number}
          sub={'Issued to ' + inv.clientName}
          trailing={<button className="m-iconbtn" onClick={() => setMenuOpen(true)} aria-label="More actions"><i className="ph ph-dots-three"></i></button>} />

        <div className="m-body m-body--flow">
          <div className={'m-banner ' + bnClass}>
            <i className={'ph ' + icon}></i>
            <div style={{ flex: 1 }}>
              <div className="m-banner-t">{label} · {NOP.fmt(inv.total)}</div>
              <div className="m-banner-s">{bannerSub}</div>
            </div>
          </div>

          <window.MInvoiceDoc data={data} />
        </div>
      </div>

      <div className="m-actionbar">
        <button className="m-btn m-btn--ghost" onClick={() => app.editInvoice(inv.id)}><i className="ph ph-pencil-simple"></i> Edit</button>
        {canPay
          ? <button className="m-btn m-btn--primary" onClick={() => app.markPaid(inv.id)}><i className="ph ph-check-circle"></i> Mark paid</button>
          : <button className="m-btn m-btn--primary" onClick={() => app.toast('Invoice shared')}><i className="ph ph-paper-plane-tilt"></i> Send</button>}
      </div>

      {menuOpen ? (
        <window.Sheet title="Invoice actions" onClose={() => setMenuOpen(false)}>
          <button className="m-menu-item" onClick={() => { setMenuOpen(false); app.toast('Link copied'); }}><i className="ph ph-link"></i> Copy share link</button>
          <button className="m-menu-item" onClick={() => { setMenuOpen(false); app.toast('Opening print…'); }}><i className="ph ph-printer"></i> Print / Save PDF</button>
          <button className="m-menu-item" onClick={() => { setMenuOpen(false); app.duplicateInvoice(inv.id); }}><i className="ph ph-copy"></i> Duplicate</button>
          <button className="m-menu-item m-menu-item--danger" onClick={() => { setMenuOpen(false); app.removeInvoice(inv.id); app.pop(); }}><i className="ph ph-trash"></i> Delete invoice</button>
        </window.Sheet>
      ) : null}
    </React.Fragment>
  );
}

Object.assign(window, { InvoicesScreen, InvoiceDetailScreen, buildDoc });
