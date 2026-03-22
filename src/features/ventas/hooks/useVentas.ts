// src/features/ventas/hooks/useVentas.ts
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

export type Venta = { id_venta: number; fecha: string; total: number; observacion?: string; estado: boolean; id_cliente: number; id_cita: number | null; num_abonos: number; pagos_realizados: number }
type CreateVentaDto = Omit<Venta, 'id_venta' | 'num_abonos' | 'pagos_realizados'>
type UpdateVentaDto = Partial<CreateVentaDto>
type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: unknown }
type BackendVenta = { id_venta: number; fecha: string; total: number; observacion?: string; estado: boolean; num_abonos?: number; cliente?: { id_cliente: number } | null; cita?: { id_cita: number } | null; pagos?: any[] | null }

export function useVentas() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await apiRequest<ApiResponse<BackendVenta[]>>('/api/ventas?limit=500')
      setVentas((res.data ?? []).map(item => ({
        id_venta: item.id_venta, fecha: item.fecha, total: item.total,
        observacion: item.observacion, estado: item.estado,
        id_cliente: item.cliente?.id_cliente ?? 0,
        id_cita: item.cita?.id_cita ?? null,
        num_abonos: item.num_abonos ?? 2,
        pagos_realizados: item.pagos?.length ?? 0,
      })))
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const onCrear = async (data: CreateVentaDto) => {
    await apiRequest('/api/ventas', { method: 'POST', body: JSON.stringify(data) })
    await fetchAll()
  }
  const onEditar = async (id: number, data: UpdateVentaDto) => {
    await apiRequest(`/api/ventas/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    await fetchAll()
  }
  const onEliminar = async (id: number) => {
    await apiRequest(`/api/ventas/${id}`, { method: 'DELETE' })
    await fetchAll()
  }
  const onToggleEstado = async (id: number) => {
    setVentas(prev => prev.map(v => v.id_venta === id ? { ...v, estado: !v.estado } : v))
    try { await apiRequest(`/api/ventas/${id}/estado`, { method: 'PATCH' }) }
    catch { setVentas(prev => prev.map(v => v.id_venta === id ? { ...v, estado: !v.estado } : v)) }
  }

  return { ventas, isLoading, error, onCrear, onEditar, onEliminar, onToggleEstado, refetch: fetchAll }
}