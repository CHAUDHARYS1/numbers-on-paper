import styles from './InvoicePreview.module.css'
import Badge from '@/components/ui/Badge'

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
}

export default function InvoicePreview({ data = {}, id }) {
  const {
    invoice_number, issue_date, due_date, status = 'draft',
    bill_from = {}, bill_to = {},
    line_items = [],
    subtotal = 0, discount_amount = 0, tax_rate = 0, tax_amount = 0, total = 0,
    notes,
    show_discount, show_tax, show_notes,
  } = data

  return (
    <div className={styles.invoice} id={id}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.brandCol}>
          <div className={styles.logoBox}>
            {bill_from.business ? bill_from.business.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : 'SC'}
          </div>
          <div>
            <div className={styles.bizName}>{bill_from.business || 'SC Design and Consultation'}</div>
            <div className={styles.bizTagline}>Web Design &amp; Consultation</div>
          </div>
        </div>
        <div className={styles.docCol}>
          <div className={styles.invNumber}>{invoice_number || 'INV-000001'}</div>
          <div className={styles.invDate}>{issue_date || '—'}</div>
          <Badge variant={status} />
        </div>
      </div>

      <div className={styles.divider} />

      {/* Bill From / To / Rate */}
      <div className={styles.metaGrid}>
        <div className={styles.metaCell}>
          <div className={styles.metaLabel}>Bill from</div>
          <div className={styles.metaVal}><strong>{bill_from.name || '—'}</strong></div>
          {bill_from.address && <div className={styles.metaVal}>{bill_from.address}</div>}
          {(bill_from.city || bill_from.state) && (
            <div className={styles.metaVal}>{[bill_from.city, bill_from.state, bill_from.zip].filter(Boolean).join(', ')}</div>
          )}
        </div>
        <div className={styles.metaCell}>
          <div className={styles.metaLabel}>Bill to</div>
          <div className={styles.metaVal}><strong>{bill_to.name || '—'}</strong></div>
          {bill_to.organization && <div className={styles.metaVal}>{bill_to.organization}</div>}
          {bill_to.address && <div className={styles.metaVal}>{bill_to.address}</div>}
          {(bill_to.city || bill_to.state) && (
            <div className={styles.metaVal}>{[bill_to.city, bill_to.state, bill_to.zip].filter(Boolean).join(', ')}</div>
          )}
        </div>
        <div className={styles.metaCell}>
          <div className={styles.metaLabel}>Due date</div>
          <div className={styles.metaVal}><strong>{due_date || '—'}</strong></div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Line items */}
      <div className={styles.tableWrap}>
        <div className={styles.tableLabel}>Invoice detail</div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Description</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Hours</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {line_items.length === 0 ? (
              <tr><td colSpan={5} className={styles.emptyRow}>No line items added yet.</td></tr>
            ) : line_items.map((item, i) => (
              <tr key={item.id || i}>
                <td className={styles.itemCell}>{item.item || '—'}</td>
                <td className={styles.descCell}>{item.description || '—'}</td>
                <td className={styles.dateCell}>{item.date || '—'}</td>
                <td className={styles.numCell}>{item.hours || '—'}</td>
                <td className={styles.amtCell}>{fmt(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.divider} />

      {/* Footer: contact + totals */}
      <div className={styles.footer}>
        <div className={styles.contactBox}>
          <div className={styles.metaLabel}>Contact</div>
          {bill_from.phone && (
            <div className={styles.contactRow}><span className={styles.contactLbl}>Phone</span><span>{bill_from.phone}</span></div>
          )}
          {bill_from.email && (
            <div className={styles.contactRow}><span className={styles.contactLbl}>Email</span><span>{bill_from.email}</span></div>
          )}
        </div>

        <div className={styles.totalsBox}>
          <div className={styles.totalRow}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          {show_discount && <div className={styles.totalRow}><span>Discount</span><span>-{fmt(discount_amount)}</span></div>}
          {show_tax && <div className={styles.totalRow}><span>Tax ({tax_rate}%)</span><span>{fmt(tax_amount)}</span></div>}
          <div className={[styles.totalRow, styles.grandTotal].join(' ')}>
            <span>Grand total</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {show_notes && notes && (
        <div className={styles.notes}>
          <div className={styles.metaLabel}>Notes &amp; terms</div>
          <p className={styles.notesText}>{notes}</p>
        </div>
      )}
    </div>
  )
}
