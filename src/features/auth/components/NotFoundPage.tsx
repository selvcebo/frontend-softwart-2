// src/features/auth/components/NotFoundPage.tsx (o donde prefieras)
// Página 404 — ruta catch-all en App.tsx: <Route path="*" element={<NotFoundPage />} />
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/src/shared/components/ui/button'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

function getToken() { return localStorage.getItem('token') ?? sessionStorage.getItem('token') }
function getRol()   { return localStorage.getItem('rol')   ?? sessionStorage.getItem('rol') }

export function NotFoundPage() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()
  const token = getToken()
  const rol   = getRol()

  const homeRoute = token && (rol === 'Admin' || rol === 'Empleado')
    ? '/admin/dashboard'
    : token && rol === 'Cliente'
      ? '/my-account'
      : '/'

  const homeLabel = token && (rol === 'Admin' || rol === 'Empleado')
    ? 'Ir al panel'
    : token && rol === 'Cliente'
      ? 'Ir a mi cuenta'
      : 'Ir al inicio'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6">

        {/* Ícono */}
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>

        {/* Texto */}
        <div className="flex flex-col gap-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <p className="text-xl font-semibold text-foreground">Página no encontrada</p>
          <p className="text-sm text-muted-foreground">
            La ruta{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">
              {pathname}
            </code>{' '}
            no existe o fue movida.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2 flex-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button
            onClick={() => navigate(homeRoute, { replace: true })}
            className="gap-2 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Home className="h-4 w-4" />
            {homeLabel}
          </Button>
        </div>

      </div>
    </div>
  )
}