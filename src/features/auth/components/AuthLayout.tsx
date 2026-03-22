// src/features/auth/components/AuthLayout.tsx
// Layout compartido para Login, Registro, Recuperar y Reset
// Úsalo en App.tsx como wrapper de las rutas de auth
import { Outlet } from 'react-router-dom'
import { AuthHeader } from './AuthHeader'
 
export function AuthLayout() {
  return <Outlet />
}
 