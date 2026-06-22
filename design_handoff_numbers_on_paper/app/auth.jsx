/* ── Shared auth building blocks (login + sign-up) ──────── */
const { useState } = React;

// Left brand panel — shared by both auth screens
function AuthBrand() {
  const FEATURES = [
    'Create polished invoices in minutes',
    'Track paid, due & overdue at a glance',
    'Save clients and reuse them instantly',
    'Export to PDF or share a link',
  ];
  return (
    <div className="auth-left">
      <a className="auth-left-logo" href="Landing Page.html" aria-label="Numbers on Paper home">
        <img src="numbers-on-paper-assets/lockup/logo-horizontal-reversed.svg" alt="Numbers on Paper" />
      </a>
      <div className="auth-left-body">
        <h2 className="auth-headline">Invoicing that works <em>as hard as you do.</em></h2>
        <ul className="auth-features">
          {FEATURES.map(f => (
            <li className="auth-feature" key={f}><i className="ph ph-check-circle"></i>{f}</li>
          ))}
        </ul>
      </div>
      <span className="auth-tagline">Designed and built by SC Design and Consultation</span>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, autoFocus }) {
  return (
    <div className="fld">
      <label className="fld-label">{label}</label>
      <input className="fld-input" type={type} value={value} placeholder={placeholder}
             autoComplete={autoComplete} autoFocus={autoFocus}
             onChange={e => onChange(e.target.value)} />
    </div>
  );
}

// Password field with show/hide toggle
function PasswordField({ label, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="fld">
      <label className="fld-label">{label}</label>
      <div className="auth-input-wrap">
        <input className="fld-input" type={show ? 'text' : 'password'} value={value} placeholder={placeholder}
               autoComplete={autoComplete} style={{ paddingRight: 38 }}
               onChange={e => onChange(e.target.value)} />
        <button type="button" className="auth-eye" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          <i className={'ph ' + (show ? 'ph-eye-slash' : 'ph-eye')}></i>
        </button>
      </div>
    </div>
  );
}

function GoogleButton({ children }) {
  return (
    <button type="button" className="auth-oauth" onClick={() => location.href = 'Dashboard.html'}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6c1.9-5.6 7.1-9.8 13.7-9.8z"/>
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-3.9 6.8-9.7 6.8-17.4z"/>
        <path fill="#FBBC05" d="M10.3 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.8-6z"/>
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.6 0-12.2-4.5-14.2-10.5l-7.8 6C6.4 42.6 14.6 48 24 48z"/>
      </svg>
      {children}
    </button>
  );
}

window.AuthBrand = AuthBrand;
window.AuthField = Field;
window.AuthPasswordField = PasswordField;
window.GoogleButton = GoogleButton;
