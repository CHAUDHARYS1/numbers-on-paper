import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const { signIn, setMfaPending } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // MFA challenge step
  const [step, setStep]               = useState('credentials') // 'credentials' | 'mfa'
  const [mfaCode, setMfaCode]         = useState('')
  const [mfaChallenge, setMfaChallenge] = useState(null) // { factorId, challengeId }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await signIn(email, password)
    if (signInError) { setError(signInError.message); setLoading(false); return }

    // Check if the user's account requires an MFA step-up
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.[0]
      if (totp) {
        const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totp.id })
        if (challengeErr) { setError('Failed to start 2FA challenge.'); setLoading(false); return }
        // Tell PublicRoute not to redirect while we complete MFA
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
      factorId:   mfaChallenge.factorId,
      challengeId: mfaChallenge.challengeId,
      code:        mfaCode,
    })

    setLoading(false)
    if (error) { setError('Invalid code. Please try again.'); setMfaCode(''); return }

    setMfaPending(false)
    navigate('/dashboard')
  }

  const handleBackToLogin = () => {
    setMfaPending(false)
    setStep('credentials')
    setError('')
    setMfaCode('')
    setMfaChallenge(null)
  }

  if (step === 'mfa') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <Link to="/" className={styles.logoWrap}>
            <img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" className={styles.logoImg} />
          </Link>

          <h1 className={styles.title}>Two-factor authentication</h1>
          <p className={styles.sub}>Enter the 6-digit code from your authenticator app.</p>

          <form onSubmit={handleMfaVerify} className={styles.form} noValidate>
            <Input
              label="Authentication code"
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
            {error && <p className={styles.errorMsg} role="alert">{error}</p>}
            <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%' }}>
              Verify
            </Button>
          </form>

          <p className={styles.switchLink}>
            <button
              type="button"
              onClick={handleBackToLogin}
              style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer' }}
            >
              ← Back to sign in
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.logoWrap}>
          <img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" className={styles.logoImg} />
        </Link>

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.sub}>Sign in to your account</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <p className={styles.errorMsg} role="alert">{error}</p>}
          <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%' }}>
            Sign in
          </Button>
        </form>

        <p className={styles.switchLink}>
          Don't have an account? <Link to="/signup">Create one free</Link>
        </p>
      </div>
    </div>
  )
}
