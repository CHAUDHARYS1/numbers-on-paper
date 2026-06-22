import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Plus, MagnifyingGlass } from '@phosphor-icons/react'

const newInvoiceBtn = (
  <Link to="/invoices/new" className="app-btn-primary">
    <Plus size={15} /> New invoice
  </Link>
)

const dashboardActions = (
  <>
    <div className="topbar-search">
      <MagnifyingGlass size={15} className="topbar-search__icon" />
      <input type="search" placeholder="Search…" aria-label="Search" className="topbar-search__input" />
    </div>
    {newInvoiceBtn}
  </>
)

// Pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import DashboardPage from '@/pages/DashboardPage'
import InvoicesPage from '@/pages/InvoicesPage'
import InvoiceEditorPage from '@/pages/InvoiceEditorPage'
import InvoicePreviewPage from '@/pages/InvoicePreviewPage'
import EmailPreviewPage from '@/pages/EmailPreviewPage'
import SettingsPage from '@/pages/SettingsPage'
import TimeTrackerPage from '@/pages/TimeTrackerPage'
import ProposalsPage from '@/pages/ProposalsPage'
import ProposalEditorPage from '@/pages/ProposalEditorPage'
import ClientsPage from '@/pages/ClientsPage'
import ClientInvoicesPage from '@/pages/ClientInvoicesPage'
import NotFoundPage from '@/pages/NotFoundPage'

// Layout
import AppShell from '@/components/layout/AppShell'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading"><span className="spinner" /></div>
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading, mfaPending } = useAuth()
  if (loading) return null
  return (user && !mfaPending) ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

      {/* Private — wrapped in AppShell */}
      <Route path="/dashboard" element={<PrivateRoute><AppShell title="Dashboard" description="Overview of your invoicing activity" actions={dashboardActions}><DashboardPage /></AppShell></PrivateRoute>} />
      <Route path="/invoices" element={<PrivateRoute><AppShell title="Invoices" description="Create, manage, and track every invoice in one place."><InvoicesPage /></AppShell></PrivateRoute>} />
      <Route path="/invoices/new" element={<PrivateRoute><AppShell><InvoiceEditorPage /></AppShell></PrivateRoute>} />
      <Route path="/invoices/:id/edit" element={<PrivateRoute><AppShell><InvoiceEditorPage /></AppShell></PrivateRoute>} />
      <Route path="/invoices/:id/preview" element={<PrivateRoute><AppShell><InvoicePreviewPage /></AppShell></PrivateRoute>} />
      <Route path="/invoices/:id/email-preview" element={<PrivateRoute><AppShell><EmailPreviewPage /></AppShell></PrivateRoute>} />
      <Route path="/clients" element={<PrivateRoute><AppShell><ClientsPage /></AppShell></PrivateRoute>} />
      <Route path="/clients/:id/invoices" element={<PrivateRoute><AppShell hideTabbar><ClientInvoicesPage /></AppShell></PrivateRoute>} />
      <Route path="/proposals" element={<PrivateRoute><AppShell title="Proposals" description="Build and send project proposals."><ProposalsPage /></AppShell></PrivateRoute>} />
      <Route path="/proposals/new"      element={<PrivateRoute><AppShell hideTabbar><ProposalEditorPage /></AppShell></PrivateRoute>} />
      <Route path="/proposals/:id/edit" element={<PrivateRoute><AppShell hideTabbar><ProposalEditorPage /></AppShell></PrivateRoute>} />
      <Route path="/time"     element={<PrivateRoute><AppShell title="Time" description="Log hours and convert them to invoice line items."><TimeTrackerPage /></AppShell></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><AppShell title="Settings" description="Manage your business profile, security, and notifications."><SettingsPage /></AppShell></PrivateRoute>} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
