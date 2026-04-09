// ============================================================
// src/App.tsx
// ============================================================

import { useBackendWakeup } from '@/src/shared/hooks/useBackendWakeup'
import { SplashScreen }     from '@/src/shared/components/SplashScreen'
import { ClientsPage }      from '@/src/features/clients/components/ClientsPage'
import { DashboardPage }    from '@/src/features/dashboard/components/DashboardPage'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { checkAuthValidity } from '@/src/shared/lib/checkAuth'
import { Toaster } from 'sonner'
import { AdminSidebar }     from '@/src/shared/components/AdminSidebar'
import { UsersPage }        from '@/src/features/users/components/UsersPage'
import { RolesPage }        from '@/src/features/roles/components/RolesPage'
import { ServicesPage }     from '@/src/features/services/components/ServicesPage'
import { AppointmentsPage } from '@/src/features/appointments/components/AppointmentsPage'
import { PaymentsPage }     from '@/src/features/payments/components/PaymentsPage'
import { CalculatorPage }   from '@/src/features/calculator/components/CalculatorPage'
import { SalesPage }        from '@/src/features/sales/components/SalesPage'
import { OrdersPage }       from '@/src/features/orders/components/OrdersPage'
import { PermissionsPage }  from '@/src/features/permissions/components/PermissionsPage'
import { AuthLayout }       from '@/src/features/auth/components/AuthLayout'
import { NotFoundPage }     from '@/src/features/auth/components/NotFoundPage'
import { RecoveryPage }     from '@/src/features/auth/components/RecoveryPage'
import { ResetPasswordPage } from '@/src/features/auth/components/ResetPasswordPage'
import { LoginPage }        from '@/src/features/auth/components/LoginPage'
import { RegisterPage }     from '@/src/features/auth/components/RegisterPage'
import { LandingPage }      from '@/src/features/dashboard/components/LandingPage'
import { MyAccountPage }    from '@/src/features/account/components/MyAccountPage'

// Lee token de localStorage (recordarme) o sessionStorage (sesión temporal)
function getToken() { return localStorage.getItem('token') ?? sessionStorage.getItem('token') }
function getRol()   { return localStorage.getItem('rol')   ?? sessionStorage.getItem('rol') }

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

export default function App() {
  const showSplash = useBackendWakeup()
  if (showSplash) return <SplashScreen />

  return (
    <>
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

      <Toaster position="bottom-right" richColors closeButton />
    </>
  )
}