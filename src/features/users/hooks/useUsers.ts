// ============================================================
// src/features/users/hooks/useUsers.ts
// OPTIMISTIC UPDATE en onToggleStatus — sin skeleton, sin salto
// ============================================================
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

type Usuario = {
  id_usuario: number
  correo:     string
  clave:      string
  estado:     boolean
  id_rol:     number
}
type CreateUsuarioDto = Omit<Usuario, 'id_usuario'>
type UpdateUsuarioDto = Omit<Partial<CreateUsuarioDto>, 'clave'>
type ApiResponse<T>   = { success: boolean; message?: string; data: T; meta?: unknown }

type BackendUsuario = {
  id_usuario: number
  correo:     string
  estado:     boolean
  role?:      { id_rol: number } | null
}

export function useUsers() {
  const [usuarios,  setUsuarios]  = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiRequest<ApiResponse<BackendUsuario[]>>('/api/users?limit=500')
      setUsuarios(
        (res.data ?? []).map((u) => ({
          id_usuario: u.id_usuario,
          correo:     u.correo,
          clave:      '',
          estado:     u.estado,
          id_rol:     u.role?.id_rol ?? 0,
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar usuarios')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const onCreate = async (data: CreateUsuarioDto) => {
    await apiRequest('/api/users', { method: 'POST', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onEdit = async (id: number, data: UpdateUsuarioDto) => {
    await apiRequest(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onDelete = async (id: number) => {
    await apiRequest(`/api/users/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  // OPTIMISTIC UPDATE — sin fetchAll, sin skeleton
  const onToggleStatus = async (id: number) => {
    setUsuarios((prev) =>
      prev.map((u) => u.id_usuario === id ? { ...u, estado: !u.estado } : u)
    )
    try {
      await apiRequest(`/api/users/${id}/estado`, { method: 'PATCH' })
    } catch {
      // Revertir si falla
      setUsuarios((prev) =>
        prev.map((u) => u.id_usuario === id ? { ...u, estado: !u.estado } : u)
      )
    }
  }

  return { usuarios, isLoading, error, onCreate, onEdit, onDelete, onToggleStatus }
}