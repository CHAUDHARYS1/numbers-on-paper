import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  SquaresFour, FileText, UsersThree, Scroll, GearSix,
  SignOut, List, X, Moon, Sun
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import styles from './AppShell.module.css'

const NAV_ITEMS = [
  { to: '/dashboard', Icon: SquaresFour, label: 'Dashboard' },
  { to: '/invoices',  Icon: FileText,    label: 'Invoices'  },
  { to: '/clients',   Icon: UsersThree,  label: 'Clients'   },
  { to: '/proposals', Icon: Scroll,      label: 'Proposals' },
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

export default function AppShell({ children, bare, title, description, actions, maxWidth }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const email = user?.email || ''

  const navLinks = (onClickItem) => (
    <nav className={styles.nav} aria-label="Main navigation">
      {NAV_ITEMS.map(({ to, Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => [styles.navItem, isActive ? styles.navItemOn : ''].join(' ')}
          aria-current={({ isActive }) => isActive ? 'page' : undefined}
          onClick={onClickItem}
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
          <img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" />
        </a>
        {navLinks()}
        {userFooter}
      </aside>

      {/* Mobile scrim */}
      {mobileOpen && (
        <div className={styles.scrim} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* Mobile drawer */}
      <aside className={[styles.drawer, mobileOpen ? styles.drawerOpen : ''].join(' ')}>
        <div className={styles.drawerTop}>
          <img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" style={{ height: 22 }} />
          <button className={styles.burgerBtn} onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        {navLinks(() => setMobileOpen(false))}
        {userFooter}
      </aside>

      <main className={styles.main}>
        {/* Mobile topbar */}
        <header className={styles.mTopbar}>
          <button className={styles.burgerBtn} onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <List size={20} />
          </button>
          <img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" style={{ height: 22 }} />
        </header>

        {bare ? (
          <div className={styles.contentBare}>{children}</div>
        ) : (
          <>
            {(title || actions) && (
              <header className={styles.topbar}>
                <div className={styles.topbarHead}>
                  {title && <h1 className={styles.pageTitle}>{title}</h1>}
                  {description && <p className={styles.pageDesc}>{description}</p>}
                </div>
                {actions && <div className={styles.topbarActions}>{actions}</div>}
              </header>
            )}
            <div className={styles.content} style={maxWidth ? { maxWidth, margin: '0 auto', width: '100%' } : {}}>
              {children}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
