import type { Servicio } from '../types'

export const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
export const labelCls = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'

export function fmtDuracion(dias: number): string {
  if (!dias) return '—'
  return dias === 1 ? '1 día' : `${dias} días`
}

export function filterServicios(servicios: Servicio[], q: string, filterEstado: string): Servicio[] {
  const s = q.toLowerCase()
  return servicios.filter(sv => {
    const matchQ      = !s || sv.nombre.toLowerCase().includes(s) || (sv.descripcion ?? '').toLowerCase().includes(s)
    const matchEstado = !filterEstado || (filterEstado === 'activo' ? sv.estado : !sv.estado)
    return matchQ && matchEstado
  })
}
