import { createPortal } from 'react-dom'
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  FloppyDisk, UploadSimple, LockKey, ShieldCheck, Trash, SignOut,
  Storefront, ImageSquare, CurrencyDollar, CalendarBlank,
  MoonStars, CaretRight, Question, X,
} from '@phosphor-icons/react'
import styles from './SettingsPage.module.css'

// ── Change Password ────────────────────────────────────────────────

function PasswordSection({ user, toast }) {
  const [form, setForm]     = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const setField = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleChange = async (e) => {
    e.preventDefault()
    if (form.next !== form.confirm) { toast.error("New passwords don't match."); return }
    if (form.next.length < 8) { toast.error('New password must be at least 8 characters.'); return }
    setSaving(true)
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password: form.current })
    if (authErr) { toast.error('Current password is incorrect.'); setSaving(false); return }
    const { error } = await supabase.auth.updateUser({ password: form.next })
    setSaving(false)
    if (error) { toast.error('Failed to update password.'); return }
    toast.success('Password updated!')
    setForm({ current: '', next: '', confirm: '' })
  }

  return (
    <div className={styles.subsection}>
      <div className={styles.subsectionHead}>
        <LockKey size={16} />
        <div>
          <div className={styles.subsectionTitle}>Change password</div>
          <div className={styles.subsectionHint}>Use at least 8 characters.</div>
        </div>
      </div>
      <form onSubmit={handleChange} className={styles.pwForm} noValidate>
        <Input
          label="Current password"
          type={showPw ? 'text' : 'password'}
          value={form.current}
          onChange={setField('current')}
          autoComplete="current-password"
          required
        />
        <div className={styles.row2}>
          <Input
            label="New password"
            type={showPw ? 'text' : 'password'}
            value={form.next}
            onChange={setField('next')}
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm new password"
            type={showPw ? 'text' : 'password'}
            value={form.confirm}
            onChange={setField('confirm')}
            autoComplete="new-password"
            required
          />
        </div>
        <div className={styles.pwActions}>
          <label className={styles.showPwLabel}>
            <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} />
            Show passwords
          </label>
          <Button type="submit" variant="secondary" size="sm" loading={saving}>
            Update password
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── Two-Factor Authentication ──────────────────────────────────────

