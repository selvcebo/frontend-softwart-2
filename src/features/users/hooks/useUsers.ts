// ============================================================
// src/features/users/hooks/useUsers.ts
// OPTIMISTIC UPDATE en onToggleEstado — sin skeleton, sin salto
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
  rol?:       { id_rol: number } | null
}

export function useUsers() {
  const [usuarios,  setUsuarios]  = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiRequest<ApiResponse<BackendUsuario[]>>('/api/usuarios?limit=500')
      setUsuarios(
        (res.data ?? []).map((u) => ({
          id_usuario: u.id_usuario,
          correo:     u.correo,
          clave:      '',
          estado:     u.estado,
          id_rol:     u.rol?.id_rol ?? 0,
        }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar usuarios')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const onCrear = async (data: CreateUsuarioDto) => {
    await apiRequest('/api/usuarios', { method: 'POST', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onEditar = async (id: number, data: UpdateUsuarioDto) => {
    await apiRequest(`/api/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    await fetchAll()
  }

  const onEliminar = async (id: number) => {
    await apiRequest(`/api/usuarios/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  // OPTIMISTIC UPDATE — sin fetchAll, sin skeleton
  const onToggleEstado = async (id: number) => {
    setUsuarios((prev) =>
      prev.map((u) => u.id_usuario === id ? { ...u, estado: !u.estado } : u)
    )
    try {
      await apiRequest(`/api/usuarios/${id}/estado`, { method: 'PATCH' })
    } catch {
      // Revertir si falla
      setUsuarios((prev) =>
        prev.map((u) => u.id_usuario === id ? { ...u, estado: !u.estado } : u)
      )
    }
  }

  return { usuarios, isLoading, error, onCrear, onEditar, onEliminar, onToggleEstado }
}