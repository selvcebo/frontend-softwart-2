// ============================================================
// src/features/clientes/hooks/useClientes.ts
// ============================================================
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

type Cliente = {
  id_cliente:    number
  tipoDocumento: string
  documento:     string
  nombre:        string
  correo:        string
  telefono?:     string
  estado:        boolean
}
type CreateClienteDto = Omit<Cliente, 'id_cliente'>
type UpdateClienteDto = Partial<Omit<CreateClienteDto, 'estado'>>

type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: unknown }

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiRequest<ApiResponse<Cliente[]>>('/api/clientes?limit=500')
      setClientes(res.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const onCrear = async (data: CreateClienteDto) => {
    await apiRequest('/api/clientes', { method: 'POST', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onEditar = async (id: number, data: UpdateClienteDto) => {
    await apiRequest(`/api/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onEliminar = async (id: number) => {
    await apiRequest(`/api/clientes/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  const onToggleEstado = async (id: number) => {
    await apiRequest(`/api/clientes/${id}/estado`, { method: 'PATCH' })
    await fetchAll()
  }

  return { clientes, isLoading, error, onCrear, onEditar, onEliminar, onToggleEstado }
}