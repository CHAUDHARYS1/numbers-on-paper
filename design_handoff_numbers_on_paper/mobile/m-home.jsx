/* ── Home / Dashboard screen ──────────────────────────── */
function HomeScreen({ app }) {
  const { Avatar } = window.TaskmasterProDesignSystem_b94546;
  const NOP = window.NOP;
  const { fmt, fmt0, effStatus } = NOP;
  const invoices = app.invoices;
  const biz = NOP.business;

  const paid    = invoices.filter(i => i.status === 'paid');
  const unpaid  = invoices.filter(i => i.status === 'unpaid');
  const drafts  = invoices.filter(i => i.status === 'draft');
  const overdue = invoices.filter(i => i.overdue);

  const collected   = paid.reduce((s, i) => s + i.total, 0);
  const outstanding = unpaid.reduce((s, i) => s + i.total, 0);
  const totalAll    = invoices.filter(i => i.status !== 'draft').reduce((s, i) => s + i.total, 0);

  const dueSoon = [...unpaid].sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 4);
  const recent  = [...invoices].sort((a, b) => (b.issue_date || '0').localeCompare(a.issue_date || '0')).slice(0, 4);

  const trailing = (
    <button className="m-ava-btn" onClick={() => app.goTab('settings')} aria-label="Account">
      <Avatar name={biz.owner} userId="u_owner" size="lg" />
    </button>
  );

  return (
    <div className="m-scroll">
      <window.ScreenHead
        eyebrow={window.greeting() + ','}
        title={biz.owner.split(' ')[0]}
        sub={biz.name}
        trailing={trailing} />

      <div className="m-body">
        {/* Hero — outstanding */}
        <div className="m-hero m-press" onClick={() => app.goTab('invoices', 'unpaid')}>
          <div className="m-hero-label">Outstanding</div>
          <div className="m-hero-val">{fmt0(outstanding)}</div>
          <div className="m-hero-row">
            <span className="m-hero-chip"><i className="ph ph-clock"></i> {unpaid.length} open</span>
            {overdue.length ? <span className="m-hero-chip m-hero-chip--warn"><i className="ph ph-warning"></i> {overdue.length} overdue</span> : null}
          </div>
        </div>

        <div className="m-section-gap"></div>

        {/* Stat tiles */}
        <div className="m-stats">
          <div className="m-stat">
            <div className="m-stat-ic ic-green"><i className="ph ph-check-circle"></i></div>
            <div className="m-stat-val">{fmt0(collected)}</div>
            <div className="m-stat-lbl">Collected</div>
            <div className="m-stat-meta">THIS YEAR</div>
          </div>
          <div className="m-stat">
            <div className="m-stat-ic ic-accent"><i className="ph ph-trend-up"></i></div>
            <div className="m-stat-val">{fmt0(totalAll)}</div>
            <div className="m-stat-lbl">Total invoiced</div>
            <div className="m-stat-meta">{invoices.length - drafts.length} SENT</div>
          </div>
        </div>

        {/* Revenue chart */}
        <div className="m-section-label">Revenue collected</div>
        <div className="m-card m-card--pad">
          <window.MiniChart />
        </div>

        {/* Due soon */}
        {dueSoon.length ? (
          <React.Fragment>
            <div className="m-card-h" style={{ padding: '0', marginTop: 22 }}>
              <div className="m-section-label" style={{ margin: 0 }}>Due soon</div>
              <button className="m-card-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => app.goTab('invoices', 'unpaid')}>View all <i className="ph ph-arrow-right" style={{ fontSize: 12 }}></i></button>
            </div>
            <div className="m-list m-card" style={{ marginTop: 10 }}>
              {dueSoon.map(inv => {
                const dleft = window.daysUntil(inv.due_date);
                const color = inv.overdue ? 'var(--red)' : (dleft <= 7 ? 'var(--amber)' : 'var(--ink-4)');
                const meta = inv.overdue ? `${Math.abs(dleft)}d overdue · ${inv.invoice_number}` : `Due in ${dleft}d · ${inv.invoice_number}`;
                return (
                  <button className="m-row" key={inv.id} onClick={() => app.openInvoice(inv.id)}>
                    <span className="m-due-dot" style={{ background: color }}></span>
                    <div className="m-row-main">
                      <div className="m-row-title">{inv.clientName}</div>
                      <div className="m-row-meta" style={{ color }}>{meta}</div>
                    </div>
                    <span className="m-row-amt">{fmt(inv.total)}</span>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        ) : null}

        {/* Recent */}
        <div className="m-card-h" style={{ padding: '0', marginTop: 22 }}>
          <div className="m-section-label" style={{ margin: 0 }}>Recent invoices</div>
          <button className="m-card-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => app.goTab('invoices')}>View all <i className="ph ph-arrow-right" style={{ fontSize: 12 }}></i></button>
        </div>
        <div className="m-list m-card" style={{ marginTop: 10 }}>
          {recent.map(inv => <window.InvoiceRow key={inv.id} inv={inv} onClick={() => app.openInvoice(inv.id)} />)}
        </div>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