function TwoFactorSection({ toast }) {
  const [factors,    setFactors]    = useState([])
  const [step,       setStep]       = useState('idle') // idle | verifying | confirming-disable
  const [enrollData, setEnrollData] = useState(null)   // { id, qrCode, secret }
  const [code,       setCode]       = useState('')
  const [loading,    setLoading]    = useState(false)
  const [fetching,   setFetching]   = useState(true)

  const loadFactors = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors(data?.totp?.filter(f => f.status === 'verified') ?? [])
    setFetching(false)
  }, [])

  useEffect(() => { loadFactors() }, [loadFactors])

  const isEnabled = factors.length > 0

  const handleEnable = async () => {
    setLoading(true)
    // Clean up any leftover unverified factors before enrolling
    const { data: all } = await supabase.auth.mfa.listFactors()
    for (const f of all?.totp ?? []) {
      if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id })
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator app',
    })
    setLoading(false)
    if (error) { toast.error('Failed to set up 2FA. Please try again.'); return }
    setEnrollData({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret })
    setStep('verifying')
    setCode('')
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) { toast.error('Enter the 6-digit code from your authenticator app.'); return }
    setLoading(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollData.id, code })
    setLoading(false)
    if (error) { toast.error('Invalid code. Please try again.'); setCode(''); return }
    toast.success('Two-factor authentication enabled!')
    setStep('idle')
    setEnrollData(null)
    setCode('')
    await loadFactors()
  }

  const handleCancelEnroll = async () => {
    if (enrollData?.id) await supabase.auth.mfa.unenroll({ factorId: enrollData.id })
    setStep('idle')
    setEnrollData(null)
    setCode('')
  }

  const handleDisableConfirm = async () => {
    setLoading(true)
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factors[0].id })
    setLoading(false)
    if (error) { toast.error('Failed to disable 2FA. Please try again.'); return }
    toast.success('Two-factor authentication disabled.')
    setStep('idle')
    await loadFactors()
  }

  return (
    <div className={styles.subsection}>
      <div className={styles.subsectionHead}>
        <ShieldCheck size={16} />
        <div>
          <div className={styles.subsectionTitle}>Two-factor authentication</div>
          <div className={styles.subsectionHint}>
            {isEnabled
              ? 'Your account is protected with an authenticator app.'
              : 'Add an extra layer of security when signing in.'}
          </div>
        </div>
        {!fetching && (
          <span className={isEnabled ? styles.mfaBadgeOn : styles.mfaBadgeOff}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        )}
      </div>

      {step === 'idle' && !fetching && (
        <div className={styles.mfaIdle}>
          {isEnabled ? (
            <Button variant="secondary" size="sm" onClick={() => setStep('confirming-disable')}>
              Disable 2FA
            </Button>
          ) : (
            <Button variant="secondary" size="sm" loading={loading} onClick={handleEnable}>
              Enable 2FA
            </Button>
          )}
        </div>
      )}

      {step === 'verifying' && enrollData && (
        <div className={styles.mfaEnrollWrap}>
          <p className={styles.mfaStep}>
            <strong>Step 1.</strong> Scan this QR code with Google Authenticator, Authy, or any TOTP app.
          </p>
          <img src={enrollData.qrCode} alt="QR code for authenticator app setup" className={styles.qrImg} />
          <details className={styles.secretDetails}>
            <summary>Can't scan? Enter the setup key manually</summary>
            <code className={styles.secretCode}>{enrollData.secret}</code>
          </details>
          <p className={styles.mfaStep}>
            <strong>Step 2.</strong> Enter the 6-digit code your app shows to confirm setup.
          </p>
          <form onSubmit={handleVerify} className={styles.mfaVerifyForm} noValidate>
            <Input
              label="Authentication code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              autoComplete="one-time-code"
              autoFocus
            />
            <div className={styles.mfaActions}>
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelEnroll}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={loading}>
                Confirm &amp; enable
              </Button>
            </div>
          </form>
        </div>
      )}

      {step === 'confirming-disable' && (
        <div className={styles.mfaDisableConfirm}>
          <p className={styles.mfaDisableText}>
            Disabling 2FA removes the extra security layer from your account. Are you sure?
          </p>
          <div className={styles.mfaActions}>
            <Button variant="ghost" size="sm" onClick={() => setStep('idle')}>Cancel</Button>
            <Button variant="danger" size="sm" loading={loading} onClick={handleDisableConfirm}>
              Yes, disable 2FA
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Delete Account Modal ───────────────────────────────────────────

function DeleteAccountModal({ user, onCancel, toast, navigate, signOut }) {
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onCancel])

  const handleDelete = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password })
    if (authErr) { toast.error('Incorrect password.'); setLoading(false); return }
    const { error } = await supabase.rpc('delete_user')
    if (error) { toast.error('Could not delete account. Please contact support.'); setLoading(false); return }
    await signOut()
    navigate('/')
  }

  return createPortal(
    <div
      className={styles.modalBackdrop}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.modalIcon}><Trash size={22} /></div>
        <h2 className={styles.modalTitle} id="delete-account-title">Delete account</h2>
        <p className={styles.modalMsg}>
          This will permanently delete your account, all invoices, and client data.
          This action <strong>cannot be undone</strong>.
        </p>
        <form onSubmit={handleDelete} className={styles.modalForm} noValidate>
          <Input
            label="Enter your password to confirm"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" size="sm" loading={loading}>
              Delete my account
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ── Settings Page ──────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { theme, preference, setThemePreference } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()
  const [saving,             setSaving]             = useState(false)
  const [uploadingLogo,      setUploadingLogo]      = useState(false)
  const [deleteOpen,         setDeleteOpen]         = useState(false)
  const [profileSheetOpen,   setProfileSheetOpen]   = useState(false)
  const [passwordSheetOpen,  setPasswordSheetOpen]  = useState(false)
  const [twoFASheetOpen,     setTwoFASheetOpen]     = useState(false)

  const [profile, setProfile] = useState({
    full_name: '', business_name: '', tagline: 'Web Design & Consultation',
    address_line1: '', address_line2: '', city: '', state: '', zip: '',
    phone: '', email: '',
    default_rate: 50,
    show_tax: false, show_discount: false, show_notes: true,
    tax_rate: 0, payment_terms: 'Net 30', notes_default: '',
    notif_invoice_due: true, notif_payment_received: true, notif_weekly_summary: false,
  })

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(p => ({ ...p, ...data })) })
  }, [user])

  const set = (field) => (e) => setProfile(p => ({
    ...p,
    [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }))

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return }
    setUploadingLogo(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/logo.${ext}`
    const { error: uploadError } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (uploadError) {
      toast.error('Failed to upload logo. Make sure the logos storage bucket exists in Supabase.')
      setUploadingLogo(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
    const logoUrl = `${publicUrl}?t=${Date.now()}`
    setProfile(p => ({ ...p, logo_url: logoUrl }))
    await supabase.from('profiles').update({ logo_url: logoUrl }).eq('id', user.id)
    setUploadingLogo(false)
    toast.success('Logo uploaded!')
    e.target.value = ''
  }

  const handleRemoveLogo = async () => {
    setProfile(p => ({ ...p, logo_url: null }))
    await supabase.from('profiles').update({ logo_url: null }).eq('id', user.id)
    toast.success('Logo removed.')
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({ ...profile, id: user.id })
    setSaving(false)
    if (error) { toast.error('Failed to save settings. Please try again.') }
    else { toast.success('Settings saved!') }
  }

  const handleSignOutMobile = async () => {
    await signOut()
    navigate('/')
  }

  const displayName = profile.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'

  return (
    <div>

      {/* ══════════════════════════════════════════
          MOBILE LAYOUT
         ══════════════════════════════════════════ */}
      <div className="m-only">
        <div className="m-head">
          <div className="m-head-top">
            <div>
              <div className="m-eyebrow">Account</div>
              <h1 className="m-title">Settings</h1>
              <p className="m-sub">Manage your profile, security, and notifications.</p>
            </div>
          </div>
        </div>

        <div className="m-body">

          {/* Profile row */}
          <button
            className="m-profile m-press"
            style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            onClick={() => setProfileSheetOpen(true)}
          >
            <div className={styles.mAva}>{(displayName[0] || '?').toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="m-profile-name">{displayName}</div>
              <div className="m-profile-mail">{user?.email}</div>
            </div>
            <CaretRight size={18} className="m-chev" />
          </button>

          {/* Business */}
          <div className="m-section-label">Business</div>
          <div className="m-settings-group">
            <button className="m-set-row" onClick={() => setProfileSheetOpen(true)}>
              <div className="m-set-ic ic-accent"><Storefront size={17} /></div>
              <div className="m-set-main">
                <div className="m-set-t">Business profile</div>
                <div className="m-set-v">{profile.business_name || 'Not set'}</div>
              </div>
              <CaretRight size={16} className="m-chev" />
            </button>
            <label className="m-set-row" htmlFor="logo-upload-m" style={{ cursor: 'pointer' }}>
              <div className="m-set-ic ic-gray"><ImageSquare size={17} /></div>
              <div className="m-set-main">
                <div className="m-set-t">Logo</div>
                <div className="m-set-v">{uploadingLogo ? 'Uploading…' : profile.logo_url ? 'Uploaded' : 'No logo'}</div>
              </div>
              {profile.logo_url
                ? <img src={profile.logo_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'contain', border: '1px solid var(--line)' }} />
                : <CaretRight size={16} className="m-chev" />
              }
            </label>
            <input
              type="file" accept="image/*" id="logo-upload-m"
              className={styles.fileInputHidden}
              onChange={handleLogoUpload} disabled={uploadingLogo}
            />
          </div>

          {/* Invoice defaults */}
          <div className="m-section-label">Invoice defaults</div>
          <div className="m-settings-group">
            <div className="m-set-row" style={{ cursor: 'default' }}>
              <div className="m-set-ic ic-gray"><CurrencyDollar size={17} /></div>
              <div className="m-set-main">
                <div className="m-set-t">Default hourly rate</div>
                <div className="m-set-v">Applied to new line items</div>
              </div>
              <span className="m-row-amt" style={{ fontSize: 14 }}>${profile.default_rate}/hr</span>
            </div>
            <div className="m-set-row" style={{ cursor: 'default' }}>
              <div className="m-set-ic ic-gray"><CalendarBlank size={17} /></div>
              <div className="m-set-main">
                <div className="m-set-t">Payment terms</div>
                <div className="m-set-v">Default due window</div>
              </div>
              <span className="m-row-amt" style={{ fontSize: 14 }}>{profile.payment_terms || 'Net 30'}</span>
            </div>
          </div>

          {/* Appearance */}
          <div className="m-section-label">Appearance</div>
          <div className="m-settings-group">
            <div className="m-set-row" style={{ cursor: 'default', alignItems: 'center' }}>
              <div className="m-set-ic ic-accent"><MoonStars size={17} /></div>
              <div className="m-set-main"><div className="m-set-t">Theme</div></div>
              <div className="m-seg">
                <button className={preference === 'light'  ? 'on' : ''} onClick={() => setThemePreference('light')}>Light</button>
                <button className={preference === 'dark'   ? 'on' : ''} onClick={() => setThemePreference('dark')}>Dark</button>
                <button className={preference === 'system' ? 'on' : ''} onClick={() => setThemePreference('system')}>Auto</button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="m-section-label">Notifications</div>
          <div className="m-settings-group" style={{ padding: '0 18px' }}>
            <label className="m-toggle-row">
              <div className="m-toggle-main">
                <div className="m-toggle-t">Invoice due reminders</div>
                <div className="m-toggle-d">Nudge when due date approaches</div>
              </div>
              <input type="checkbox" className={styles.toggle} checked={!!profile.notif_invoice_due} onChange={set('notif_invoice_due')} />
            </label>
            <label className="m-toggle-row">
              <div className="m-toggle-main">
                <div className="m-toggle-t">Payment received</div>
                <div className="m-toggle-d">Confirmation when invoice is paid</div>
              </div>
              <input type="checkbox" className={styles.toggle} checked={!!profile.notif_payment_received} onChange={set('notif_payment_received')} />
            </label>
            <label className="m-toggle-row">
              <div className="m-toggle-main">
                <div className="m-toggle-t">Weekly summary</div>
                <div className="m-toggle-d">Monday recap of activity</div>
              </div>
              <input type="checkbox" className={styles.toggle} checked={!!profile.notif_weekly_summary} onChange={set('notif_weekly_summary')} />
            </label>
          </div>

          {/* Security */}
          <div className="m-section-label">Security</div>
          <div className="m-settings-group">
            <button className="m-set-row" onClick={() => setPasswordSheetOpen(true)}>
              <div className="m-set-ic ic-gray"><LockKey size={17} /></div>
              <div className="m-set-main"><div className="m-set-t">Change password</div></div>
              <CaretRight size={16} className="m-chev" />
            </button>
            <button className="m-set-row" onClick={() => setTwoFASheetOpen(true)}>
              <div className="m-set-ic ic-green"><ShieldCheck size={17} /></div>
              <div className="m-set-main">
                <div className="m-set-t">Two-factor authentication</div>
              </div>
              <CaretRight size={16} className="m-chev" />
            </button>
          </div>

          {/* Support */}
          <div className="m-section-label">Support</div>
          <div className="m-settings-group">
            <button className="m-set-row" onClick={() => toast.info?.('Help & support coming soon.')}>
              <div className="m-set-ic ic-gray"><Question size={17} /></div>
              <div className="m-set-main"><div className="m-set-t">Help &amp; support</div></div>
              <CaretRight size={16} className="m-chev" />
            </button>
            <button className="m-set-row" onClick={() => toast.info?.('Privacy & terms coming soon.')}>
              <div className="m-set-ic ic-gray"><ShieldCheck size={17} /></div>
              <div className="m-set-main"><div className="m-set-t">Privacy &amp; terms</div></div>
              <CaretRight size={16} className="m-chev" />
            </button>
          </div>

          {/* Danger */}
          <div className="m-section-label">Danger zone</div>
          <div className="m-settings-group">
            <button className="m-set-row" onClick={() => setDeleteOpen(true)}>
              <div className="m-set-ic" style={{ background: 'var(--red-tint)', color: 'var(--red)', width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center' }}>
                <Trash size={17} />
              </div>
              <div className="m-set-main">
                <div className="m-set-t" style={{ color: 'var(--red)' }}>Delete account</div>
              </div>
              <CaretRight size={16} className="m-chev" />
            </button>
          </div>

          <button className="m-btn m-btn--danger" style={{ marginTop: 22 }} onClick={handleSignOutMobile}>
            <SignOut size={18} /> Sign out
          </button>
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', marginTop: 16, letterSpacing: '.04em' }}>
            Numbers on Paper · v1.0
          </p>
        </div>

        {/* ── Profile sheet ── */}
        {profileSheetOpen && (
          <div className="m-scrim" onClick={() => setProfileSheetOpen(false)}>
            <div className="m-sheet" onClick={e => e.stopPropagation()}>
              <div className="m-sheet-grip" />
              <div className="m-sheet-h">
                <h3>Business profile</h3>
                <button className="m-iconbtn m-iconbtn--ghost" onClick={() => setProfileSheetOpen(false)} aria-label="Close"><X size={20} /></button>
              </div>
              <div className="m-sheet-body">
                <div className="m-stack">
                  <div className="m-field"><label className="m-label">Your name</label><input className="m-input" value={profile.full_name} onChange={set('full_name')} placeholder="Shital Chaudhary" /></div>
                  <div className="m-field"><label className="m-label">Business name</label><input className="m-input" value={profile.business_name} onChange={set('business_name')} placeholder="SC Design" /></div>
                  <div className="m-field"><label className="m-label">Tagline</label><input className="m-input" value={profile.tagline} onChange={set('tagline')} placeholder="Web Design & Consultation" /></div>
                  <div className="m-field"><label className="m-label">Email</label><input className="m-input" type="email" value={profile.email} onChange={set('email')} placeholder="you@example.com" /></div>
                  <div className="m-field"><label className="m-label">Phone</label><input className="m-input" value={profile.phone} onChange={set('phone')} placeholder="(224) 410-5089" /></div>
                  <div className="m-field"><label className="m-label">Address</label><input className="m-input" value={profile.address_line1} onChange={set('address_line1')} placeholder="5833 N Paulina St" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: 10 }}>
                    <div className="m-field"><label className="m-label">City</label><input className="m-input" value={profile.city} onChange={set('city')} /></div>
                    <div className="m-field"><label className="m-label">State</label><input className="m-input" value={profile.state} onChange={set('state')} /></div>
                    <div className="m-field"><label className="m-label">ZIP</label><input className="m-input" value={profile.zip} onChange={set('zip')} /></div>
                  </div>
                  <div className="m-field"><label className="m-label">Default hourly rate ($)</label><input className="m-input" type="number" min="0" value={profile.default_rate} onChange={set('default_rate')} /></div>
                  <div className="m-field"><label className="m-label">Payment terms</label><input className="m-input" value={profile.payment_terms} onChange={set('payment_terms')} placeholder="Net 30" /></div>
                </div>
              </div>
              <div className="m-sheet-foot">
                <button className="m-btn m-btn--ghost" onClick={() => setProfileSheetOpen(false)}>Cancel</button>
                <button className="m-btn m-btn--primary" disabled={saving} onClick={async () => { await handleSave(); setProfileSheetOpen(false) }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Password sheet ── */}
        {passwordSheetOpen && (
          <div className="m-scrim" onClick={() => setPasswordSheetOpen(false)}>
            <div className="m-sheet" onClick={e => e.stopPropagation()}>
              <div className="m-sheet-grip" />
              <div className="m-sheet-h">
                <h3>Change password</h3>
                <button className="m-iconbtn m-iconbtn--ghost" onClick={() => setPasswordSheetOpen(false)} aria-label="Close"><X size={20} /></button>
              </div>
              <div className="m-sheet-body">
                <PasswordSection user={user} toast={toast} onDone={() => setPasswordSheetOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* ── 2FA sheet ── */}
        {twoFASheetOpen && (
          <div className="m-scrim" onClick={() => setTwoFASheetOpen(false)}>
            <div className="m-sheet" onClick={e => e.stopPropagation()}>
              <div className="m-sheet-grip" />
              <div className="m-sheet-h">
                <h3>Two-factor auth</h3>
                <button className="m-iconbtn m-iconbtn--ghost" onClick={() => setTwoFASheetOpen(false)} aria-label="Close"><X size={20} /></button>
              </div>
              <div className="m-sheet-body">
                <TwoFactorSection toast={toast} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP LAYOUT
         ══════════════════════════════════════════ */}
      <div className="d-only">
        <div className="page-header">
          <div className="page-header__left">
            <h1 className="page-header__title">Settings</h1>
            <p className="page-header__desc">Manage your business profile, security, and notifications.</p>
          </div>
          <div className="page-header__right">
            <Button variant="primary" size="md" icon={<FloppyDisk size={15} />} loading={saving} onClick={handleSave}>
              Save changes
            </Button>
          </div>
        </div>

        <div className={styles.sections}>

          {/* ── Business profile ── */}
          <Card>
            <CardHeader title="Business profile" description="This info appears on your invoices" />
            <CardBody>
              <div className={styles.stack}>
                <div className={styles.logoSection}>
                  <div className={styles.logoPreview}>
                    {profile.logo_url
                      ? <img src={profile.logo_url} alt="Company logo" className={styles.logoPreviewImg} />
                      : <span className={styles.logoPlaceholderText}>No logo</span>
                    }
                  </div>
                  <div className={styles.logoInfo}>
                    <input
                      type="file" accept="image/*" id="logo-upload"
                      className={styles.fileInputHidden}
                      onChange={handleLogoUpload} disabled={uploadingLogo}
                    />
                    <label htmlFor="logo-upload" className={styles.logoUploadLabel}>
                      <UploadSimple size={13} />
                      {uploadingLogo ? 'Uploading…' : profile.logo_url ? 'Change logo' : 'Upload logo'}
                    </label>
                    {profile.logo_url && (
                      <button className={styles.logoRemoveBtn} onClick={handleRemoveLogo}>Remove</button>
                    )}
                    <p className={styles.logoHint}>PNG, JPG or SVG · Shown on all invoices</p>
                  </div>
                </div>
                <div className={styles.row2}>
                  <Input label="Your name" placeholder="Shital Chaudhary" value={profile.full_name} onChange={set('full_name')} />
                  <Input label="Business name" placeholder="SC Design and Consultation" value={profile.business_name} onChange={set('business_name')} />
                </div>
                <Input label="Tagline" placeholder="Web Design & Consultation" value={profile.tagline} onChange={set('tagline')} />
                <Input label="Address line 1" placeholder="5833 N Paulina St" value={profile.address_line1} onChange={set('address_line1')} />
                <Input label="Address line 2" placeholder="Suite, floor, etc." value={profile.address_line2} onChange={set('address_line2')} />
                <div className={styles.row3}>
                  <Input label="City" value={profile.city} onChange={set('city')} />
                  <Input label="State" value={profile.state} onChange={set('state')} />
                  <Input label="ZIP" value={profile.zip} onChange={set('zip')} />
                </div>
                <div className={styles.row2}>
                  <Input label="Phone" placeholder="(224) 410-5089" value={profile.phone} onChange={set('phone')} />
                  <Input label="Email" type="email" placeholder="you@example.com" value={profile.email} onChange={set('email')} />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* ── Invoice defaults ── */}
          <Card>
            <CardHeader title="Invoice defaults" description="Applied automatically when creating a new invoice" />
            <CardBody>
              <div className={styles.stack}>
                <div className={styles.row2}>
                  <Input label="Default hourly rate ($)" type="number" min="0" value={profile.default_rate} onChange={set('default_rate')} />
                  <Input label="Payment terms" placeholder="Net 30" value={profile.payment_terms} onChange={set('payment_terms')} />
                </div>
                <div>
                  <label className={styles.fieldLabel}>Default notes / terms</label>
                  <textarea
                    className={styles.textarea} rows={3}
                    placeholder="Payment due within 30 days. Thank you for your business."
                    value={profile.notes_default} onChange={set('notes_default')}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* ── Template options ── */}
          <Card>
            <CardHeader title="Template options" description="Toggle which sections appear on invoices by default" />
            <CardBody>
              <div className={styles.toggleGroup}>
                <label className={styles.toggleRow}>
                  <div><div className={styles.toggleLabel}>Show discount field</div><div className={styles.toggleHint}>Add a discount line to invoices</div></div>
                  <input type="checkbox" className={styles.toggle} checked={profile.show_discount} onChange={set('show_discount')} />
                </label>
                <label className={styles.toggleRow}>
                  <div><div className={styles.toggleLabel}>Show tax</div><div className={styles.toggleHint}>Add a tax line to invoices</div></div>
                  <input type="checkbox" className={styles.toggle} checked={profile.show_tax} onChange={set('show_tax')} />
                </label>
                {profile.show_tax && (
                  <div className={styles.taxRateWrap}>
                    <Input label="Default tax rate (%)" type="number" min="0" max="100" step="0.01" value={profile.tax_rate} onChange={set('tax_rate')} />
                  </div>
                )}
                <label className={styles.toggleRow}>
                  <div><div className={styles.toggleLabel}>Show notes &amp; terms</div><div className={styles.toggleHint}>Include a notes section at the bottom</div></div>
                  <input type="checkbox" className={styles.toggle} checked={profile.show_notes} onChange={set('show_notes')} />
                </label>
              </div>
            </CardBody>
          </Card>

          {/* ── Account & security ── */}
          <Card>
            <CardHeader title="Account & security" description="Manage your password and two-factor authentication" />
            <CardBody>
              <PasswordSection user={user} toast={toast} />
              <div className={styles.sectionDivider} />
              <TwoFactorSection toast={toast} />
            </CardBody>
          </Card>

          {/* ── Email notifications ── */}
          <Card>
            <CardHeader title="Email notifications" description="Choose which emails you receive from us" />
            <CardBody>
              <div className={styles.toggleGroup}>
                <label className={styles.toggleRow}>
                  <div><div className={styles.toggleLabel}>Invoice due reminders</div><div className={styles.toggleHint}>Get notified when a client invoice is approaching its due date</div></div>
                  <input type="checkbox" className={styles.toggle} checked={!!profile.notif_invoice_due} onChange={set('notif_invoice_due')} />
                </label>
                <label className={styles.toggleRow}>
                  <div><div className={styles.toggleLabel}>Payment received</div><div className={styles.toggleHint}>Confirmation email when you mark an invoice as paid</div></div>
                  <input type="checkbox" className={styles.toggle} checked={!!profile.notif_payment_received} onChange={set('notif_payment_received')} />
                </label>
                <label className={styles.toggleRow}>
                  <div><div className={styles.toggleLabel}>Weekly summary</div><div className={styles.toggleHint}>A weekly overview of your invoicing activity and outstanding balances</div></div>
                  <input type="checkbox" className={styles.toggle} checked={!!profile.notif_weekly_summary} onChange={set('notif_weekly_summary')} />
                </label>
              </div>
            </CardBody>
          </Card>

          {/* ── Danger zone ── */}
          <Card className={styles.dangerCard}>
            <CardHeader title="Danger zone" description="Irreversible account actions" />
            <CardBody>
              <div className={styles.dangerRow}>
                <div>
                  <div className={styles.dangerLabel}>Delete account</div>
                  <div className={styles.dangerText}>
                    Permanently delete your account and all associated invoices, clients, and data. This cannot be undone.
                  </div>
                </div>
                <Button variant="danger" size="sm" icon={<Trash size={14} />} onClick={() => setDeleteOpen(true)}>
                  Delete account
                </Button>
              </div>
            </CardBody>
          </Card>

        </div>
      </div>

      {deleteOpen && (
        <DeleteAccountModal
          user={user}
          onCancel={() => setDeleteOpen(false)}
          toast={toast}
          navigate={navigate}
          signOut={signOut}
        />
      )}
    </div>
  )
}
