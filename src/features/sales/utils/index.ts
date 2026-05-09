import type { Venta } from '../types'

export const inputCls  = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
export const labelCls  = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'
export const selectCls = 'w-full bg-muted border-0 border-b-2 border-transparent data-[state=open]:border-secondary !h-auto rounded-t-lg px-4 py-3 text-sm shadow-none focus-visible:ring-0 focus-visible:border-secondary'

export function filterVentas(
  ventas: Venta[],
  clientesOpts: { value: string; label: string }[],
  citasOpts:    { value: string; label: string }[],
  q:            string,
  filterEstado: string,
): Venta[] {
  const s = q.toLowerCase()
  return ventas.filter(v => {
    const clienteLabel = clientesOpts.find(o => o.value === String(v.id_cliente))?.label ?? ''
    const citaLabel    = v.id_cita ? (citasOpts.find(o => o.value === String(v.id_cita))?.label ?? '') : ''
    const matchQ       = !s ||
      clienteLabel.toLowerCase().includes(s) ||
      citaLabel.toLowerCase().includes(s) ||
      v.fecha.includes(s)
    const matchEstado  = !filterEstado || (filterEstado === 'activo' ? v.estado : !v.estado)
    return matchQ && matchEstado
  })
}
