import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Eye, EyeSlash, FileText, PaperPlaneTilt, ChartLine } from '@phosphor-icons/react'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const { signIn, setMfaPending } = useAuth()
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const [step,         setStep]         = useState('credentials')
  const [mfaCode,      setMfaCode]      = useState('')
  const [mfaChallenge, setMfaChallenge] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: signInError } = await signIn(email, password)
    if (signInError) { setError(signInError.message); setLoading(false); return }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.[0]
      if (totp) {
        const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totp.id })
        if (challengeErr) { setError('Failed to start 2FA challenge.'); setLoading(false); return }
        setMfaPending(true)
        setMfaChallenge({ factorId: totp.id, challengeId: challenge.id })
        setStep('mfa')
        setLoading(false)
        return
      }
    }
    setLoading(false)
    navigate('/dashboard')
  }

  const handleMfaVerify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.mfa.verify({
      factorId:    mfaChallenge.factorId,
      challengeId: mfaChallenge.challengeId,
      code:        mfaCode,
    })
    setLoading(false)
    if (error) { setError('Invalid code. Please try again.'); setMfaCode(''); return }
    setMfaPending(false)
    navigate('/dashboard')
  }

  if (step === 'mfa') {
    return (
      <div className={styles.split}>
        <div className={styles.left}>
          <div className={styles.leftLogo}><img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" /></div>
          <div className={styles.leftBody}>
            <h2 className={styles.headline}>Two-factor<br /><em>authentication</em></h2>
            <ul className={styles.features}>
              <li className={styles.feature}><FileText size={20} className={styles.featureIcon} />Your account is protected</li>
              <li className={styles.feature}><PaperPlaneTilt size={20} className={styles.featureIcon} />Verify your identity to continue</li>
            </ul>
          </div>
          <div className={styles.tagline}>"Numbers on Paper — simple invoicing."</div>
        </div>
        <div className={styles.right}>
          <div className={styles.card}>
            <Link to="/" className={styles.cardLogo}><img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" /></Link>
            <h1 className={styles.title}>Two-factor authentication</h1>
            <p className={styles.sub}>Enter the 6-digit code from your authenticator app.</p>
            <form onSubmit={handleMfaVerify} className={styles.form} noValidate>
              <div className={styles.fld}>
                <label className={styles.fldLabel} htmlFor="mfa-code">Authentication code</label>
                <input
                  id="mfa-code"
                  className={styles.fldInput}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.btnSubmit} disabled={loading}>
                {loading ? 'Verifying…' : 'Verify'}
              </button>
            </form>
            <button
              type="button"
              className={styles.backLink}
              onClick={() => { setMfaPending(false); setStep('credentials'); setError(''); setMfaCode(''); setMfaChallenge(null) }}
            >
              ← Back to sign in
            </button>
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
        <div className={styles.tagline}>"Finally, an invoice tool that gets out of the way."</div>
      </div>
      <div className={styles.right}>
        <div className={styles.card}>
          <Link to="/" className={styles.cardLogo}><img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" /></Link>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.sub}>Sign in to your workspace to keep invoicing.</p>
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.fld}>
              <label className={styles.fldLabel} htmlFor="email">Email</label>
              <input
                id="email"
                className={styles.fldInput}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className={styles.fld}>
              <div className={styles.fldRow}>
                <label className={styles.fldLabel} htmlFor="password">Password</label>
              </div>
              <div className={styles.pwWrap}>
                <input
                  id="password"
                  className={styles.fldInput}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                />
                <button type="button" className={styles.pwEye} onClick={() => setShowPw(p => !p)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeSlash size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className={styles.switchLink}>No account yet? <Link to="/signup">Create one free</Link></p>
        </div>
      </div>
    </div>
  )
}
