import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeSlash, FileText, PaperPlaneTilt, ChartLine, CheckCircle } from '@phosphor-icons/react'
import styles from './AuthPage.module.css'

export default function SignupPage() {
  const { signUp } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!firstName.trim() || !lastName.trim()) { setError('Please enter your first and last name.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    const { error } = await signUp(email, password, firstName.trim(), lastName.trim())
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className={styles.split}>
        <div className={styles.left}>
          <div className={styles.leftLogo}><img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" /></div>
          <div className={styles.leftBody}>
            <h2 className={styles.headline}>Almost<br /><em>there!</em></h2>
          </div>
          <div className={styles.tagline}>"Numbers on Paper — simple invoicing."</div>
        </div>
        <div className={styles.right}>
          <div className={styles.card} style={{ textAlign: 'center' }}>
            <div className={styles.successIcon}><CheckCircle size={28} weight="fill" /></div>
            <h1 className={styles.title}>Check your email</h1>
            <p className={styles.sub}>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
            <Link to="/login" className={styles.backLink}>Back to sign in</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.split}>
      <div className={styles.left}>
        <div className={styles.leftLogo}><img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" /></div>
        <div className={styles.leftBody}>
          <h2 className={styles.headline}>Invoice smarter,<br />get paid <em>faster</em></h2>
          <ul className={styles.features}>
            <li className={styles.feature}><FileText size={20} className={styles.featureIcon} />Professional invoices in seconds</li>
            <li className={styles.feature}><PaperPlaneTilt size={20} className={styles.featureIcon} />Send directly to clients via email</li>
            <li className={styles.feature}><ChartLine size={20} className={styles.featureIcon} />Track revenue and outstanding balances</li>
          </ul>
        </div>
        <div className={styles.tagline}>"Free forever — no credit card needed."</div>
      </div>
      <div className={styles.right}>
        <div className={styles.card}>
          <Link to="/" className={styles.cardLogo}><img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" /></Link>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.sub}>Start invoicing in minutes. Free forever.</p>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.nameRow}>
              <div className={styles.fld}>
                <label className={styles.fldLabel} htmlFor="first-name">First name</label>
                <input id="first-name" className={styles.fldInput} type="text" placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} required autoComplete="given-name" autoFocus />
              </div>
              <div className={styles.fld}>
                <label className={styles.fldLabel} htmlFor="last-name">Last name</label>
                <input id="last-name" className={styles.fldInput} type="text" placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} required autoComplete="family-name" />
              </div>
            </div>
            <div className={styles.fld}>
              <label className={styles.fldLabel} htmlFor="email">Email</label>
              <input id="email" className={styles.fldInput} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className={styles.fld}>
              <label className={styles.fldLabel} htmlFor="password">Password</label>
              <div className={styles.pwWrap}>
                <input
                  id="password"
                  className={styles.fldInput}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: 40 }}
                />
                <button type="button" className={styles.pwEye} onClick={() => setShowPw(p => !p)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeSlash size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div className={styles.fld}>
              <label className={styles.fldLabel} htmlFor="confirm">Confirm password</label>
              <input id="confirm" className={styles.fldInput} type={showPw ? 'text' : 'password'} placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="new-password" />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>
          <p className={styles.switchLink}>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
