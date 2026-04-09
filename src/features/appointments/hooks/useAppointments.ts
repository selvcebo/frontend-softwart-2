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
  client?: { id_cliente: number; nombre?: string } | null
  appointmentStatus?: { id_estado_cita: number } | null
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
        apiRequest<ApiResponse<BackendCita[]>>('/api/appointments?limit=500'),
        apiRequest<ApiResponse<EstadoCita[]>>('/api/appointment-status'),
      ])

      const normalized: Cita[] = (citasRes.data ?? []).map((item) => ({
        id_cita:        item.id_cita,
        fecha:          item.fecha,
        hora:           item.hora,
        id_cliente:     item.client?.id_cliente ?? 0,
        id_estado_cita: item.appointmentStatus?.id_estado_cita ?? 1,
        clienteNombre:  item.client?.nombre ?? `Cliente #${item.client?.id_cliente ?? '?'}`,
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

  const onCreate = async (data: CreateCitaDto) => {
    await apiRequest('/api/appointments', { method: 'POST', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onEdit = async (id: number, data: UpdateCitaDto) => {
    await apiRequest(`/api/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onDelete = async (id: number) => {
    await apiRequest(`/api/appointments/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  // PATCH /api/appointment-status/cita/:id/estado  (endpoint especial del backend)
  const onChangeStatus = async (id: number, id_estado_cita: number) => {
    await apiRequest(`/api/appointment-status/cita/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ id_estado_cita }),
    })
    await fetchAll()
  }

  return { citas, estadosCita, isLoading, error, onCreate, onEdit, onDelete, onChangeStatus, refresh: fetchAll }
}