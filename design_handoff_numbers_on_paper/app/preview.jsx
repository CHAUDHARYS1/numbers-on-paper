/* ── Shared invoice "paper" document ──────────────────────
   Rendered by both the Editor (preview modal) and the
   standalone Preview page. Pure presentational component.
   ──────────────────────────────────────────────────────── */
const { Badge: _Badge } = window.TaskmasterProDesignSystem_b94546;

// Map a NOP invoice record → the document's data shape
window.buildInvoiceData = function (inv) {
  const NOP = window.NOP;
  const c = NOP.clients[inv.client] || {};
  const { subtotal, taxAmt, total } = NOP.computeTotals(inv);
  return {
    invoice_number: inv.invoice_number,
    issue_date: inv.issue_date,
    due_date: inv.due_date,
    status: NOP.effStatus(inv),
    billFrom: NOP.business,
    billTo: { name: c.name, contact: c.contact, email: c.email, city: c.city },
    items: inv.items,
    subtotal, taxRate: inv.tax || 0, taxAmt, total,
    showTax: (inv.tax || 0) > 0,
    notes: inv.notes || 'Payment is due within 14 days of the invoice date. Thank you for your business!',
  };
};

function InvoiceDoc({ data }) {
  const NOP = window.NOP;
  const { fmt, fmtDate } = NOP;
  const d = data || {};
  const items = d.items || [];
  const bf = d.billFrom || {};
  const bt = d.billTo || {};
  return (
    <div className="paper" id="invoice-paper">
      <div className="pp-top">
        <div className="pp-brand">
          <div className="pp-logo"><img src="numbers-on-paper-assets/mark/mark-white.svg" alt="" style={{ width: 30, height: 30 }} /></div>
          <div>
            <div className="pp-biz">{bf.name || 'SC Design & Consultation'}</div>
            <div className="pp-tag">Web Design &amp; Consultation</div>
          </div>
        </div>
        <div className="pp-doc">
          <div className="pp-doc-word">Invoice</div>
          <div className="pp-num">{d.invoice_number || 'INV-0000'}</div>
          <window.StatusBadge status={d.status || 'draft'} />
        </div>
      </div>

      <div className="pp-divider"></div>

      <div className="pp-meta">
        <div>
          <div className="pp-meta-label">Bill from</div>
          <div className="pp-meta-val">
            <strong>{bf.name}</strong><br />
            {bf.line1}<br />{bf.line2}
          </div>
        </div>
        <div>
          <div className="pp-meta-label">Bill to</div>
          <div className="pp-meta-val">
            <strong>{bt.name || '—'}</strong><br />
            {bt.contact ? <>{bt.contact}<br /></> : null}
            {bt.city}
          </div>
        </div>
        <div>
          <div className="pp-meta-label">Issued</div>
          <div className="pp-meta-val"><strong>{fmtDate(d.issue_date)}</strong></div>
          <div className="pp-meta-label" style={{ marginTop: 'var(--space-4)' }}>Due</div>
          <div className="pp-meta-val"><strong>{fmtDate(d.due_date)}</strong></div>
        </div>
      </div>

      <div className="pp-divider"></div>

      <table className="pp-table">
        <thead>
          <tr>
            <th style={{ width: '52%' }}>Description</th>
            <th className="pp-num-cell">Qty</th>
            <th className="pp-num-cell">Rate</th>
            <th className="pp-num-cell">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={4} style={{ color: '#94A3B8', padding: '20px 0' }}>No line items yet.</td></tr>
          ) : items.map((it, i) => (
            <tr key={i}>
              <td><div className="pp-item">{it.description || '—'}</div></td>
              <td className="pp-num-cell">{it.qty}</td>
              <td className="pp-num-cell">{fmt(it.rate)}</td>
              <td className="pp-num-cell" style={{ fontWeight: 700, color: '#0B1B34' }}>{fmt(it.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pp-foot">
        <div className="pp-contact">
          <div className="pp-meta-label">Contact</div>
          {bf.phone ? <div className="pp-contact-row"><span className="pp-contact-lbl">Phone</span><span>{bf.phone}</span></div> : null}
          {bf.email ? <div className="pp-contact-row"><span className="pp-contact-lbl">Email</span><span>{bf.email}</span></div> : null}
        </div>
        <div className="pp-totals">
          <div className="pp-total-row"><span>Subtotal</span><span>{fmt(d.subtotal)}</span></div>
          {d.showTax ? <div className="pp-total-row"><span>Tax ({Math.round((d.taxRate || 0) * 100)}%)</span><span>{fmt(d.taxAmt)}</span></div> : null}
          <div className="pp-total-row pp-grand"><span>Total due</span><span>{fmt(d.total)}</span></div>
        </div>
      </div>

      {d.notes ? (
        <div className="pp-notes">
          <div className="pp-meta-label">Notes &amp; terms</div>
          <p className="pp-notes-text">{d.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

window.InvoiceDoc = InvoiceDoc;
