import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Save } from 'lucide-react'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const { user } = useAuth()
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
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

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('profiles').upsert({ ...profile, id: user.id })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your business profile and invoice defaults"
        action={
          <Button variant="primary" size="md" icon={<Save size={15} />} loading={saving} onClick={handleSave}>
            {saved ? 'Saved!' : 'Save changes'}
          </Button>
        }
      />

      <div className={styles.sections}>
        {/* Business profile */}
        <Card>
          <CardHeader title="Business profile" description="This info appears on your invoices" />
          <CardBody>
            <div className={styles.stack}>
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
                <div style={{ marginLeft: 'auto', width: 160 }}>
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
