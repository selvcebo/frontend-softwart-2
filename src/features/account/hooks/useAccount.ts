// src/features/account/hooks/useAccount.ts
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { clearAuth } from '@/src/features/auth/hooks/useLogin'

type ApiResponse<T> = { success: boolean; message?: string; data: T }

type PerfilCliente = {
  id_cliente:     number
  tipoDocumento?: string
  documento?:     string
  nombre:         string
  correo:         string
  telefono:       string | null
  estado:         boolean
}

type Cita = {
  id_cita:    number
  fecha:      string
  hora:       string
  estadoCita?: { id_estado_cita: number; nombre: string } | null
}

// Tipo para actualizar datos personales (sin contraseña)
type DatosPerfilPayload = Partial<Pick<PerfilCliente, 'nombre' | 'telefono' | 'correo'>>

// Tipo para cambiar contraseña — requiere clave_actual para verificar identidad
type CambioClavePayload = { clave_actual: string; clave: string }

export function useAccount() {
  const [perfil,    setPerfil]    = useState<PerfilCliente | null>(null)
  const [citas,     setCitas]     = useState<Cita[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchProfile = useCallback(async () => {
    const res = await apiRequest<ApiResponse<PerfilCliente>>('/api/account/perfil')
    setPerfil(res.data)
  }, [])

  const fetchMyAppointments = useCallback(async () => {
    const res = await apiRequest<ApiResponse<Cita[]>>('/api/account/citas')
    setCitas(res.data ?? [])
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      await Promise.all([fetchProfile(), fetchMyAppointments()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar tu cuenta')
    } finally {
      setIsLoading(false)
    }
  }, [fetchProfile, fetchMyAppointments])

  useEffect(() => { refresh() }, [refresh])

  // ── Actualizar datos personales (nombre, teléfono, correo) ────────────────
  // No toca la contraseña — formulario separado en la UI
  const onUpdateProfile = async (data: DatosPerfilPayload) => {
    const res = await apiRequest<ApiResponse<PerfilCliente>>('/api/account/perfil', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    setPerfil(res.data)
  }

  // ── Cambiar contraseña ────────────────────────────────────────────────────
  // Envía clave_actual para que el backend verifique antes de actualizar
  const onChangePassword = async (data: CambioClavePayload) => {
    await apiRequest('/api/account/perfil', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    // Sin actualizar estado de perfil — solo contraseña cambió
  }

  // ── Eliminar cuenta ───────────────────────────────────────────────────────
  const onDeleteAccount = async () => {
    await apiRequest('/api/account', { method: 'DELETE' })
    clearAuth() // limpia localStorage Y sessionStorage
    navigate('/', { replace: true })
  }

  // ── Cancelar cita propia ─────────────────────────────────────────────────
  const onCancelAppointment = async (id_cita: number) => {
    await apiRequest(`/api/account/citas/${id_cita}/cancelar`, { method: 'PATCH' })
    // Quitar la cita del estado local inmediatamente
    setCitas(prev => prev.filter(c => c.id_cita !== id_cita))
  }

  return {
    perfil,
    citas,
    isLoading,
    error,
    refresh,
    onUpdateProfile,
    onChangePassword,
    onCancelAppointment,
    onDeleteAccount,
  }
}