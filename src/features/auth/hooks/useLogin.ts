// src/features/auth/hooks/useLogin.ts
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '@/src/shared/lib/apiClient'
import type { LoginResponse } from '../types'
import { saveAuth, saveCredentials, clearCredentials } from '../utils'

export { clearAuth, saveCredentials, clearCredentials, getSavedCredentials } from '../utils'

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useLogin(redirectCita = false) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const login = async (correo: string, password: string, remember: boolean) => {
    setIsLoading(true); setError(null)
    try {
      const res = await apiRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo, clave: password }),
      })

      if (!res.success || !res.token) {
        setError('Credenciales incorrectas')
        return
      }

      if (remember) saveCredentials(correo, password)
      else          clearCredentials()

      saveAuth({
        token:      res.token,
        rol:        res.data.rol,
        id_usuario: res.data.id_usuario,
        correo:     res.data.correo,
        id_cliente: res.data.id_cliente,
      }, remember)

      // Redirigir según rol
      if (res.data.rol === 'Admin' || res.data.rol === 'Empleado') {
        navigate('/admin/dashboard', { replace: true })
      } else if (redirectCita) {
        navigate('/my-account?new-appointment=true', { replace: true })
      } else {
        navigate('/my-account', { replace: true })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, error }
}