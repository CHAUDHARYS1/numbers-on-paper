/* ── Shared proposal "paper" document ─────────────────────
   Rendered by the Proposal editor (live preview, fullscreen,
   and print/PDF). Pure presentational component, mirrors the
   InvoiceDoc paper but with toggleable narrative sections.
   ──────────────────────────────────────────────────────── */
const { Badge: _PBadge } = window.TaskmasterProDesignSystem_b94546;

const PROP_STATUS = {
  draft:    ['gray',  'Draft'],
  sent:     ['amber', 'Sent'],
  accepted: ['green', 'Accepted'],
  declined: ['red',   'Declined'],
};
function ProposalStatusBadge({ status }) {
  const [tone, label] = PROP_STATUS[status] || ['gray', 'Draft'];
  return <_PBadge tone={tone}>{label}</_PBadge>;
}
window.ProposalStatusBadge = ProposalStatusBadge;

function ProposalDoc({ data }) {
  const NOP = window.NOP;
  const { fmt, fmtDate } = NOP;
  const d = data || {};
  const sec = d.sections || {};
  const bf = d.preparedBy || {};
  const bt = d.preparedFor || {};
  const items = d.items || [];

  // Build the ordered list of *enabled & non-empty* sections so
  // numbering stays sequential no matter which are toggled off.
  const blocks = [];

  if (sec.intro && (d.introText || '').trim()) {
    blocks.push({ key: 'intro', title: 'Introduction', body: (
      <p className="ps-text">{d.introText}</p>
    )});
  }

  if (sec.scope && ((d.scopeText || '').trim() || (d.objectives || []).length)) {
    blocks.push({ key: 'scope', title: 'Scope of work', body: (
      <>
        {(d.scopeText || '').trim() ? <p className="ps-text">{d.scopeText}</p> : null}
        {(d.objectives || []).filter(o => o.trim()).length ? (
          <ul className="ps-list ps-list--num">
            {d.objectives.filter(o => o.trim()).map((o, i) => (
              <li key={i}><span className="ps-list-n">{String(i + 1).padStart(2, '0')}</span><span>{o}</span></li>
            ))}
          </ul>
        ) : null}
      </>
    )});
  }

  if (sec.deliverables && (d.deliverables || []).filter(x => x.trim()).length) {
    blocks.push({ key: 'deliverables', title: 'Deliverables', body: (
      <ul className="ps-list ps-list--check">
        {d.deliverables.filter(x => x.trim()).map((x, i) => (
          <li key={i}><i className="ph ph-check-circle" aria-hidden="true"></i><span>{x}</span></li>
        ))}
      </ul>
    )});
  }

  if (sec.investment) {
    blocks.push({ key: 'investment', title: 'Investment', body: (
      <>
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
                <td><div className="pp-item">{it.description || '—'}</div>{it.note ? <div className="pp-desc">{it.note}</div> : null}</td>
                <td className="pp-num-cell">{it.qty}</td>
                <td className="pp-num-cell">{fmt(it.rate)}</td>
                <td className="pp-num-cell" style={{ fontWeight: 700, color: '#0B1B34' }}>{fmt(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ps-invest-foot">
          <div className="pp-totals">
            <div className="pp-total-row"><span>Subtotal</span><span>{fmt(d.subtotal)}</span></div>
            {d.showTax ? <div className="pp-total-row"><span>Tax ({Math.round((d.taxRate || 0) * 100)}%)</span><span>{fmt(d.taxAmt)}</span></div> : null}
            <div className="pp-total-row pp-grand"><span>Total</span><span>{fmt(d.total)}</span></div>
          </div>
        </div>
      </>
    )});
  }

  if (sec.timeline && (d.timeline || []).filter(m => m.phase.trim()).length) {
    blocks.push({ key: 'timeline', title: 'Timeline', body: (
      <div className="ps-timeline">
        {d.timeline.filter(m => m.phase.trim()).map((m, i) => (
          <div className="ps-mile" key={i}>
            <span className="ps-mile-dot"></span>
            <div className="ps-mile-phase">{m.phase}</div>
            <div className="ps-mile-dur">{m.duration || '—'}</div>
          </div>
        ))}
      </div>
    )});
  }

  if (sec.terms && (d.termsText || '').trim()) {
    blocks.push({ key: 'terms', title: 'Terms & conditions', body: (
      <p className="ps-text ps-text--sm">{d.termsText}</p>
    )});
  }

  if (sec.acceptance) {
    blocks.push({ key: 'acceptance', title: 'Acceptance', body: (
      <>
        <p className="ps-text ps-text--sm">By signing below, you agree to the scope, investment, and terms outlined in this proposal.</p>
        <div className="ps-sign">
          <div className="ps-sign-col">
            <div className="ps-sign-line"></div>
            <div className="ps-sign-lbl">Signature · {bt.name || 'Client'}</div>
          </div>
          <div className="ps-sign-col">
            <div className="ps-sign-line"></div>
            <div className="ps-sign-lbl">Date</div>
          </div>
        </div>
      </>
    )});
  }

  return (
    <div className="paper proposal-paper" id="proposal-paper">
      <div className="pp-top">
        <div className="pp-brand">
          <div className="pp-logo"><img src="numbers-on-paper-assets/mark/mark-white.svg" alt="" style={{ width: 30, height: 30 }} /></div>
          <div>
            <div className="pp-biz">{bf.name || 'SC Design & Consultation'}</div>
            <div className="pp-tag">Web Design &amp; Consultation</div>
          </div>
        </div>
        <div className="pp-doc">
          <div className="pp-doc-word">Proposal</div>
          <div className="pp-num">{d.number || 'PROP-0000'}</div>
          <ProposalStatusBadge status={d.status || 'draft'} />
        </div>
      </div>

      {(d.title || '').trim() ? <h1 className="ps-title">{d.title}</h1> : null}

      <div className="pp-divider"></div>

      <div className="pp-meta">
        <div>
          <div className="pp-meta-label">Prepared for</div>
          <div className="pp-meta-val">
            <strong>{bt.name || '—'}</strong><br />
            {bt.contact ? <>{bt.contact}<br /></> : null}
            {bt.city}
          </div>
        </div>
        <div>
          <div className="pp-meta-label">Prepared by</div>
          <div className="pp-meta-val">
            <strong>{bf.name}</strong><br />
            {bf.line1}<br />{bf.line2}
          </div>
        </div>
        <div>
          <div className="pp-meta-label">Date</div>
          <div className="pp-meta-val"><strong>{fmtDate(d.issue_date)}</strong></div>
          <div className="pp-meta-label" style={{ marginTop: 'var(--space-4)' }}>Valid until</div>
          <div className="pp-meta-val"><strong>{fmtDate(d.valid_until)}</strong></div>
        </div>
      </div>

      {blocks.map((b, i) => (
        <section className="ps-sec" key={b.key}>
          <div className="ps-sec-head">
            <span className="ps-sec-n">{String(i + 1).padStart(2, '0')}</span>
            <h2 className="ps-sec-title">{b.title}</h2>
          </div>
          <div className="ps-sec-body">{b.body}</div>
        </section>
      ))}
    </div>
  );
}

window.ProposalDoc = ProposalDoc;
