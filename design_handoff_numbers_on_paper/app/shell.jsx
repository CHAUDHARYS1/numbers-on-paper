/* ── Shared app shell: sidebar + sticky topbar ────────────
   Composes the Taskmaster Pro Avatar/Button from the bundle.
   Every page renders <AppShell active="…" title="…"> … </AppShell>.
   ──────────────────────────────────────────────────────── */
const { Avatar, Badge } = window.TaskmasterProDesignSystem_b94546;

/* Status → [Badge tone, label]. Unpaid past due reads "Overdue". */
const NOP_STATUS = {
  paid:    ['green', 'Paid'],
  unpaid:  ['amber', 'Due'],
  overdue: ['red',   'Overdue'],
  draft:   ['gray',  'Draft'],
};
function StatusBadge({ status }) {
  const [tone, label] = NOP_STATUS[status] || ['gray', '—'];
  return <Badge tone={tone}>{label}</Badge>;
}

/* iOS-style switch built on a native checkbox. */
function Switch({ checked, onChange, id }) {
  return (
    <label className={'switch' + (checked ? ' switch--on' : '')}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} id={id} />
      <span className="switch-track"><span className="switch-thumb"></span></span>
    </label>
  );
}

window.StatusBadge = StatusBadge;
window.Switch = Switch;

const NOP_NAV = [
  { key:'dashboard', icon:'ph-squares-four', label:'Dashboard', href:'Dashboard.html' },
  { key:'invoices',  icon:'ph-file-text',    label:'Invoices',  href:'Invoices.html' },
  { key:'clients',   icon:'ph-users-three',  label:'Clients',   href:'Clients.html' },
  { key:'settings',  icon:'ph-gear-six',     label:'Settings',  href:'Settings.html' },
];

function AppShell({ active, title, description, actions, children, maxWidth = 1080 }) {
  const biz = window.NOP.business;
  const [navOpen, setNavOpen] = React.useState(false);

  const nav = (onClick) => (
    <nav className="side-nav">
      {NOP_NAV.map(n => (
        <a key={n.key} href={n.href} onClick={onClick}
           className={'nav-item' + (n.key === active ? ' nav-item--on' : '')}
           aria-current={n.key === active ? 'page' : undefined}>
          <i className={'ph ' + n.icon} aria-hidden="true"></i>
          <span>{n.label}</span>
        </a>
      ))}
    </nav>
  );

  const userFoot = (
    <div className="side-foot">
      <Avatar name={biz.owner} userId="u_owner" size="lg" />
      <div className="side-user">
        <div className="side-user-name">{biz.owner}</div>
        <div className="side-user-mail">{biz.name}</div>
      </div>
      <a className="side-out" href="Login.html" title="Sign out" aria-label="Sign out"><i className="ph ph-sign-out"></i></a>
    </div>
  );

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <aside className="side">
        <a className="side-logo" href="Dashboard.html" aria-label="Numbers on Paper home">
          <img src="numbers-on-paper-assets/lockup/logo-horizontal.svg" alt="Numbers on Paper" />
        </a>
        {nav()}
        {userFoot}
      </aside>

      {/* Mobile drawer */}
      {navOpen ? <div className="m-scrim" onClick={() => setNavOpen(false)}></div> : null}
      <aside className={'m-drawer' + (navOpen ? ' m-drawer--open' : '')}>
        <div className="m-drawer-top">
          <a className="side-logo" href="Dashboard.html" style={{ margin: 0, padding: 0 }}><img src="numbers-on-paper-assets/lockup/logo-horizontal.svg" alt="Numbers on Paper" /></a>
          <button className="m-burger" onClick={() => setNavOpen(false)} aria-label="Close menu"><i className="ph ph-x"></i></button>
        </div>
        {nav(() => setNavOpen(false))}
        {userFoot}
      </aside>

      <main className="main">
        {/* Mobile top bar */}
        <header className="m-topbar">
          <button className="m-burger" onClick={() => setNavOpen(true)} aria-label="Open menu"><i className="ph ph-list"></i></button>
          <a href="Dashboard.html" aria-label="Numbers on Paper home"><img src="numbers-on-paper-assets/lockup/logo-horizontal.svg" alt="Numbers on Paper" /></a>
        </header>

        <header className="topbar">
          <div className="topbar-head">
            <h1 className="page-title">{title}</h1>
            {description ? <p className="page-desc">{description}</p> : null}
          </div>
          {actions ? <div className="topbar-actions">{actions}</div> : null}
        </header>
        <div className="content" style={{ maxWidth, margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

window.AppShell = AppShell;
