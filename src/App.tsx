// ============================================================
// src/App.tsx
// ============================================================
import { lazy, Suspense }   from 'react'
import { ClientesPage }     from '@/src/features/clientes/components/ClientesPage'
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
import { CalculadoraPage }  from '@/src/features/calculadora/components/CalculadoraPage'
import { VentasPage }       from '@/src/features/ventas/components/VentasPage'
import { PedidosPage }      from '@/src/features/pedidos/components/PedidosPage'
import { PermisosPage }     from '@/src/features/permisos/components/PermisosPage'
import { AuthLayout }       from '@/src/features/auth/components/AuthLayout'
import { NotFoundPage }     from '@/src/features/auth/components/NotFoundPage'
import { RecuperarPage }    from '@/src/features/auth/components/RecuperarPage'
import { ResetPasswordPage } from '@/src/features/auth/components/ResetPasswordPage'
import { LoginPage }        from '@/src/features/auth/components/LoginPage'
import { RegisterPage }     from '@/src/features/auth/components/RegisterPage'
import { LandingPage }      from '@/src/features/dashboard/components/LandingPage'
import { MiCuentaPage }     from '@/src/features/cuenta/components/MiCuentaPage'

// ── Dev-only pages (src/dev/ está en .gitignore — no van a producción) ───────
// @vite-ignore evita que Vite intente resolver el import en el build de prod
const SkeletonDemoPage = import.meta.env.DEV
  ? lazy(() => (import(/* @vite-ignore */ '@/src/dev/SkeletonDemoPage') as Promise<any>)
      .then((m: any) => ({ default: m.SkeletonDemoPage }))
      .catch(() => ({ default: () => null }))
    )
  : null

const StitchLandingDemo = import.meta.env.DEV
  ? lazy(() => (import(/* @vite-ignore */ '@/src/dev/StitchLandingDemo') as Promise<any>)
      .then((m: any) => ({ default: m.StitchLandingDemo }))
      .catch(() => ({ default: () => null }))
    )
  : null

const LandingPageV2 = import.meta.env.DEV
  ? lazy(() => (import(/* @vite-ignore */ '@/src/dev/LandingPageV2') as Promise<any>)
      .then((m: any) => ({ default: m.LandingPageV2 }))
      .catch(() => ({ default: () => null }))
    )
  : null

const LoginPageV2 = import.meta.env.DEV
  ? lazy(() => (import(/* @vite-ignore */ '@/src/dev/LoginPageV2') as Promise<any>)
      .then((m: any) => ({ default: m.LoginPageV2 }))
      .catch(() => ({ default: () => null }))
    )
  : null

const RegisterPageV2 = import.meta.env.DEV
  ? lazy(() => (import(/* @vite-ignore */ '@/src/dev/RegisterPageV2') as Promise<any>)
      .then((m: any) => ({ default: m.RegisterPageV2 }))
      .catch(() => ({ default: () => null }))
    )
  : null

const RecuperarPageV2 = import.meta.env.DEV
  ? lazy(() => (import(/* @vite-ignore */ '@/src/dev/RecuperarPageV2') as Promise<any>)
      .then((m: any) => ({ default: m.RecuperarPageV2 }))
      .catch(() => ({ default: () => null }))
    )
  : null

const ResetPasswordPageV2 = import.meta.env.DEV
  ? lazy(() => (import(/* @vite-ignore */ '@/src/dev/ResetPasswordPageV2') as Promise<any>)
      .then((m: any) => ({ default: m.ResetPasswordPageV2 }))
      .catch(() => ({ default: () => null }))
    )
  : null

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
  return (
    <>
      <Routes>
        {/* Públicas */}
        <Route path="/"          element={<LandingPage />} />

        {/* Auth — bajo AuthLayout (header con volver al inicio) */}
        <Route element={<AuthLayout />}>
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/registro"  element={<RegisterPage />} />
          <Route path="/recuperar" element={<RecuperarPage />} />
          <Route path="/reset"     element={<ResetPasswordPage />} />
        </Route>

        {/* Área cliente */}
        <Route path="/mi-cuenta" element={<RequireCliente><MiCuentaPage /></RequireCliente>} />

        {/* Panel admin */}
        <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
          <Route index              element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"   element={<DashboardPage />} />
          <Route path="clientes"    element={<ClientesPage />} />
          <Route path="usuarios"    element={<UsersPage />} />
          <Route path="roles"       element={<RolesPage />} />
          <Route path="servicios"   element={<ServicesPage />} />
          <Route path="citas"       element={<AppointmentsPage />} />
          <Route path="pagos"       element={<PaymentsPage />} />
          <Route path="calculadora" element={<CalculadoraPage />} />
          <Route path="ventas"      element={<VentasPage />} />
          <Route path="pedidos"     element={<PedidosPage />} />
          <Route path="permisos"    element={<PermisosPage />} />
          {/* Dev-only routes — solo disponibles en localhost */}
          {import.meta.env.DEV && SkeletonDemoPage && (
            <Route path="dev/skeleton" element={
              <Suspense fallback={null}><SkeletonDemoPage /></Suspense>
            } />
          )}
          <Route path="*"           element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Dev-only — vistas sin admin layout */}
        {import.meta.env.DEV && StitchLandingDemo && (
          <Route path="/dev/landing" element={
            <Suspense fallback={null}><StitchLandingDemo /></Suspense>
          } />
        )}
        {import.meta.env.DEV && LandingPageV2 && (
          <Route path="/dev/landing-v2" element={
            <Suspense fallback={null}><LandingPageV2 /></Suspense>
          } />
        )}
        {import.meta.env.DEV && LoginPageV2 && (
          <Route path="/dev/login" element={
            <Suspense fallback={null}><LoginPageV2 /></Suspense>
          } />
        )}
        {import.meta.env.DEV && RegisterPageV2 && (
          <Route path="/dev/register" element={
            <Suspense fallback={null}><RegisterPageV2 /></Suspense>
          } />
        )}
        {import.meta.env.DEV && RecuperarPageV2 && (
          <Route path="/dev/recuperar" element={
            <Suspense fallback={null}><RecuperarPageV2 /></Suspense>
          } />
        )}
        {import.meta.env.DEV && ResetPasswordPageV2 && (
          <Route path="/dev/reset" element={
            <Suspense fallback={null}><ResetPasswordPageV2 /></Suspense>
          } />
        )}

        {/* Catch-all global → 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster position="bottom-right" richColors closeButton />
    </>
  )
}