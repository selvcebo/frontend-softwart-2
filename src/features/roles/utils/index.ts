import type { Rol } from '../types'

export const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
export const labelCls = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'

export function filterRoles(roles: Rol[], q: string, filterEstado: string): Rol[] {
  const s = q.toLowerCase()
  return roles.filter(r => {
    const matchQ      = !s || r.nombre.toLowerCase().includes(s) || (r.descripcion ?? '').toLowerCase().includes(s)
    const matchEstado = !filterEstado || (filterEstado === 'activo' ? r.estado : !r.estado)
    return matchQ && matchEstado
  })
}
