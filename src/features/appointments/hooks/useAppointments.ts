// ============================================================
// src/features/appointments/hooks/useAppointments.ts
// ============================================================
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

type Cita = {
  id_cita:        number
  fecha:          string
  hora:           string
  id_estado_cita: number
  id_cliente:     number
  clienteNombre?: string   // para el popover del TimePicker
}
type CreateCitaDto = Omit<Cita, 'id_cita'>
type UpdateCitaDto = Partial<CreateCitaDto>

type EstadoCita = {
  id_estado_cita: number
  nombre: string
}

type ApiResponse<T> = {
  success: boolean
  message?: string
  data: T
  meta?: unknown
}

// El backend devuelve las relaciones anidadas
type BackendCita = {
  id_cita: number
  fecha: string
  hora: string
  cliente?: { id_cliente: number; nombre?: string } | null
  estadoCita?: { id_estado_cita: number } | null
}

export function useAppointments() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [estadosCita, setEstadosCita] = useState<EstadoCita[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [citasRes, estadosRes] = await Promise.all([
        apiRequest<ApiResponse<BackendCita[]>>('/api/citas?limit=500'),
        apiRequest<ApiResponse<EstadoCita[]>>('/api/estado-cita'),
      ])

      const normalized: Cita[] = (citasRes.data ?? []).map((item) => ({
        id_cita:        item.id_cita,
        fecha:          item.fecha,
        hora:           item.hora,
        id_cliente:     item.cliente?.id_cliente ?? 0,
        id_estado_cita: item.estadoCita?.id_estado_cita ?? 1,
        clienteNombre:  item.cliente?.nombre ?? `Cliente #${item.cliente?.id_cliente ?? '?'}`,
      }))

      setCitas(normalized)
      setEstadosCita(estadosRes.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar citas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const onCrear = async (data: CreateCitaDto) => {
    await apiRequest('/api/citas', { method: 'POST', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onEditar = async (id: number, data: UpdateCitaDto) => {
    await apiRequest(`/api/citas/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onEliminar = async (id: number) => {
    await apiRequest(`/api/citas/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  // PATCH /api/estado-cita/cita/:id/estado  (endpoint especial del backend)
  const onCambiarEstado = async (id: number, id_estado_cita: number) => {
    await apiRequest(`/api/estado-cita/cita/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ id_estado_cita }),
    })
    await fetchAll()
  }

  return { citas, estadosCita, isLoading, error, onCrear, onEditar, onEliminar, onCambiarEstado, refresh: fetchAll }
}