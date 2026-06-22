/* Proposal paper document — pure presentational.
   Uses global .pp-* / .ps-* classes from proposals.css. */

const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0)
const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const STATUS_MAP = {
  draft:    'draft',
  sent:     'sent',
  accepted: 'accepted',
  declined: 'declined',
}

function StatusBadge({ status }) {
  const key = STATUS_MAP[status] || 'draft'
  const labels = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', declined: 'Declined' }
  return <span className={`prop-badge prop-badge--${key}`}>{labels[key]}</span>
}

export default function ProposalDoc({ data }) {
  const d = data || {}
  const sec = d.sections || {}
  const bf = d.preparedBy || {}
  const bt = d.preparedFor || {}
  const items = d.items || []

  // Build ordered list of enabled + non-empty sections (keeps numbering sequential)
  const blocks = []

  if (sec.intro && (d.introText || '').trim()) {
    blocks.push({ key: 'intro', title: 'Introduction', body: (
      <p className="ps-text">{d.introText}</p>
    )})
  }

  if (sec.scope && ((d.scopeText || '').trim() || (d.objectives || []).some(o => o.trim()))) {
    blocks.push({ key: 'scope', title: 'Scope of work', body: (
      <div className="stack" style={{ gap: 'var(--space-5)' }}>
        {(d.scopeText || '').trim() && <p className="ps-text">{d.scopeText}</p>}
        {(d.objectives || []).filter(o => o.trim()).length > 0 && (
          <ul className="ps-list ps-list--num">
            {d.objectives.filter(o => o.trim()).map((o, i) => (
              <li key={i}>
                <span className="ps-list-n">{String(i + 1).padStart(2, '0')}</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )})
  }

  if (sec.deliverables && (d.deliverables || []).some(x => x.trim())) {
    blocks.push({ key: 'deliverables', title: 'Deliverables', body: (
      <ul className="ps-list ps-list--check">
        {d.deliverables.filter(x => x.trim()).map((x, i) => (
          <li key={i}>
            <svg aria-hidden="true" viewBox="0 0 256 256" width="18" height="18" fill="none"
              stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="128" cy="128" r="96" />
              <polyline points="88,136 112,160 168,96" />
            </svg>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    )})
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
                <td>
                  <div className="pp-item">{it.description || '—'}</div>
                  {it.note ? <div className="pp-desc">{it.note}</div> : null}
                </td>
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
            {d.showTax
              ? <div className="pp-total-row"><span>Tax ({Math.round((d.taxRate || 0) * 100)}%)</span><span>{fmt(d.taxAmt)}</span></div>
              : null}
            <div className="pp-total-row pp-grand"><span>Total</span><span>{fmt(d.total)}</span></div>
          </div>
        </div>
      </>
    )})
  }

  if (sec.timeline && (d.timeline || []).some(m => (m.phase || '').trim())) {
    blocks.push({ key: 'timeline', title: 'Timeline', body: (
      <div className="ps-timeline">
        {d.timeline.filter(m => (m.phase || '').trim()).map((m, i) => (
          <div className="ps-mile" key={i}>
            <span className="ps-mile-dot" />
            <div className="ps-mile-phase">{m.phase}</div>
            <div className="ps-mile-dur">{m.duration || '—'}</div>
          </div>
        ))}
      </div>
    )})
  }

  if (sec.terms && (d.termsText || '').trim()) {
    blocks.push({ key: 'terms', title: 'Terms & conditions', body: (
      <p className="ps-text ps-text--sm" style={{ whiteSpace: 'pre-wrap' }}>{d.termsText}</p>
    )})
  }

  if (sec.acceptance) {
    blocks.push({ key: 'acceptance', title: 'Acceptance', body: (
      <>
        <p className="ps-text ps-text--sm">
          By signing below, you agree to the scope, investment, and terms outlined in this proposal.
        </p>
        <div className="ps-sign">
          <div className="ps-sign-col">
            <div className="ps-sign-line" />
            <div className="ps-sign-lbl">Signature · {bt.name || 'Client'}</div>
          </div>
          <div className="ps-sign-col">
            <div className="ps-sign-line" />
            <div className="ps-sign-lbl">Date</div>
          </div>
        </div>
      </>
    )})
  }

  return (
    <div className="paper" id="proposal-paper">
      {/* Header: brand + doc block */}
      <div className="pp-top">
        <div className="pp-brand">
          <div className="pp-logo">
            <img src="/mark/mark-white.svg" alt="" />
          </div>
          <div>
            <div className="pp-biz">{bf.name || 'SC Design & Consultation'}</div>
            <div className="pp-tag">Web Design &amp; Consultation</div>
          </div>
        </div>
        <div className="pp-doc">
          <div className="pp-doc-word">Proposal</div>
          <div className="pp-num">{d.number || 'PROP-0000'}</div>
          <StatusBadge status={d.status || 'draft'} />
        </div>
      </div>

      {(d.title || '').trim() && <h1 className="ps-title">{d.title}</h1>}

      <div className="pp-divider" />

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
            {bf.line1 && <>{bf.line1}<br /></>}
            {bf.line2}
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
  )
}

/* ── Mobile proposal paper ── flowing, no fixed width ───────────── */
export function MobileProposalDoc({ data }) {
  const d = data || {}
  const sec = d.sections || {}
  const bf = d.preparedBy || {}
  const bt = d.preparedFor || {}
  const items = d.items || []

  const blocks = []

  if (sec.intro && (d.introText || '').trim())
    blocks.push({ key: 'intro', title: 'Introduction',
      body: <p className="m-pp-text">{d.introText}</p> })

  if (sec.scope && ((d.scopeText || '').trim() || (d.objectives || []).some(o => o.trim())))
    blocks.push({ key: 'scope', title: 'Scope of work', body: (
      <div className="m-pp-sec-body">
        {(d.scopeText || '').trim() && <p className="m-pp-text">{d.scopeText}</p>}
        {(d.objectives || []).filter(o => o.trim()).length > 0 && (
          <ul className="m-pp-list m-pp-list--num">
            {d.objectives.filter(o => o.trim()).map((o, i) => (
              <li key={i}><span className="m-pp-n">{String(i + 1).padStart(2, '0')}</span><span>{o}</span></li>
            ))}
          </ul>
        )}
      </div>
    )})

  if (sec.deliverables && (d.deliverables || []).some(x => x.trim()))
    blocks.push({ key: 'deliverables', title: 'Deliverables', body: (
      <ul className="m-pp-list m-pp-list--check">
        {d.deliverables.filter(x => x.trim()).map((x, i) => (
          <li key={i}>
            <svg width="14" height="14" viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"/></svg>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    )})

  if (sec.investment)
    blocks.push({ key: 'investment', title: 'Investment', body: (
      <div>
        {items.map((it, i) => (
          <div className="m-paper-li" key={i}>
            <div style={{ minWidth: 0 }}>
              <div className="m-paper-li-desc">{it.description || '—'}</div>
              <div className="m-paper-li-qty">{it.qty} × {fmt(it.rate)}</div>
            </div>
            <div className="m-paper-li-amt">{fmt(it.amount)}</div>
          </div>
        ))}
        <div className="m-paper-tots">
          <div className="m-paper-tot"><span>Subtotal</span><span>{fmt(d.subtotal)}</span></div>
          {d.showTax && <div className="m-paper-tot"><span>Tax ({Math.round((d.taxRate || 0) * 100)}%)</span><span>{fmt(d.taxAmt)}</span></div>}
          <div className="m-paper-tot m-paper-tot--grand"><span>Total</span><span>{fmt(d.total)}</span></div>
        </div>
      </div>
    )})

  if (sec.timeline && (d.timeline || []).some(m => m.phase.trim()))
    blocks.push({ key: 'timeline', title: 'Timeline', body: (
      <div className="m-pp-timeline">
        {d.timeline.filter(m => m.phase.trim()).map((m, i) => (
          <div className="m-pp-mile" key={i}>
            <span className="m-pp-dot" aria-hidden="true" />
            <span className="m-pp-mile-p">{m.phase}</span>
            <span className="m-pp-mile-d">{m.duration || '—'}</span>
          </div>
        ))}
      </div>
    )})

  if (sec.terms && (d.termsText || '').trim())
    blocks.push({ key: 'terms', title: 'Terms & conditions',
      body: <p className="m-pp-text m-pp-text--sm" style={{ whiteSpace: 'pre-wrap' }}>{d.termsText}</p> })

  if (sec.acceptance)
    blocks.push({ key: 'acceptance', title: 'Acceptance', body: (
      <>
        <p className="m-pp-text m-pp-text--sm">By signing below, you agree to the scope, investment, and terms outlined here.</p>
        <div className="m-pp-sign">
          <div className="m-pp-sign-col">
            <div className="m-pp-sign-line" />
            <div className="m-pp-sign-lbl">Signature · {bt.name || 'Client'}</div>
          </div>
          <div className="m-pp-sign-col">
            <div className="m-pp-sign-line" />
            <div className="m-pp-sign-lbl">Date</div>
          </div>
        </div>
      </>
    )})

  return (
    <div className="m-paper">
      {/* Dark header */}
      <div className="m-paper-top">
        <div className="m-paper-brand">
          <div className="m-paper-logo">
            <img src="/mark/mark-white.svg" alt="" style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <div className="m-paper-biz">{bf.name || 'SC Design & Consultation'}</div>
            <div className="m-paper-tag">Web Design &amp; Consultation</div>
          </div>
        </div>
        <div className="m-paper-docrow">
          <div>
            <div className="m-paper-word">Proposal</div>
            <div className="m-paper-num">{d.number || 'PROP-0000'}</div>
          </div>
          <StatusBadge status={d.status || 'draft'} />
        </div>
      </div>

      {/* Body */}
      <div className="m-paper-body">
        {(d.title || '').trim() && <h2 className="m-pp-title">{d.title}</h2>}

        <div className="m-paper-meta">
          <div>
            <div className="m-paper-meta-lab">Prepared for</div>
            <div className="m-paper-meta-val">
              <strong>{bt.name || '—'}</strong>
              {bt.contact && <><br />{bt.contact}</>}
              {bt.city    && <><br />{bt.city}</>}
            </div>
          </div>
          <div>
            <div className="m-paper-meta-lab">Prepared by</div>
            <div className="m-paper-meta-val">
              <strong>{bf.name}</strong>
              {bf.line1 && <><br />{bf.line1}</>}
              {bf.line2 && <><br />{bf.line2}</>}
            </div>
          </div>
          <div>
            <div className="m-paper-meta-lab">Date</div>
            <div className="m-paper-meta-val"><strong>{fmtDate(d.issue_date)}</strong></div>
          </div>
          <div>
            <div className="m-paper-meta-lab">Valid until</div>
            <div className="m-paper-meta-val"><strong>{fmtDate(d.valid_until)}</strong></div>
          </div>
        </div>

        {blocks.map((b, i) => (
          <div className="m-pp-sec" key={b.key}>
            <div className="m-pp-sec-h">
              <span className="m-pp-sec-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="m-pp-sec-t">{b.title}</span>
            </div>
            {b.body}
          </div>
        ))}
      </div>
    </div>
  )
}
