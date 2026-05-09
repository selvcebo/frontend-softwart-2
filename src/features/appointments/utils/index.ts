import type { Cita } from '../types'

export const inputCls  = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
export const labelCls  = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'
export const selectCls = 'w-full bg-muted border-0 border-b-2 border-transparent data-[state=open]:border-secondary !h-auto rounded-t-lg px-4 py-3 text-sm shadow-none focus-visible:ring-0 focus-visible:border-secondary'

export const ESTADO_BADGE: Record<number, string> = {
  1: 'border-amber-300 bg-amber-100 text-amber-800',
  2: 'border-blue-300 bg-blue-100 text-blue-800',
  3: 'border-emerald-300 bg-emerald-100 text-emerald-800',
  4: 'border-slate-300 bg-slate-100 text-slate-600',
}

const ESTADO_ORDER: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3 }

export function filterCitas(
  citas: Cita[],
  clientesOpts: { value: string; label: string }[],
  q: string,
  filterEstado: string,
): Cita[] {
  const s = q.toLowerCase()
  return citas.filter(c => {
    const clienteLabel = clientesOpts.find(o => o.value === String(c.id_cliente))?.label ?? ''
    const matchQ = !s ||
      String(c.id_cita).includes(s) ||
      c.fecha.includes(s) ||
      c.hora.includes(s) ||
      clienteLabel.toLowerCase().includes(s)
    const matchEstado = !filterEstado || String(c.id_estado_cita) === filterEstado
    return matchQ && matchEstado
  }).sort((a, b) => {
    const fechaCmp = b.fecha.localeCompare(a.fecha)
    if (fechaCmp !== 0) return fechaCmp
    return (ESTADO_ORDER[a.id_estado_cita] ?? 9) - (ESTADO_ORDER[b.id_estado_cita] ?? 9)
  })
}

export const todayStr = () => new Date().toISOString().slice(0, 10)

export function validateFecha(f: string): boolean {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return new Date(f) >= t
}

export const fmtCOP = (v: number) => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })
