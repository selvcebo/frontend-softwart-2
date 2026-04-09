// ============================================================
// src/features/clients/hooks/useClients.ts
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

export function useClients() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiRequest<ApiResponse<Cliente[]>>('/api/clients?limit=500')
      setClientes(res.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar clientes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const onCreate = async (data: CreateClienteDto) => {
    await apiRequest('/api/clients', { method: 'POST', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onEdit = async (id: number, data: UpdateClienteDto) => {
    await apiRequest(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onDelete = async (id: number) => {
    await apiRequest(`/api/clients/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  const onToggleStatus = async (id: number) => {
    await apiRequest(`/api/clients/${id}/estado`, { method: 'PATCH' })
    await fetchAll()
  }

  return { clientes, isLoading, error, onCreate, onEdit, onDelete, onToggleStatus }
}