// src/features/permissions/hooks/usePermissions.ts
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import type { Permiso, PermisoRolRaw } from '../types'

type Rol = { id_rol: number; nombre: string }
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
        const id_rol     = raw.role?.id_rol
        const id_permiso = raw.permission?.id_permiso
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

    // Determinar cascadas según el módulo y acción del permiso
    const permiso = permisos.find(p => p.id_permiso === id_permiso)
    const [modulo, accion] = permiso?.nombre.split('.') ?? ['', '']

    let idsToAdd: number[] = []
    let idsToRemove: number[] = []

    if (!yaExiste) {
      idsToAdd = [id_permiso]
      // Añadir un permiso que no es VER → también garantizar MODULE.VER
      if (accion && accion !== 'VER') {
        const verPermiso = permisos.find(p => p.nombre === `${modulo}.VER`)
        if (verPermiso && !hasPermission(id_rol, verPermiso.id_permiso)) {
          idsToAdd.push(verPermiso.id_permiso)
        }
      }
    } else {
      if (accion === 'VER') {
        // Quitar VER → quitar todos los permisos asignados del mismo módulo
        idsToRemove = permisos
          .filter(p => p.nombre.startsWith(`${modulo}.`) && hasPermission(id_rol, p.id_permiso))
          .map(p => p.id_permiso)
      } else {
        idsToRemove = [id_permiso]
      }
    }

    // Optimistic update
    setAsignaciones(prev => {
      const next = new Map(prev)
      const rolePerms = new Set(prev.get(id_rol) ?? [])
      idsToAdd.forEach(id => rolePerms.add(id))
      idsToRemove.forEach(id => rolePerms.delete(id))
      next.set(id_rol, rolePerms)
      return next
    })

    try {
      await Promise.all([
        ...idsToAdd.map(id => apiRequest('/api/role-permissions', {
          method: 'POST',
          body: JSON.stringify({ id_permiso: id, id_rol }),
        })),
        ...idsToRemove.map(id => apiRequest('/api/role-permissions', {
          method: 'DELETE',
          body: JSON.stringify({ id_permiso: id, id_rol }),
        })),
      ])
      return null
    } catch (e) {
      // Rollback
      setAsignaciones(prev => {
        const next = new Map(prev)
        const rolePerms = new Set(prev.get(id_rol) ?? [])
        idsToAdd.forEach(id => rolePerms.delete(id))
        idsToRemove.forEach(id => rolePerms.add(id))
        next.set(id_rol, rolePerms)
        return next
      })
      return e instanceof Error ? e.message : 'Error desconocido'
    }
  }

  return { permisos, roles, asignaciones, isLoading, error, hasPermission, onTogglePermission }
}