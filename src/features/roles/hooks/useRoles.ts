// src/features/roles/hooks/useRoles.ts
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

type Rol = { id_rol: number; nombre: string; descripcion?: string; estado: boolean }
type CreateRolDto = Omit<Rol, 'id_rol'>
type UpdateRolDto = Partial<CreateRolDto>
type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: unknown }

export function useRoles() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await apiRequest<ApiResponse<Rol[]>>('/api/roles')
      setRoles(res.data ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const onCrear = async (data: CreateRolDto) => {
    await apiRequest('/api/roles', { method: 'POST', body: JSON.stringify(data) })
    await fetchAll()
  }
  const onEditar = async (id: number, data: UpdateRolDto) => {
    await apiRequest(`/api/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    await fetchAll()
  }
  const onEliminar = async (id: number) => {
    await apiRequest(`/api/roles/${id}`, { method: 'DELETE' })
    await fetchAll()
  }
  const onToggleEstado = async (id: number) => {
    setRoles(prev => prev.map(r => r.id_rol === id ? { ...r, estado: !r.estado } : r))
    try { await apiRequest(`/api/roles/${id}/estado`, { method: 'PATCH' }) }
    catch { setRoles(prev => prev.map(r => r.id_rol === id ? { ...r, estado: !r.estado } : r)) }
  }

  return { roles, isLoading, error, onCrear, onEditar, onEliminar, onToggleEstado }
}
