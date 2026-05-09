import type { Usuario } from '../types'

export const inputCls  = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
export const labelCls  = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'
export const selectCls = 'w-full bg-muted border-0 border-b-2 border-transparent data-[state=open]:border-secondary !h-auto rounded-t-lg px-4 py-3 text-sm shadow-none focus-visible:ring-0 focus-visible:border-secondary'

export const ROL_LABELS: Record<number, string> = { 1: 'Admin', 2: 'Empleado', 3: 'Cliente' }

export function getRolBadgeClass(id_rol: number): string {
  switch (id_rol) {
    case 1: return 'border-violet-300 bg-violet-100 text-violet-800'
    case 2: return 'border-blue-300 bg-blue-100 text-blue-800'
    case 3: return 'border-emerald-300 bg-emerald-100 text-emerald-800'
    default: return 'border-border bg-muted text-muted-foreground'
  }
}

export function filterUsuarios(usuarios: Usuario[], q: string, filterRol: string, filterEstado: string): Usuario[] {
  const s = q.toLowerCase()
  return usuarios.filter(u => {
    const matchQ      = !s || u.correo.toLowerCase().includes(s) || ROL_LABELS[u.id_rol]?.toLowerCase().includes(s)
    const matchRol    = !filterRol    || String(u.id_rol) === filterRol
    const matchEstado = !filterEstado || (filterEstado === 'activo' ? u.estado : !u.estado)
    return matchQ && matchRol && matchEstado
  })
}
