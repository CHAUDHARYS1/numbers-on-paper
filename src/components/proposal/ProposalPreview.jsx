import styles from './ProposalPreview.module.css'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0)

export default function ProposalPreview({ data, computed }) {
  const { subtotal, afterDiscount, tax, total, stageTotal } = computed

  return (
    <div className={styles.paper} id="proposal-paper">
      {/* ── Cover top ─────────────────────────── */}
      <div className={styles.coverTop}>
        <img src="/sc-design/logo.svg" alt="SC Design" className={styles.coverLogo} />
        <span className={styles.coverLocation}>★ Chicago, IL</span>
      </div>

      {/* ── Cover heading ─────────────────────── */}
      <div className={styles.coverHeading}>
        {data.kicker && <p className={styles.kicker}>{data.kicker}</p>}
        <h1 className={styles.docTitle}>{data.title || 'Project Proposal'}</h1>
      </div>

      {/* ── Meta grid ─────────────────────────── */}
      <div className={styles.metaSection}>
        <div className={styles.metaParties}>
          <div className={styles.metaParty}>
            <p className={styles.metaLabel}>Prepared for</p>
            {data.clientName    && <p className={styles.metaValue}>{data.clientName}</p>}
            {data.clientCompany && <p className={styles.metaValue}>{data.clientCompany}</p>}
            {data.clientEmail   && <p className={styles.metaMuted}>{data.clientEmail}</p>}
          </div>
          <div className={styles.metaParty}>
            <p className={styles.metaLabel}>Prepared by</p>
            {data.fromName    && <p className={styles.metaValue}>{data.fromName}</p>}
            {data.fromContact && <p className={styles.metaValue}>{data.fromContact}</p>}
            {data.fromEmail   && <p className={styles.metaMuted}>{data.fromEmail}</p>}
            {data.fromPhone   && <p className={styles.metaMuted}>{data.fromPhone}</p>}
          </div>
        </div>
        <div className={styles.metaFacts}>
          <div className={styles.metaFact}>
            <p className={styles.metaFactLabel}>Proposal No.</p>
            <p className={styles.metaFactValue}>
              {data.proposalNo ? `PRO-${String(data.proposalNo).padStart(4, '0')}` : '—'}
            </p>
          </div>
          <div className={styles.metaFact}>
            <p className={styles.metaFactLabel}>Date</p>
            <p className={styles.metaFactValue}>
              {data.date ? new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
            </p>
          </div>
          <div className={styles.metaFact}>
            <p className={styles.metaFactLabel}>Valid for</p>
            <p className={styles.metaFactValue}>{data.validDays ? `${data.validDays} days` : '—'}</p>
          </div>
          <div className={styles.metaFact}>
            <p className={styles.metaFactLabel}>Timeline</p>
            <p className={styles.metaFactValue}>{data.timeline || '—'}</p>
          </div>
        </div>
      </div>

      {/* ── 01 Project Overview ──────────────── */}
      {data.overview && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>01</span>
            <h2 className={styles.sectionTitle}>Project Overview</h2>
          </div>
          <p className={styles.overviewText}>{data.overview}</p>
        </section>
      )}

      {/* ── 02 Scope of Work ─────────────────── */}
      {data.scope?.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>02</span>
            <h2 className={styles.sectionTitle}>Scope of Work</h2>
          </div>
          <div className={styles.scopeGroups}>
            {data.scope.map((grp, gi) => (
              <div key={gi} className={styles.scopeGroup}>
                <p className={styles.scopeGroupTitle}>
                  <span className={styles.scopeBullet} aria-hidden="true" />
                  {grp.title}
                </p>
                <ul className={styles.scopeItems}>
                  {grp.items?.map((item, ii) => (
                    <li key={ii} className={styles.scopeItem}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 03 Investment ────────────────────── */}
      {data.items?.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>03</span>
            <h2 className={styles.sectionTitle}>Investment</h2>
          </div>
          <table className={styles.priceTable}>
            <thead>
              <tr>
                <th className={styles.colDesc}>Description</th>
                <th className={styles.colNum}>Qty</th>
                <th className={styles.colNum}>Rate</th>
                <th className={styles.colAmt}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i}>
                  <td className={styles.descCell}>
                    <span className={styles.descMain}>{item.desc}</span>
                    {item.sub && <span className={styles.descSub}>{item.sub}</span>}
                  </td>
                  <td className={styles.numCell}>{item.qty ?? 1}</td>
                  <td className={styles.numCell}>{fmt(item.rate)}</td>
                  <td className={styles.amtCell}>{fmt((item.qty || 0) * (item.rate || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.totalsBox}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {data.discount > 0 && (
              <div className={styles.totalRow}>
                <span>Discount</span>
                <span className={styles.discountAmt}>−{fmt(data.discount)}</span>
              </div>
            )}
            {data.taxOn && (
              <div className={styles.totalRow}>
                <span>Tax ({data.taxRate ?? 0}%)</span>
                <span>{fmt(tax)}</span>
              </div>
            )}
            <div className={styles.grandTotalChip}>
              <span className={styles.grandTotalLabel}>
                <span className={styles.usdTag}>USD</span> Total
              </span>
              <span className={styles.grandTotalAmt}>{fmt(total)}</span>
            </div>
          </div>
        </section>
      )}

      {/* ── 04 Payment Schedule ──────────────── */}
      {data.payment?.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>04</span>
            <h2 className={styles.sectionTitle}>Payment Schedule</h2>
          </div>
          {stageTotal !== 100 && (
            <p className={styles.payWarning}>
              Stage percentages total {stageTotal}% — must equal 100%.
            </p>
          )}
          <div className={styles.payRows}>
            {data.payment.map((stage, i) => (
              <div key={i} className={styles.payRow}>
                <span className={styles.payIndex}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.payLabel}>{stage.label}</span>
                <span className={styles.payPct}>{stage.pct ?? 0}%</span>
                <span className={styles.payAmt}>{fmt(total * (stage.pct || 0) / 100)}</span>
              </div>
            ))}
          </div>
          {data.payNote && <p className={styles.payNote}>{data.payNote}</p>}
        </section>
      )}

      {/* ── 05 Terms & Conditions ────────────── */}
      {data.terms?.filter(Boolean).length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>05</span>
            <h2 className={styles.sectionTitle}>Terms &amp; Conditions</h2>
          </div>
          <ol className={styles.termsList}>
            {data.terms.filter(Boolean).map((term, i) => (
              <li key={i} className={styles.termItem}>{term}</li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Proposal note ─────────────────────── */}
      <div className={styles.proposalNote}>
        This is a proposal, not an invoice. No payment is due until a formal invoice is issued.
      </div>

      {/* ── Footer ────────────────────────────── */}
      <footer className={styles.footer}>
        <img src="/sc-design/skyline-navy.svg" alt="" className={styles.skyline} aria-hidden="true" />
        <div className={styles.footerContent}>
          <span className={styles.footerStudio}>{data.fromName || 'SC Design & Consultation'}</span>
          <span className={styles.footerMeta}>
            {data.proposalNo ? `PRO-${String(data.proposalNo).padStart(4, '0')}` : ''}{data.fromEmail ? ` · ${data.fromEmail}` : ''}
          </span>
        </div>
      </footer>
    </div>
  )
}
