import { NavLink, useNavigate } from 'react-router-dom'
import {
  SquaresFour, FileText, UsersThree, GearSix,
  Scroll, SignOut, Moon, Sun
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import styles from './AppShell.module.css'

const NAV_ITEMS = [
  { to: '/dashboard', Icon: SquaresFour, label: 'Dashboard' },
  { to: '/invoices',  Icon: FileText,    label: 'Invoices'  },
  { to: '/proposals', Icon: Scroll,      label: 'Proposals' },
  { to: '/clients',   Icon: UsersThree,  label: 'Clients'   },
  { to: '/settings',  Icon: GearSix,     label: 'Settings'  },
]

/* Mobile tab items: 5 regular tabs */
const MOB_TABS = [
  { to: '/dashboard', Icon: SquaresFour, label: 'Home'      },
  { to: '/invoices',  Icon: FileText,    label: 'Invoices'  },
  { to: '/proposals', Icon: Scroll,      label: 'Proposals' },
  { to: '/clients',   Icon: UsersThree,  label: 'Clients'   },
  { to: '/settings',  Icon: GearSix,     label: 'Settings'  },
]

function Avatar({ name, size = 'md' }) {
  const initials = (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['#2563EB','#15803d','#7c3aed','#c2410c','#be185d','#0f766e']
  const color = colors[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length]
  const dim = size === 'lg' ? 36 : size === 'sm' ? 24 : 30
  return (
    <div className={styles.avatar} style={{ width: dim, height: dim, background: color, fontSize: dim * 0.38 }}>
      {initials}
    </div>
  )
}

export default function AppShell({ children, bare, title, description, actions, maxWidth, hideTabbar }) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const email = user?.email || ''

  const navLinks = (
    <nav className={styles.nav} aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => [styles.navItem, isActive ? styles.navItemOn : ''].join(' ')}
          aria-current={({ isActive }) => isActive ? 'page' : undefined}
        >
          <Icon size={18} weight="regular" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )

  const userFooter = (
    <div className={styles.sideFooter}>
      <Avatar name={displayName} size="lg" />
      <div className={styles.userInfo}>
        <div className={styles.userName}>{displayName}</div>
        <div className={styles.userEmail}>{email}</div>
      </div>
      <div className={styles.footerActions}>
        <button
          className={styles.iconAction}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          className={styles.iconAction}
          onClick={handleSignOut}
          aria-label="Sign out"
          title="Sign out"
        >
          <SignOut size={16} />
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.shell}>
      {/* Desktop sidebar */}
      <aside className={styles.side}>
        <a href="/dashboard" className={styles.sideLogo} aria-label="Numbers on Paper home">
          <img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" className={styles.logoLight} />
          <img src="/lockup/logo-horizontal-light.svg" alt="Numbers on Paper" className={styles.logoDark} />
        </a>
        {navLinks}
        {userFooter}
      </aside>

      <main className={styles.main}>
        {bare ? (
          <div className={styles.contentBare}>{children}</div>
        ) : (
          <>
            {(title || actions) && (
              <header className={styles.topbar}>
                <div className={styles.topbarInner}>
                  <div className={styles.topbarHead}>
                    {title && <h1 className={styles.pageTitle}>{title}</h1>}
                    {description && <p className={styles.pageDesc}>{description}</p>}
                  </div>
                  {actions && <div className={styles.topbarActions}>{actions}</div>}
                </div>
              </header>
            )}
            <div className={styles.content}>
              {children}
            </div>
          </>
        )}

        {/* Mobile bottom tab bar */}
        <nav className={`${styles.tabbar}${hideTabbar ? ` ${styles.tabbarHidden}` : ''}`} aria-label="Main navigation">
          {MOB_TABS.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => [styles.tab, isActive ? styles.tabOn : ''].join(' ')}
              aria-current={({ isActive }) => isActive ? 'page' : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  )
}
