// src/features/orders/hooks/useOrders.ts
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

type Pedido = {
  id_detalle:   number
  id_venta:     number
  id_servicio:  number
  id_estado:    number   // FK → estado_servicio.id_estado
  id_marco:     number | null
  fecha:        string
  observacion?: string
  precio:       number
  estado:       boolean
}

type CreatePedidoDto = Omit<Pedido, 'id_detalle'>
type UpdatePedidoDto = Partial<CreatePedidoDto>
type ApiResponse<T>  = { success: boolean; message?: string; data: T; meta?: unknown }

type BackendDetalle = {
  id_detalle:    number
  fecha:         string
  precio:        number
  observacion?:  string
  estado:        boolean
  sale?:           { id_venta: number }     | null
  service?:        { id_servicio: number }  | null
  serviceStatus?:  { id_estado: number }   | null
  frame?:          { id_marco: number }     | null
}

export function useOrders() {
  const [pedidos,   setPedidos]   = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await apiRequest<ApiResponse<BackendDetalle[]>>('/api/sale-details')
      setPedidos((res.data ?? []).map(item => ({
        id_detalle:  item.id_detalle,
        fecha:       item.fecha,
        precio:      item.precio,
        observacion: item.observacion,
        estado:      item.estado,
        id_venta:    item.sale?.id_venta         ?? 0,
        id_servicio: item.service?.id_servicio   ?? 0,
        id_estado:   item.serviceStatus?.id_estado ?? 1,
        id_marco:    item.frame?.id_marco         ?? null,
      })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const onCreate = async (data: CreatePedidoDto): Promise<string | null> => {
    try {
      await apiRequest('/api/sale-details', { method: 'POST', body: JSON.stringify(data) })
      await fetchAll()
      return null
    } catch (e) { return e instanceof Error ? e.message : 'Error al crear' }
  }

  const onEdit = async (id: number, data: UpdatePedidoDto): Promise<string | null> => {
    try {
      await apiRequest(`/api/sale-details/${id}`, { method: 'PUT', body: JSON.stringify(data) })
      await fetchAll()
      return null
    } catch (e) { return e instanceof Error ? e.message : 'Error al editar' }
  }

  const onDelete = async (id: number): Promise<string | null> => {
    try {
      await apiRequest(`/api/sale-details/${id}`, { method: 'DELETE' })
      await fetchAll()
      return null
    } catch (e) { return e instanceof Error ? e.message : 'Error al eliminar' }
  }

  const onChangeStatus = async (id: number, id_estado: number): Promise<string | null> => {
    const anterior = pedidos.find(p => p.id_detalle === id)?.id_estado
    // Optimistic update
    setPedidos(prev => prev.map(p => p.id_detalle === id ? { ...p, id_estado } : p))
    try {
      // FIX: backend lee req.body.id_estado, no id_estado_servicio
      await apiRequest(`/api/service-status/detalle/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ id_estado }),
      })
      return null
    } catch (e) {
      // Rollback
      setPedidos(prev => prev.map(p => p.id_detalle === id ? { ...p, id_estado: anterior ?? id_estado } : p))
      return e instanceof Error ? e.message : 'Error al cambiar estado'
    }
  }

  return { pedidos, isLoading, error, onCreate, onEdit, onDelete, onChangeStatus }
}