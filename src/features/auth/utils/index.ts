import type { AuthData } from '../types'

export function saveAuth(data: AuthData, remember: boolean): void {
  const storage = remember ? localStorage : sessionStorage
  storage.setItem('token',      data.token)
  storage.setItem('rol',        data.rol)
  storage.setItem('id_usuario', String(data.id_usuario))
  storage.setItem('correo',     data.correo)
  if (data.id_cliente != null)
    storage.setItem('id_cliente', String(data.id_cliente))
}

export function clearAuth(): void {
  ;['token', 'rol', 'id_usuario', 'correo', 'id_cliente'].forEach(k => {
    localStorage.removeItem(k)
    sessionStorage.removeItem(k)
  })
}

const CRED_KEY = 'saved_creds'

export function saveCredentials(correo: string, password: string): void {
  localStorage.setItem(CRED_KEY, JSON.stringify({ correo, p: btoa(password) }))
}

export function clearCredentials(): void {
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

export function getAuthToken(): string | null {
  return localStorage.getItem('token') ?? sessionStorage.getItem('token')
}

export function getAuthRol(): string | null {
  return localStorage.getItem('rol') ?? sessionStorage.getItem('rol')
}
