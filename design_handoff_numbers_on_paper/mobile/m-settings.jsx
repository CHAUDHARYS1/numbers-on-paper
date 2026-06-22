/* ── Settings + Login ─────────────────────────────────── */
function SettingsScreen({ app }) {
  const { Avatar } = window.TaskmasterProDesignSystem_b94546;
  const NOP = window.NOP;
  const biz = NOP.business;
  const { useState } = React;

  const [editOpen, setEditOpen] = useState(false);
  const [prof, setProf] = useState({ ...biz });
  const [notif, setNotif] = useState({ reminders: true, overdue: true, weekly: false });

  return (
    <div className="m-scroll">
      <window.ScreenHead eyebrow="Account" title="Settings" />

      <div className="m-body">
        {/* Profile */}
        <button className="m-profile m-press" style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => { setProf({ ...biz }); setEditOpen(true); }}>
          <Avatar name={biz.owner} userId="u_owner" size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="m-profile-name">{biz.owner}</div>
            <div className="m-profile-mail">{biz.email}</div>
          </div>
          <i className="ph ph-caret-right m-chev"></i>
        </button>

        {/* Business */}
        <div className="m-section-label">Business</div>
        <div className="m-settings-group">
          <button className="m-set-row" onClick={() => { setProf({ ...biz }); setEditOpen(true); }}>
            <div className="m-set-ic ic-accent"><i className="ph ph-storefront"></i></div>
            <div className="m-set-main"><div className="m-set-t">Business profile</div><div className="m-set-v">{biz.name}</div></div>
            <i className="ph ph-caret-right m-chev"></i>
          </button>
          <button className="m-set-row" onClick={() => app.toast('Logo upload')}>
            <div className="m-set-ic ic-gray"><i className="ph ph-image-square"></i></div>
            <div className="m-set-main"><div className="m-set-t">Logo &amp; branding</div><div className="m-set-v">Mark · brand blue</div></div>
            <i className="ph ph-caret-right m-chev"></i>
          </button>
          <button className="m-set-row" onClick={() => app.toast('Payment details')}>
            <div className="m-set-ic ic-green"><i className="ph ph-bank"></i></div>
            <div className="m-set-main"><div className="m-set-t">Payment details</div><div className="m-set-v">Bank transfer · ACH</div></div>
            <i className="ph ph-caret-right m-chev"></i>
          </button>
        </div>

        {/* Invoice defaults */}
        <div className="m-section-label">Invoice defaults</div>
        <div className="m-settings-group">
          <div className="m-set-row" style={{ cursor: 'default' }}>
            <div className="m-set-ic ic-gray"><i className="ph ph-percent"></i></div>
            <div className="m-set-main"><div className="m-set-t">Default tax rate</div><div className="m-set-v">Applied to new invoices</div></div>
            <span className="m-row-amt" style={{ fontSize: 14 }}>7%</span>
          </div>
          <div className="m-set-row" style={{ cursor: 'default' }}>
            <div className="m-set-ic ic-gray"><i className="ph ph-currency-dollar"></i></div>
            <div className="m-set-main"><div className="m-set-t">Currency</div><div className="m-set-v">United States Dollar</div></div>
            <span className="m-row-amt" style={{ fontSize: 14 }}>USD</span>
          </div>
          <div className="m-set-row" style={{ cursor: 'default' }}>
            <div className="m-set-ic ic-gray"><i className="ph ph-calendar-check"></i></div>
            <div className="m-set-main"><div className="m-set-t">Payment terms</div><div className="m-set-v">Default due window</div></div>
            <span className="m-row-amt" style={{ fontSize: 14 }}>Net 14</span>
          </div>
        </div>

        {/* Appearance */}
        <div className="m-section-label">Appearance</div>
        <div className="m-settings-group">
          <div className="m-set-row" style={{ cursor: 'default', alignItems: 'center' }}>
            <div className="m-set-ic ic-accent"><i className="ph ph-moon-stars"></i></div>
            <div className="m-set-main"><div className="m-set-t">Theme</div></div>
            <div className="m-seg" style={{ width: 150 }}>
              <button className={app.theme === 'light' ? 'on' : ''} onClick={() => app.setTheme('light')}>Light</button>
              <button className={app.theme === 'dark' ? 'on' : ''} onClick={() => app.setTheme('dark')}>Dark</button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="m-section-label">Notifications</div>
        <div className="m-settings-group" style={{ padding: '0 18px' }}>
          <div className="m-toggle-row">
            <div className="m-toggle-main"><div className="m-toggle-t">Payment reminders</div><div className="m-toggle-d">Nudge clients before the due date</div></div>
            <window.MSwitch checked={notif.reminders} onChange={v => setNotif(n => ({ ...n, reminders: v }))} />
          </div>
          <div className="m-toggle-row">
            <div className="m-toggle-main"><div className="m-toggle-t">Overdue alerts</div><div className="m-toggle-d">Alert me when an invoice goes past due</div></div>
            <window.MSwitch checked={notif.overdue} onChange={v => setNotif(n => ({ ...n, overdue: v }))} />
          </div>
          <div className="m-toggle-row">
            <div className="m-toggle-main"><div className="m-toggle-t">Weekly summary</div><div className="m-toggle-d">A Monday recap of what's outstanding</div></div>
            <window.MSwitch checked={notif.weekly} onChange={v => setNotif(n => ({ ...n, weekly: v }))} />
          </div>
        </div>

        {/* About */}
        <div className="m-section-label">Support</div>
        <div className="m-settings-group">
          <button className="m-set-row" onClick={() => app.toast('Help center')}>
            <div className="m-set-ic ic-gray"><i className="ph ph-question"></i></div>
            <div className="m-set-main"><div className="m-set-t">Help &amp; support</div></div>
            <i className="ph ph-caret-right m-chev"></i>
          </button>
          <button className="m-set-row" onClick={() => app.toast('Privacy policy')}>
            <div className="m-set-ic ic-gray"><i className="ph ph-shield-check"></i></div>
            <div className="m-set-main"><div className="m-set-t">Privacy &amp; terms</div></div>
            <i className="ph ph-caret-right m-chev"></i>
          </button>
        </div>

        <button className="m-btn m-btn--danger" style={{ marginTop: 22 }} onClick={app.signOut}><i className="ph ph-sign-out"></i> Sign out</button>
        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', marginTop: 16, letterSpacing: '.04em' }}>Numbers on Paper · v1.0</p>
      </div>

      {editOpen ? (
        <window.Sheet title="Business profile" onClose={() => setEditOpen(false)}
          foot={<React.Fragment>
            <button className="m-btn m-btn--ghost" onClick={() => setEditOpen(false)}>Cancel</button>
            <button className="m-btn m-btn--primary" onClick={() => { setEditOpen(false); app.toast('Profile saved'); }}>Save</button>
          </React.Fragment>}>
          <div className="m-stack">
            <window.MField2 label="Owner name"><input className="m-input" value={prof.owner} onChange={e => setProf(p => ({ ...p, owner: e.target.value }))} /></window.MField2>
            <window.MField2 label="Business name"><input className="m-input" value={prof.name} onChange={e => setProf(p => ({ ...p, name: e.target.value }))} /></window.MField2>
            <window.MField2 label="Email"><input className="m-input" type="email" value={prof.email} onChange={e => setProf(p => ({ ...p, email: e.target.value }))} /></window.MField2>
            <window.MField2 label="Phone"><input className="m-input m-input--mono" value={prof.phone} onChange={e => setProf(p => ({ ...p, phone: e.target.value }))} /></window.MField2>
            <window.MField2 label="Address"><input className="m-input" value={prof.line1} onChange={e => setProf(p => ({ ...p, line1: e.target.value }))} /></window.MField2>
            <window.MField2 label="City, State ZIP"><input className="m-input" value={prof.line2} onChange={e => setProf(p => ({ ...p, line2: e.target.value }))} /></window.MField2>
          </div>
        </window.Sheet>
      ) : null}
    </div>
  );
}

