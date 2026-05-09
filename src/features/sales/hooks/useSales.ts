// src/features/sales/hooks/useSales.ts
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import type { Venta, CreateVentaDto, UpdateVentaDto, BackendVenta } from '../types'

type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: unknown }

export function useSales() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await apiRequest<ApiResponse<BackendVenta[]>>('/api/sales?limit=500')
      setVentas((res.data ?? []).map(item => ({
        id_venta: item.id_venta, fecha: item.fecha, total: item.total,
        observacion: item.observacion, estado: item.estado,
        id_cliente: item.client?.id_cliente ?? 0,
        id_cita: item.appointment?.id_cita ?? null,
        num_abonos: item.num_abonos ?? 2,
        pagos_realizados: (item.payments ?? []).filter(p => !p.paymentStatus?.nombre?.toLowerCase().includes('anulado')).length,
      })))
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const onCreate = async (data: CreateVentaDto) => {
    await apiRequest('/api/sales', { method: 'POST', body: JSON.stringify(data) })
    await fetchAll()
  }
  const onEdit = async (id: number, data: UpdateVentaDto) => {
    await apiRequest(`/api/sales/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    await fetchAll()
  }
  const onDelete = async (id: number) => {
    await apiRequest(`/api/sales/${id}`, { method: 'DELETE' })
    await fetchAll()
  }
  const onToggleStatus = async (id: number) => {
    setVentas(prev => prev.map(v => v.id_venta === id ? { ...v, estado: !v.estado } : v))
    try { await apiRequest(`/api/sales/${id}/estado`, { method: 'PATCH' }) }
    catch { setVentas(prev => prev.map(v => v.id_venta === id ? { ...v, estado: !v.estado } : v)) }
  }

  return { ventas, isLoading, error, onCreate, onEdit, onDelete, onToggleStatus, refetch: fetchAll }
}