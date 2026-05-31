import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Clock, Plus, Settings,
  LogOut, Menu, X, Moon, Sun
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import styles from './AppShell.module.css'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices',  icon: FileText,        label: 'Invoices' },
  { to: '/time',      icon: Clock,           label: 'Time' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
]

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'SC'

  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={[styles.sidebar, mobileOpen ? styles.sidebarOpen : ''].join(' ')}>
        {/* Logo */}
        <div className={styles.logo}>
          <img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" className={styles.sidebarLogoImg} />
          <button
            className={styles.mobileClose}
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Invoice CTA */}
        <div className={styles.newInvoiceWrap}>
          <NavLink to="/invoices/new" className={styles.newInvoiceBtn} onClick={() => setMobileOpen(false)}>
            <Plus size={16} />
            New Invoice
          </NavLink>
        </div>

        {/* Nav */}
        <nav className={styles.nav} aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [styles.navItem, isActive ? styles.navItemActive : ''].join(' ')
              }
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} className={styles.navIcon} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User / Sign Out */}
        <div className={styles.userArea}>
          <div className={styles.userRow}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
          <div className={styles.bottomActions}>
            <button
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button className={styles.signOutBtn} onClick={handleSignOut}>
              <LogOut size={15} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Mobile top bar */}
        <div className={styles.topBar}>
          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <img src="/lockup/logo-horizontal.svg" alt="Numbers on Paper" className={styles.topBarLogoImg} />
          <button
            className={styles.topBarTheme}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}
