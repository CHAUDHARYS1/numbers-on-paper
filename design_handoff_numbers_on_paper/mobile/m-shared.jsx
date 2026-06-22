/* ── Numbers on Paper Mobile — shared bits ────────────────
   Helpers, status badge, screen header, list rows, switch,
   bottom sheet, mini chart, and the mobile invoice document.
   Everything is exported to window for the screen files.
   ──────────────────────────────────────────────────────── */
const { Avatar, Badge } = window.TaskmasterProDesignSystem_b94546;
const NOP = window.NOP;

/* status → [badge tone, label, banner class, icon] */
const M_STATUS = {
  paid:    ['green', 'Paid',    'bn-green', 'ph-check-circle'],
  unpaid:  ['amber', 'Due',     'bn-amber', 'ph-clock'],
  overdue: ['red',   'Overdue', 'bn-red',   'ph-warning-circle'],
  draft:   ['gray',  'Draft',   'bn-gray',  'ph-file-dashed'],
};

function MStatusBadge({ status }) {
  const [tone, label] = M_STATUS[status] || ['gray', '—'];
  return <Badge tone={tone}>{label}</Badge>;
}

const daysUntil = d => Math.round((new Date(d + 'T00:00:00') - new Date(NOP.TODAY + 'T00:00:00')) / 86400000);

/* greeting based on a fixed "now" — keeps the demo stable */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/* ── Faux status bar ────────────────────────────────────── */
function StatusBar() {
  const [time, setTime] = React.useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }));
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })), 20000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="m-status">
      <span>{time}</span>
      <span className="sb-icons">
        <i className="ph-fill ph-cell-signal-full"></i>
        <i className="ph-fill ph-wifi-high"></i>
        <i className="ph-fill ph-battery-high"></i>
      </span>
    </div>
  );
}

/* ── Screen header (large title, optional back + trailing) ─ */
function ScreenHead({ eyebrow, title, sub, onBack, trailing, children }) {
  return (
    <div className="m-head">
      {onBack ? (
        <button className="m-back" onClick={onBack}><i className="ph ph-caret-left"></i> Back</button>
      ) : null}
      <div className="m-head-top">
        <div style={{ minWidth: 0 }}>
          {eyebrow ? <div className="m-eyebrow">{eyebrow}</div> : null}
          {title ? <h1 className="m-title">{title}</h1> : null}
        </div>
        {trailing || null}
      </div>
      {sub ? <p className="m-sub">{sub}</p> : null}
      {children}
    </div>
  );
}

/* ── Invoice list row ───────────────────────────────────── */
function InvoiceRow({ inv, onClick }) {
  const es = NOP.effStatus(inv);
  const dateLabel = inv.issue_date
    ? (es === 'overdue'
        ? `${Math.abs(daysUntil(inv.due_date))}d overdue`
        : (inv.status === 'unpaid' ? `Due ${NOP.fmtDateShort(inv.due_date)}` : NOP.fmtDateShort(inv.issue_date)))
    : 'No date yet';
  return (
    <button className="m-row" onClick={onClick}>
      <Avatar name={inv.clientName} userId={inv.client} size="lg" />
      <div className="m-row-main">
        <div className="m-row-title">{inv.clientName}</div>
        <div className="m-row-meta">{inv.invoice_number} · {dateLabel}</div>
      </div>
      <div className="m-row-end">
        <span className="m-row-amt">{NOP.fmt(inv.total)}</span>
        <MStatusBadge status={es} />
      </div>
    </button>
  );
}

/* ── iOS switch ─────────────────────────────────────────── */
function MSwitch({ checked, onChange }) {
  return (
    <label className="m-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="track"><span className="thumb"></span></span>
    </label>
  );
}

/* ── Bottom sheet ───────────────────────────────────────── */
function Sheet({ title, onClose, children, foot }) {
  return (
    <React.Fragment>
      <div className="m-scrim" onClick={onClose}></div>
      <div className="m-sheet" role="dialog" aria-modal="true">
        <div className="m-sheet-grip"></div>
        {title ? (
          <div className="m-sheet-h">
            <h3>{title}</h3>
            <button className="m-iconbtn m-iconbtn--ghost" onClick={onClose} aria-label="Close"><i className="ph ph-x"></i></button>
          </div>
        ) : null}
        <div className="m-sheet-body">{children}</div>
        {foot ? <div className="m-sheet-foot">{foot}</div> : null}
      </div>
    </React.Fragment>
  );
}

