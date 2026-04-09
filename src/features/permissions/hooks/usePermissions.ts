// src/features/permissions/hooks/usePermissions.ts
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

type Permiso = { id_permiso: number; nombre: string; descripcion?: string }
type Rol     = { id_rol: number; nombre: string }

// Backend devuelve relaciones anidadas: { permiso: { id_permiso, ... }, rol: { id_rol, ... } }
type PermisoRolRaw = {
  permiso: { id_permiso: number }
  rol:     { id_rol: number }
}

// Respuesta estándar del backend: { success, data: T[], meta? }
type ApiRes<T> = { success: boolean; data: T[]; meta?: unknown }

export function usePermissions() {
  const [permisos,     setPermisos]     = useState<Permiso[]>([])
  const [roles,        setRoles]        = useState<Rol[]>([])
  const [asignaciones, setAsignaciones] = useState<Map<number, Set<number>>>(new Map())
  const [isLoading,    setIsLoading]    = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true); setError(null)
    try {
      const [permisosRes, rolesRes, prRes] = await Promise.all([
        // limit=100 para traer todos, no solo los primeros 10
        apiRequest<ApiRes<Permiso>>('/api/permissions?limit=100'),
        apiRequest<ApiRes<Rol>>('/api/roles?limit=100'),
        apiRequest<ApiRes<PermisoRolRaw>>('/api/role-permissions?limit=200'),
      ])

      setPermisos(permisosRes.data ?? [])
      setRoles(rolesRes.data ?? [])

      // Construir mapa rol → Set<permisos>
      const mapa = new Map<number, Set<number>>()
      for (const raw of prRes.data ?? []) {
        const id_rol     = raw.rol?.id_rol
        const id_permiso = raw.permiso?.id_permiso
        if (!id_rol || !id_permiso) continue
        if (!mapa.has(id_rol)) mapa.set(id_rol, new Set())
        mapa.get(id_rol)!.add(id_permiso)
      }
      setAsignaciones(mapa)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar permisos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const hasPermission = (id_rol: number, id_permiso: number): boolean =>
    asignaciones.get(id_rol)?.has(id_permiso) ?? false

  const onTogglePermission = async (id_rol: number, id_permiso: number): Promise<string | null> => {
    const yaExiste = hasPermission(id_rol, id_permiso)

    // Optimistic update
    setAsignaciones(prev => {
      const next = new Map(prev)
      if (yaExiste) {
        next.get(id_rol)?.delete(id_permiso)
      } else {
        if (!next.has(id_rol)) next.set(id_rol, new Set())
        next.get(id_rol)!.add(id_permiso)
      }
      return next
    })

    try {
      if (yaExiste) {
        // DELETE /api/role-permissions con body { id_permiso, id_rol }
        await apiRequest('/api/role-permissions', {
          method: 'DELETE',
          body: JSON.stringify({ id_permiso, id_rol }),
        })
      } else {
        // POST /api/role-permissions con body plano { id_permiso, id_rol }
        await apiRequest('/api/role-permissions', {
          method: 'POST',
          body: JSON.stringify({ id_permiso, id_rol }),
        })
      }
      return null
    } catch (e) {
      // Rollback
      setAsignaciones(prev => {
        const next = new Map(prev)
        if (yaExiste) {
          if (!next.has(id_rol)) next.set(id_rol, new Set())
          next.get(id_rol)!.add(id_permiso)
        } else {
          next.get(id_rol)?.delete(id_permiso)
        }
        return next
      })
      return e instanceof Error ? e.message : 'Error desconocido'
    }
  }

  return { permisos, roles, asignaciones, isLoading, error, hasPermission, onTogglePermission }
}