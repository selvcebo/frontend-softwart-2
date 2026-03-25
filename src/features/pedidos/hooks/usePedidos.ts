// src/features/pedidos/hooks/usePedidos.ts
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
  venta?:         { id_venta: number }     | null
  servicio?:      { id_servicio: number }  | null
  estadoServicio?: { id_estado: number }   | null  // FIX: PK es id_estado, no id_estado_servicio
  marco?:         { id_marco: number }     | null
}

export function usePedidos() {
  const [pedidos,   setPedidos]   = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await apiRequest<ApiResponse<BackendDetalle[]>>('/api/detalle-venta')
      setPedidos((res.data ?? []).map(item => ({
        id_detalle:  item.id_detalle,
        fecha:       item.fecha,
        precio:      item.precio,
        observacion: item.observacion,
        estado:      item.estado,
        id_venta:    item.venta?.id_venta       ?? 0,
        id_servicio: item.servicio?.id_servicio ?? 0,
        id_estado:   item.estadoServicio?.id_estado ?? 1, // FIX: era id_estado_servicio
        id_marco:    item.marco?.id_marco       ?? null,
      })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const onCrear = async (data: CreatePedidoDto): Promise<string | null> => {
    try {
      await apiRequest('/api/detalle-venta', { method: 'POST', body: JSON.stringify(data) })
      await fetchAll()
      return null
    } catch (e) { return e instanceof Error ? e.message : 'Error al crear' }
  }

  const onEditar = async (id: number, data: UpdatePedidoDto): Promise<string | null> => {
    try {
      await apiRequest(`/api/detalle-venta/${id}`, { method: 'PUT', body: JSON.stringify(data) })
      await fetchAll()
      return null
    } catch (e) { return e instanceof Error ? e.message : 'Error al editar' }
  }

  const onEliminar = async (id: number): Promise<string | null> => {
    try {
      await apiRequest(`/api/detalle-venta/${id}`, { method: 'DELETE' })
      await fetchAll()
      return null
    } catch (e) { return e instanceof Error ? e.message : 'Error al eliminar' }
  }

  const onCambiarEstado = async (id: number, id_estado: number): Promise<string | null> => {
    const anterior = pedidos.find(p => p.id_detalle === id)?.id_estado
    // Optimistic update
    setPedidos(prev => prev.map(p => p.id_detalle === id ? { ...p, id_estado } : p))
    try {
      // FIX: backend lee req.body.id_estado, no id_estado_servicio
      await apiRequest(`/api/estado-servicio/detalle/${id}/estado`, {
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

  return { pedidos, isLoading, error, onCrear, onEditar, onEliminar, onCambiarEstado }
}