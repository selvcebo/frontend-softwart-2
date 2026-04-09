// src/features/services/hooks/useServices.ts
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

type Servicio = {
  id_servicio: number
  nombre: string
  descripcion?: string
  duracion: number        // duración en minutos (para notificaciones APK)
  estado: boolean
}
type CreateServicioDto = Omit<Servicio, 'id_servicio'>
type UpdateServicioDto = Partial<CreateServicioDto>
type ApiResponse<T> = { success: boolean; data: T }

export function useServices() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await apiRequest<ApiResponse<Servicio[]>>('/api/services')
      setServicios((res.data ?? []).map(s => ({
        ...s,
        duracion: Number(s.duracion ?? 0),
        estado:   s.estado !== false,
      })))
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const onCreate = async (data: CreateServicioDto) => {
    await apiRequest('/api/services', { method: 'POST', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onEdit = async (id: number, data: UpdateServicioDto) => {
    await apiRequest(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onDelete = async (id: number): Promise<string | null> => {
    try {
      await apiRequest(`/api/services/${id}`, { method: 'DELETE' })
      await fetchAll()
      return null
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar'
      const esFk = msg.includes('500') || msg.includes('409') ||
        msg.toLowerCase().includes('foreign') || msg.toLowerCase().includes('constraint')
      return esFk
        ? 'No se puede eliminar: este tipo de servicio está siendo usado en pedidos existentes.'
        : msg
    }
  }

  const onToggleStatus = async (id: number) => {
    setServicios(prev => prev.map(s => s.id_servicio === id ? { ...s, estado: !s.estado } : s))
    try { await apiRequest(`/api/services/${id}/estado`, { method: 'PATCH' }) }
    catch { setServicios(prev => prev.map(s => s.id_servicio === id ? { ...s, estado: !s.estado } : s)) }
  }

  return { servicios, isLoading, error, onCreate, onEdit, onDelete, onToggleStatus }
}