/* ── Mini bar chart ─────────────────────────────────────── */
function MiniChart() {
  const max = Math.max(...NOP.revenue.map(r => r.v));
  return (
    <div className="m-chart">
      {NOP.revenue.map((r, i) => {
        const now = i === NOP.revenue.length - 1;
        return (
          <div className="m-chart-col" key={r.m}>
            <div className="m-chart-bar-wrap">
              <div className={'m-chart-bar' + (now ? ' m-chart-bar--now' : '')}
                   style={{ height: Math.max(6, Math.round((r.v / max) * 100)) + '%' }}
                   title={r.m + ' · ' + NOP.fmt(r.v)}></div>
            </div>
            <div className="m-chart-m">{r.m}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Mobile invoice document ────────────────────────────── */
function MInvoiceDoc({ data }) {
  const { fmt, fmtDate } = NOP;
  const d = data || {};
  const items = d.items || [];
  const bf = d.billFrom || {};
  const bt = d.billTo || {};
  return (
    <div className="m-paper">
      <div className="m-paper-top">
        <div className="m-paper-brand">
          <div className="m-paper-logo"><img src="numbers-on-paper-assets/mark/mark-white.svg" alt="" style={{ width: 22, height: 22 }} /></div>
          <div>
            <div className="m-paper-biz">{bf.name || 'SC Design & Consultation'}</div>
            <div className="m-paper-tag">Web Design &amp; Consultation</div>
          </div>
        </div>
        <div className="m-paper-docrow">
          <div>
            <div className="m-paper-word">Invoice</div>
            <div className="m-paper-num">{d.invoice_number || 'INV-0000'}</div>
          </div>
          <MStatusBadge status={d.status || 'draft'} />
        </div>
      </div>

      <div className="m-paper-body">
        <div className="m-paper-meta">
          <div>
            <div className="lab">Bill to</div>
            <div className="val"><strong>{bt.name || '—'}</strong>{bt.contact ? <><br />{bt.contact}</> : null}{bt.city ? <><br />{bt.city}</> : null}</div>
          </div>
          <div>
            <div className="lab">From</div>
            <div className="val"><strong>{bf.name}</strong><br />{bf.line1}<br />{bf.line2}</div>
          </div>
          <div>
            <div className="lab">Issued</div>
            <div className="val"><strong>{fmtDate(d.issue_date)}</strong></div>
          </div>
          <div>
            <div className="lab">Due</div>
            <div className="val"><strong>{fmtDate(d.due_date)}</strong></div>
          </div>
        </div>

        <div className="m-paper-hr"></div>

        {items.length === 0 ? (
          <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '6px 0' }}>No line items yet.</div>
        ) : items.map((it, i) => (
          <div className="m-paper-li" key={i}>
            <div style={{ minWidth: 0 }}>
              <div className="m-paper-li-desc">{it.description || '—'}</div>
              <div className="m-paper-li-qty">{it.qty} × {fmt(it.rate)}</div>
            </div>
            <div className="m-paper-li-amt">{fmt(it.amount)}</div>
          </div>
        ))}

        <div style={{ marginTop: 16 }}>
          <div className="m-paper-tot"><span>Subtotal</span><span className="v">{fmt(d.subtotal)}</span></div>
          {d.showTax ? <div className="m-paper-tot"><span>Tax ({Math.round((d.taxRate || 0) * 100)}%)</span><span className="v">{fmt(d.taxAmt)}</span></div> : null}
          <div className="m-paper-tot grand"><span>Total due</span><span className="v">{fmt(d.total)}</span></div>
        </div>

        {d.notes ? (
          <div className="m-paper-notes">
            <div className="lab">Notes &amp; terms</div>
            <p>{d.notes}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

Object.assign(window, {
  MStatusBadge, StatusBar, ScreenHead, InvoiceRow, MSwitch, Sheet,
  MiniChart, MInvoiceDoc, daysUntil, greeting, M_STATUS,
});
