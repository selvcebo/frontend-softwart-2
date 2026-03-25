// src/features/cuenta/hooks/useCuenta.ts
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

export function useCuenta() {
  const [perfil,    setPerfil]    = useState<PerfilCliente | null>(null)
  const [citas,     setCitas]     = useState<Cita[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchPerfil = useCallback(async () => {
    const res = await apiRequest<ApiResponse<PerfilCliente>>('/api/cuenta/perfil')
    setPerfil(res.data)
  }, [])

  const fetchMisCitas = useCallback(async () => {
    const res = await apiRequest<ApiResponse<Cita[]>>('/api/cuenta/citas')
    setCitas(res.data ?? [])
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      await Promise.all([fetchPerfil(), fetchMisCitas()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar tu cuenta')
    } finally {
      setIsLoading(false)
    }
  }, [fetchPerfil, fetchMisCitas])

  useEffect(() => { refresh() }, [refresh])

  // ── Actualizar datos personales (nombre, teléfono, correo) ────────────────
  // No toca la contraseña — formulario separado en la UI
  const onActualizarPerfil = async (data: DatosPerfilPayload) => {
    const res = await apiRequest<ApiResponse<PerfilCliente>>('/api/cuenta/perfil', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    setPerfil(res.data)
  }

  // ── Cambiar contraseña ────────────────────────────────────────────────────
  // Envía clave_actual para que el backend verifique antes de actualizar
  const onCambiarClave = async (data: CambioClavePayload) => {
    await apiRequest('/api/cuenta/perfil', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    // Sin actualizar estado de perfil — solo contraseña cambió
  }

  // ── Eliminar cuenta ───────────────────────────────────────────────────────
  const onEliminarCuenta = async () => {
    await apiRequest('/api/cuenta', { method: 'DELETE' })
    clearAuth() // limpia localStorage Y sessionStorage
    navigate('/', { replace: true })
  }

  // ── Cancelar cita propia ─────────────────────────────────────────────────
  const onCancelarCita = async (id_cita: number) => {
    await apiRequest(`/api/cuenta/citas/${id_cita}/cancelar`, { method: 'PATCH' })
    // Quitar la cita del estado local inmediatamente
    setCitas(prev => prev.filter(c => c.id_cita !== id_cita))
  }

  return {
    perfil,
    citas,
    isLoading,
    error,
    refresh,
    onActualizarPerfil,
    onCambiarClave,
    onCancelarCita,
    onEliminarCuenta,
  }
}