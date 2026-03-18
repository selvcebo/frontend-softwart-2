// src/features/auth/components/AuthLayout.tsx
// Layout compartido para Login, Registro, Recuperar y Reset
// Úsalo en App.tsx como wrapper de las rutas de auth
import { Outlet } from 'react-router-dom'
import { AuthHeader } from './AuthHeader'
 
export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <AuthHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-card rounded-xl shadow-lg p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
 