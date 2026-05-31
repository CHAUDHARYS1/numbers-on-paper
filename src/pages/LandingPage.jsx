import { Link } from 'react-router-dom'
import { FileText, Zap, Shield, Download, ChevronRight, Check, LogIn, ArrowRight } from 'lucide-react'
import styles from './LandingPage.module.css'

const FEATURES = [
  { icon: Zap,      title: 'Create in seconds',      desc: 'Fill in your client info and line items — your invoice is ready instantly.' },
  { icon: Download, title: 'Download as PDF',         desc: 'One click to export a clean, professional PDF ready to send.' },
  { icon: Shield,   title: 'Stored securely',         desc: 'All your invoices saved in the cloud, accessible from any device.' },
  { icon: FileText, title: 'Multiple templates',      desc: 'Choose from templates that match your brand. More coming soon.' },
]

const FREE_FEATURES = [
  'Unlimited invoices',
  'PDF export',
  'Client management',
  'Invoice tracking (paid / unpaid)',
  'Cloud storage',
  'Customizable templates',
]

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* Nav */}
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLogo}>
            <img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" className={styles.logoImg} />
          </div>
          <div className={styles.navActions}>
            <Link to="/login" className={styles.navLogin} aria-label="Sign in">
              <LogIn size={15} />
              <span className={styles.navLoginLabel}>Sign in</span>
            </Link>
            <Link to="/signup" className={styles.navCta}>
              <span className={styles.navCtaFull}>Get started free</span>
              <span className={styles.navCtaShort}>Get started</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Free forever — no credit card needed
          </div>
          <h1 className={styles.heroHeadline}>
            Professional invoices,<br />
            <span className={styles.heroAccent}>done in minutes.</span>
          </h1>
          <p className={styles.heroSub}>
            Create, send, and track invoices for your freelance business.
            Built for web designers, consultants, and independent professionals.
          </p>
          <div className={styles.heroCtas}>
            <Link to="/signup" className={styles.heroCtaPrimary}>
              Create your free account
              <ChevronRight size={18} />
            </Link>
            <Link to="/login" className={styles.heroCtaSecondary}>
              Sign in
            </Link>
          </div>
        </div>

        {/* Invoice mockup */}
        <div className={styles.heroVisual}>
          <div className={styles.mockupCard}>
            <div className={styles.mockupHeader}>
              <div>
                <div className={styles.mockupTitle}>Invoice #INV-000042</div>
                <div className={styles.mockupSub}>Pixel Studio</div>
              </div>
              <span className={styles.mockupBadgeUnpaid}>Unpaid</span>
            </div>
            <div className={styles.mockupDivider} />
            <div className={styles.mockupRow}>
              <div>
                <div className={styles.mockupLabel}>Bill to</div>
                <div className={styles.mockupVal}>Orbit Creative</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={styles.mockupLabel}>Due</div>
                <div className={styles.mockupVal}>July 15, 2026</div>
              </div>
            </div>
            <div className={styles.mockupTable}>
              <div className={styles.mockupTableHead}>
                <span>Item</span><span>Hrs</span><span>Cost</span>
              </div>
              {[
                ['Homepage Redesign',   '6', '$600'],
                ['Brand Consultation',  '2', '$200'],
                ['Mobile Optimization', '4', '$400'],
              ].map(([item, hrs, cost]) => (
                <div key={item} className={styles.mockupTableRow}>
                  <span>{item}</span><span>{hrs}</span><span>{cost}</span>
                </div>
              ))}
            </div>
            <div className={styles.mockupTotal}>
              <span>Grand total</span>
              <span className={styles.mockupTotalAmt}>$1,200.00</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Everything you need, nothing you don't.</h2>
          <p className={styles.sectionSub}>No bloated software. No monthly fees. Just invoicing that works.</p>
          <div className={styles.featureGrid}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Icon size={20} />
                </div>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free plan */}
      <section className={styles.pricing}>
        <div className={styles.sectionInner}>
          <div className={styles.pricingCard}>
            <div className={styles.pricingLeft}>
              <div className={styles.pricingBadge}>Free plan</div>
              <div className={styles.pricingPrice}>$0<span>/month</span></div>
              <p className={styles.pricingNote}>Free forever. Paid plans with more features coming soon.</p>
              <Link to="/signup" className={styles.pricingCta}>
                Get started free <ChevronRight size={16} />
              </Link>
            </div>
            <ul className={styles.pricingList}>
              {FREE_FEATURES.map(f => (
                <li key={f} className={styles.pricingItem}>
                  <Check size={16} className={styles.pricingCheck} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" className={styles.logoImg} />
          </div>
          <p className={styles.footerNote}>Built for freelancers. Free to use.</p>
        </div>
      </footer>
    </div>
  )
}
