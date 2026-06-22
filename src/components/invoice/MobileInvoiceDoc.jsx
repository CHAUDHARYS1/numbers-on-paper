import Badge from '@/components/ui/Badge'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
const fmtDate = (d) => !d ? '—' : new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function MobileInvoiceDoc({ invoice }) {
  const bf = invoice.bill_from || {}
  const bt = invoice.bill_to || {}
  const items = invoice.line_items || []
  const showTax = invoice.show_tax && (invoice.tax_rate || 0) > 0
  const bizName = bf.business || bf.name || 'Your Business'
  const initial = bizName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="m-paper">
      <div className="m-paper-top">
        <div className="m-paper-brand">
          <div className="m-paper-logo">
            {bf.logo_url
              ? <img src={bf.logo_url} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              : <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-mono)' }}>{initial}</span>
            }
          </div>
          <div>
            <div className="m-paper-biz">{bizName}</div>
            {bf.city
              ? <div className="m-paper-tag">{[bf.address, bf.city, bf.state].filter(Boolean).join(' · ')}</div>
              : bf.address
                ? <div className="m-paper-tag">{bf.address}</div>
                : null
            }
          </div>
        </div>
        <div className="m-paper-docrow">
          <div>
            <div className="m-paper-word">Invoice</div>
            <div className="m-paper-num">{invoice.invoice_number || 'INV-0000'}</div>
          </div>
          {invoice.status && <Badge variant={invoice.status} />}
        </div>
      </div>

      <div className="m-paper-body">
        <div className="m-paper-meta">
          <div>
            <div className="lab">Bill to</div>
            <div className="val">
              <strong>{bt.name || '—'}</strong>
              {bt.contact_name && <><br />{bt.contact_name}</>}
              {bt.city && <><br />{bt.city}</>}
            </div>
          </div>
          <div>
            <div className="lab">From</div>
            <div className="val">
              <strong>{bizName}</strong>
              {bf.address && <><br />{bf.address}</>}
              {(bf.city || bf.state) && <><br />{[bf.city, bf.state].filter(Boolean).join(', ')}</>}
            </div>
          </div>
          <div>
            <div className="lab">Issued</div>
            <div className="val"><strong>{fmtDate(invoice.issue_date)}</strong></div>
          </div>
          <div>
            <div className="lab">Due</div>
            <div className="val"><strong>{fmtDate(invoice.due_date)}</strong></div>
          </div>
        </div>

        <div className="m-paper-hr" />

        {items.length === 0 ? (
          <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '6px 0' }}>No line items yet.</div>
        ) : items.map((it, i) => (
          <div className="m-paper-li" key={i}>
            <div style={{ minWidth: 0 }}>
              <div className="m-paper-li-desc">{it.item || '—'}</div>
              {(it.hours || it.rate) && (
                <div className="m-paper-li-qty">{it.hours} × {fmt(it.rate)}</div>
              )}
            </div>
            <div className="m-paper-li-amt">{fmt(it.amount)}</div>
          </div>
        ))}

        <div style={{ marginTop: 16 }}>
          <div className="m-paper-tot"><span>Subtotal</span><span className="v">{fmt(invoice.subtotal)}</span></div>
          {showTax && (
            <div className="m-paper-tot">
              <span>Tax ({invoice.tax_rate}%)</span>
              <span className="v">{fmt(invoice.tax_amount)}</span>
            </div>
          )}
          <div className="m-paper-tot grand"><span>Total due</span><span className="v">{fmt(invoice.total)}</span></div>
        </div>

        {invoice.show_notes && invoice.notes && (
          <div className="m-paper-notes">
            <div className="lab">Notes &amp; terms</div>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
