/* ── Clients screen ───────────────────────────────────── */
function buildClientList() {
  const NOP = window.NOP;
  return Object.entries(NOP.clients).map(([key, c]) => {
    const inv = NOP.invoices.filter(i => i.client === key);
    const billed = inv.filter(i => i.status !== 'draft').reduce((s, i) => s + i.total, 0);
    const outstanding = inv.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.total, 0);
    return { key, ...c, count: inv.length, billed, outstanding };
  }).sort((a, b) => b.billed - a.billed);
}

function ClientsScreen({ app }) {
  const { Avatar } = window.TaskmasterProDesignSystem_b94546;
  const NOP = window.NOP;
  const { fmt0 } = NOP;
  const { useState, useMemo } = React;

  const [clients, setClients] = useState(buildClientList);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [draft, setDraft] = useState({ name: '', contact: '', email: '', city: '' });

  const view = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter(c => !q || c.name.toLowerCase().includes(q) || (c.contact || '').toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q));
  }, [clients, search]);

  const totalBilled = clients.reduce((s, c) => s + c.billed, 0);
  const totalOut = clients.reduce((s, c) => s + c.outstanding, 0);

  const addClient = () => {
    if (!draft.name.trim()) return;
    const key = 'new_' + Math.random().toString(36).slice(2, 7);
    setClients(cs => [{ key, name: draft.name.trim(), contact: draft.contact, email: draft.email, city: draft.city, count: 0, billed: 0, outstanding: 0 }, ...cs]);
    setDraft({ name: '', contact: '', email: '', city: '' });
    setAddOpen(false);
    app.toast('Client added');
  };

  return (
    <div className="m-scroll">
      <window.ScreenHead eyebrow="Clients" title="Clients"
        trailing={<button className="m-iconbtn m-iconbtn--accent" onClick={() => setAddOpen(true)} aria-label="Add client"><i className="ph ph-plus"></i></button>}>
        <div className="m-stats" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 16, gap: 10 }}>
          <div className="m-stat" style={{ padding: '13px 12px' }}>
            <div className="m-stat-val" style={{ fontSize: 20 }}>{clients.length}</div>
            <div className="m-stat-lbl" style={{ marginTop: 3 }}>Clients</div>
          </div>
          <div className="m-stat" style={{ padding: '13px 12px' }}>
            <div className="m-stat-val" style={{ fontSize: 20 }}>{fmt0(totalBilled)}</div>
            <div className="m-stat-lbl" style={{ marginTop: 3 }}>Billed</div>
          </div>
          <div className="m-stat" style={{ padding: '13px 12px' }}>
            <div className="m-stat-val" style={{ fontSize: 20, color: totalOut ? 'var(--amber)' : 'var(--ink)' }}>{fmt0(totalOut)}</div>
            <div className="m-stat-lbl" style={{ marginTop: 3 }}>Due</div>
          </div>
        </div>
        <div className="m-search" style={{ marginTop: 14 }}>
          <i className="ph ph-magnifying-glass"></i>
          <input placeholder="Search clients…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search clients" />
        </div>
      </window.ScreenHead>

      <div className="m-body">
        {view.length === 0 ? (
          <div className="m-card"><div className="m-empty">
            <i className="ph ph-users-three"></i>
            <div className="m-empty-t">No clients found</div>
            <div className="m-empty-s">Try a different search, or add one.</div>
            <button className="m-btn m-btn--ghost" style={{ maxWidth: 200, margin: '0 auto' }} onClick={() => setSearch('')}>Clear search</button>
          </div></div>
        ) : (
          <div className="m-list m-card">
            {view.map(c => (
              <button className="m-row" key={c.key} onClick={() => setActive(c)}>
                <Avatar name={c.name} userId={c.key} size="lg" />
                <div className="m-row-main">
                  <div className="m-row-title">{c.name}</div>
                  <div className="m-row-meta">{c.city || '—'} · {c.count} invoice{c.count === 1 ? '' : 's'}</div>
                </div>
                <div className="m-row-end">
                  <span className="m-row-amt">{fmt0(c.billed)}</span>
                  {c.outstanding ? <span className="m-row-num" style={{ color: 'var(--amber)' }}>{fmt0(c.outstanding)} due</span> : <span className="m-row-num" style={{ color: 'var(--ink-4)' }}>paid up</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Client detail sheet */}
      {active ? (
        <window.Sheet onClose={() => setActive(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <Avatar name={active.name} userId={active.key} size="lg" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.01em' }}>{active.name}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-4)', marginTop: 2 }}>{active.city || '—'}</div>
            </div>
          </div>
          <div className="m-stats" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
            <div className="m-stat" style={{ padding: '13px 12px', boxShadow: 'none', background: 'var(--surface)' }}>
              <div className="m-stat-val" style={{ fontSize: 19 }}>{active.count}</div><div className="m-stat-lbl" style={{ marginTop: 3 }}>Invoices</div>
            </div>
            <div className="m-stat" style={{ padding: '13px 12px', boxShadow: 'none', background: 'var(--surface)' }}>
              <div className="m-stat-val" style={{ fontSize: 19 }}>{fmt0(active.billed)}</div><div className="m-stat-lbl" style={{ marginTop: 3 }}>Billed</div>
            </div>
            <div className="m-stat" style={{ padding: '13px 12px', boxShadow: 'none', background: 'var(--surface)' }}>
              <div className="m-stat-val" style={{ fontSize: 19, color: active.outstanding ? 'var(--amber)' : 'var(--ink)' }}>{fmt0(active.outstanding)}</div><div className="m-stat-lbl" style={{ marginTop: 3 }}>Due</div>
            </div>
          </div>
          {active.contact ? <button className="m-set-row" style={{ borderRadius: 12, border: '1px solid var(--line)', marginBottom: 8 }}><div className="m-set-ic ic-gray"><i className="ph ph-user"></i></div><div className="m-set-main"><div className="m-set-t">{active.contact}</div><div className="m-set-v">Primary contact</div></div></button> : null}
          {active.email ? <button className="m-set-row" style={{ borderRadius: 12, border: '1px solid var(--line)' }}><div className="m-set-ic ic-gray"><i className="ph ph-envelope-simple"></i></div><div className="m-set-main"><div className="m-set-t">{active.email}</div><div className="m-set-v">Email</div></div></button> : null}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button className="m-btn m-btn--ghost" onClick={() => { setActive(null); app.goTab('invoices'); }}>View invoices</button>
            <button className="m-btn m-btn--primary" onClick={() => { setActive(null); app.newInvoice(); }}><i className="ph ph-plus"></i> New invoice</button>
          </div>
        </window.Sheet>
      ) : null}

      {/* Add client sheet */}
      {addOpen ? (
        <window.Sheet title="Add client" onClose={() => setAddOpen(false)}
          foot={<React.Fragment>
            <button className="m-btn m-btn--ghost" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="m-btn m-btn--primary" onClick={addClient}>Save client</button>
          </React.Fragment>}>
          <div className="m-stack">
            <window.MField2 label="Client name"><input className="m-input" placeholder="Company or person" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} autoFocus /></window.MField2>
            <div className="m-row2">
              <window.MField2 label="Contact"><input className="m-input" placeholder="Jane Smith" value={draft.contact} onChange={e => setDraft(d => ({ ...d, contact: e.target.value }))} /></window.MField2>
              <window.MField2 label="City"><input className="m-input" placeholder="City, ST" value={draft.city} onChange={e => setDraft(d => ({ ...d, city: e.target.value }))} /></window.MField2>
            </div>
            <window.MField2 label="Email"><input className="m-input" type="email" placeholder="jane@company.com" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} /></window.MField2>
          </div>
        </window.Sheet>
      ) : null}
    </div>
  );
}

/* small field helper (shared) */
function MField2({ label, children }) {
  return <div className="m-field"><label className="m-label">{label}</label>{children}</div>;
}

Object.assign(window, { ClientsScreen, MField2 });
