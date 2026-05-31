import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Save, Upload } from 'lucide-react'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [saving,        setSaving]        = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '', business_name: '', tagline: 'Web Design & Consultation',
    address_line1: '', address_line2: '', city: '', state: '', zip: '',
    phone: '', email: '',
    default_rate: 50,
    show_tax: false, show_discount: false, show_notes: true,
    tax_rate: 0, payment_terms: 'Net 30', notes_default: '',
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
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }
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
    if (error) {
      toast.error('Failed to save settings. Please try again.')
    } else {
      toast.success('Settings saved!')
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your business profile and invoice defaults"
        action={
          <Button variant="primary" size="md" icon={<Save size={15} />} loading={saving} onClick={handleSave}>
            Save changes
          </Button>
        }
      />

      <div className={styles.sections}>
        {/* Business profile */}
        <Card>
          <CardHeader title="Business profile" description="This info appears on your invoices" />
          <CardBody>
            <div className={styles.stack}>
              {/* Logo upload */}
              <div className={styles.logoSection}>
                <div className={styles.logoPreview}>
                  {profile.logo_url
                    ? <img src={profile.logo_url} alt="Company logo" className={styles.logoPreviewImg} />
                    : <span className={styles.logoPlaceholderText}>No logo</span>
                  }
                </div>
                <div className={styles.logoInfo}>
                  <input
                    type="file"
                    accept="image/*"
                    id="logo-upload"
                    className={styles.fileInputHidden}
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                  />
                  <label htmlFor="logo-upload" className={styles.logoUploadLabel}>
                    <Upload size={13} />
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

        {/* Invoice defaults */}
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
                  className={styles.textarea}
                  rows={3}
                  placeholder="Payment due within 30 days. Thank you for your business."
                  value={profile.notes_default}
                  onChange={set('notes_default')}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Template options */}
        <Card>
          <CardHeader title="Template options" description="Toggle which sections appear on invoices by default" />
          <CardBody>
            <div className={styles.toggleGroup}>
              <label className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>Show discount field</div>
                  <div className={styles.toggleHint}>Add a discount line to invoices</div>
                </div>
                <input type="checkbox" className={styles.toggle} checked={profile.show_discount} onChange={set('show_discount')} />
              </label>

              <label className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>Show tax</div>
                  <div className={styles.toggleHint}>Add a tax line to invoices</div>
                </div>
                <input type="checkbox" className={styles.toggle} checked={profile.show_tax} onChange={set('show_tax')} />
              </label>

              {profile.show_tax && (
                <div className={styles.taxRateWrap}>
                  <Input label="Default tax rate (%)" type="number" min="0" max="100" step="0.01" value={profile.tax_rate} onChange={set('tax_rate')} />
                </div>
              )}

              <label className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleLabel}>Show notes & terms</div>
                  <div className={styles.toggleHint}>Include a notes section at the bottom</div>
                </div>
                <input type="checkbox" className={styles.toggle} checked={profile.show_notes} onChange={set('show_notes')} />
              </label>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
