// src/features/auth/hooks/useLogin.ts
// CAMBIO: "Recordarme" → sessionStorage (sin checkbox) o localStorage (con checkbox)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '@/src/shared/lib/apiClient'

type LoginResponse = {
  success: boolean
  message?: string
  token:   string
  data: {
    id_usuario:  number
    correo:      string
    rol:         string
    id_cliente:  number | null
    nombre?:     string | null
  }
}

// ── Helpers: guardar/leer/limpiar auth según "recordarme" ─────────────────────
type AuthData = { token: string; rol: string; id_usuario: number; correo: string; id_cliente?: number | null }

function saveAuth(data: AuthData, remember: boolean) {
  const storage = remember ? localStorage : sessionStorage
  storage.setItem('token',      data.token)
  storage.setItem('rol',        data.rol)
  storage.setItem('id_usuario', String(data.id_usuario))
  storage.setItem('correo',     data.correo)
  if (data.id_cliente != null)
    storage.setItem('id_cliente', String(data.id_cliente))
}

export function clearAuth() {
  ;['token', 'rol', 'id_usuario', 'correo', 'id_cliente'].forEach(k => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  })
}

// ── Helpers: credenciales guardadas para auto-fill ────────────────────────────
const CRED_KEY = 'saved_creds'

export function saveCredentials(correo: string, password: string) {
  localStorage.setItem(CRED_KEY, JSON.stringify({ correo, p: btoa(password) }))
}

export function clearCredentials() {
  localStorage.removeItem(CRED_KEY)
}

export function getSavedCredentials(): { correo: string; password: string } | null {
  try {
    const raw = localStorage.getItem(CRED_KEY)
    if (!raw) return null
    const { correo, p } = JSON.parse(raw)
    return { correo, password: atob(p) }
  } catch {
    return null
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem('token') ?? sessionStorage.getItem('token')
}

function getAuthRol(): string | null {
  return localStorage.getItem('rol') ?? sessionStorage.getItem('rol')
}

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
        // Venía desde "Agenda tu cita" → abrir formulario directo
        navigate('/mi-cuenta?new-appointment=true', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, error }
}