/* ── Login ──────────────────────────────────────────────── */
function LoginScreen({ app }) {
  const { useState } = React;
  const [email, setEmail] = useState('hello@scdesign.co');
  const [pw, setPw] = useState('password');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim() || !pw) { setError('Enter your email and password to continue.'); return; }
    setError('');
    app.signIn();
  };

  return (
    <div className="m-scroll">
      <div className="m-auth">
        <img className="m-auth-logo" src="numbers-on-paper-assets/lockup/logo-horizontal.svg" alt="Numbers on Paper" />
        <h1 className="m-auth-title">Welcome back</h1>
        <p className="m-auth-sub">Sign in to your workspace to keep invoicing.</p>

        <form className="m-auth-form" onSubmit={submit} noValidate>
          <window.MField2 label="Email"><input className="m-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></window.MField2>
          <div>
            <div className="m-auth-meta" style={{ marginBottom: 7 }}>
              <label className="m-label">Password</label>
              <span className="m-auth-link" onClick={() => app.toast('Reset link sent')}>Forgot?</span>
            </div>
            <div className="m-pw-wrap">
              <input className="m-input" type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" style={{ paddingRight: 48 }} />
              <button type="button" className="m-pw-toggle" onClick={() => setShow(s => !s)} aria-label="Toggle password"><i className={'ph ' + (show ? 'ph-eye-slash' : 'ph-eye')}></i></button>
            </div>
          </div>
          {error ? <div className="m-banner bn-red" style={{ margin: 0 }}><i className="ph ph-warning-circle"></i><div className="m-banner-t" style={{ fontWeight: 600 }}>{error}</div></div> : null}
          <button type="submit" className="m-btn m-btn--primary m-btn--block" style={{ marginTop: 4 }}>Sign in</button>
        </form>

        <div className="m-divider">or</div>
        <button className="m-google" onClick={app.signIn}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" /> Continue with Google
        </button>
        <p className="m-auth-switch">No account yet? <a onClick={app.signIn}>Create one free</a></p>
      </div>
    </div>
  );
}

Object.assign(window, { SettingsScreen, LoginScreen });
