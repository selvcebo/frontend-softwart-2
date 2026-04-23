// ============================================================
// src/App.tsx
// ============================================================

import { lazy, Suspense } from 'react'
import { useBackendWakeup } from '@/src/shared/hooks/useBackendWakeup'
import { SplashScreen }     from '@/src/shared/components/SplashScreen'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { checkAuthValidity } from '@/src/shared/lib/checkAuth'
import { Toaster } from 'sonner'
import { AdminSidebar }     from '@/src/shared/components/AdminSidebar'
import { LandingPage }      from '@/src/features/dashboard/components/LandingPage'

// Rutas bajo lazy loading — reducen el bundle inicial del landing
const LoginPage         = lazy(() => import('@/src/features/auth/components/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage      = lazy(() => import('@/src/features/auth/components/RegisterPage').then(m => ({ default: m.RegisterPage })))
const RecoveryPage      = lazy(() => import('@/src/features/auth/components/RecoveryPage').then(m => ({ default: m.RecoveryPage })))
const ResetPasswordPage = lazy(() => import('@/src/features/auth/components/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const AuthLayout        = lazy(() => import('@/src/features/auth/components/AuthLayout').then(m => ({ default: m.AuthLayout })))
const NotFoundPage      = lazy(() => import('@/src/features/auth/components/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const MyAccountPage     = lazy(() => import('@/src/features/account/components/MyAccountPage').then(m => ({ default: m.MyAccountPage })))
const DashboardPage     = lazy(() => import('@/src/features/dashboard/components/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ClientsPage       = lazy(() => import('@/src/features/clients/components/ClientsPage').then(m => ({ default: m.ClientsPage })))
const UsersPage         = lazy(() => import('@/src/features/users/components/UsersPage').then(m => ({ default: m.UsersPage })))
const RolesPage         = lazy(() => import('@/src/features/roles/components/RolesPage').then(m => ({ default: m.RolesPage })))
const ServicesPage      = lazy(() => import('@/src/features/services/components/ServicesPage').then(m => ({ default: m.ServicesPage })))
const AppointmentsPage  = lazy(() => import('@/src/features/appointments/components/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })))
const PaymentsPage      = lazy(() => import('@/src/features/payments/components/PaymentsPage').then(m => ({ default: m.PaymentsPage })))
const CalculatorPage    = lazy(() => import('@/src/features/calculator/components/CalculatorPage').then(m => ({ default: m.CalculatorPage })))
const SalesPage         = lazy(() => import('@/src/features/sales/components/SalesPage').then(m => ({ default: m.SalesPage })))
const OrdersPage        = lazy(() => import('@/src/features/orders/components/OrdersPage').then(m => ({ default: m.OrdersPage })))
const PermissionsPage   = lazy(() => import('@/src/features/permissions/components/PermissionsPage').then(m => ({ default: m.PermissionsPage })))

// Lee rol desde localStorage (recordarme) o sessionStorage (sesión temporal)
function getRol() { return localStorage.getItem('rol') ?? sessionStorage.getItem('rol') }

function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  // Verificar que el token no haya expirado antes de evaluar el rol
  if (!checkAuthValidity()) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  const rol = getRol()
  if (!rol) return <Navigate to="/login" replace />
  if (rol !== 'Admin' && rol !== 'Empleado') return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireCliente({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  if (!checkAuthValidity()) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  const rol = getRol()
  if (!rol) return <Navigate to="/login" replace />
  if (rol !== 'Cliente') return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminLayout() {
  const rol    = getRol()   ?? ''
  const correo = localStorage.getItem('correo') ?? sessionStorage.getItem('correo') ?? ''
  const inicial = correo.charAt(0).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="shrink-0 h-14 border-b border-border bg-card flex items-center justify-end px-6 gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">{inicial}</span>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-foreground leading-tight truncate max-w-[160px]">{correo}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{rol}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  )
}

export default function App() {
  const showSplash = useBackendWakeup()
  if (showSplash) return <SplashScreen />

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Públicas */}
          <Route path="/"          element={<LandingPage />} />

          {/* Auth — bajo AuthLayout (header con volver al inicio) */}
          <Route element={<AuthLayout />}>
            <Route path="/login"     element={<LoginPage />} />
            <Route path="/register"  element={<RegisterPage />} />
            <Route path="/recover"   element={<RecoveryPage />} />
            <Route path="/reset"     element={<ResetPasswordPage />} />
          </Route>

          {/* Área cliente */}
          <Route path="/my-account" element={<RequireCliente><MyAccountPage /></RequireCliente>} />

          {/* Panel admin */}
          <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
            <Route index              element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"   element={<DashboardPage />} />
            <Route path="clients"      element={<ClientsPage />} />
            <Route path="users"        element={<UsersPage />} />
            <Route path="roles"        element={<RolesPage />} />
            <Route path="services"     element={<ServicesPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="payments"     element={<PaymentsPage />} />
            <Route path="calculator"   element={<CalculatorPage />} />
            <Route path="sales"        element={<SalesPage />} />
            <Route path="orders"       element={<OrdersPage />} />
            <Route path="permissions"  element={<PermissionsPage />} />
            <Route path="*"           element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Catch-all global → 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>

      <Toaster position="bottom-right" richColors closeButton />
    </>
  )
}
