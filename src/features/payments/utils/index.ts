import type { Pago } from '../types'

export const inputCls  = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
export const labelCls  = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'
export const selectCls = 'w-full bg-muted border-0 border-b-2 border-transparent data-[state=open]:border-secondary !h-auto rounded-t-lg px-4 py-3 text-sm shadow-none focus-visible:ring-0 focus-visible:border-secondary'

export const ESTADO_BADGE: Record<string, string> = {
  Pendiente:   'border-amber-300 bg-amber-100 text-amber-800',
  Validado:    'border-emerald-300 bg-emerald-100 text-emerald-800',
  Pagado:      'border-emerald-300 bg-emerald-100 text-emerald-800',
  Reembolsado: 'border-blue-300 bg-blue-100 text-blue-800',
  Anulado:     'border-red-300 bg-red-100 text-red-800',
}

export function filterPagos(
  pagos:        Pago[],
  ventasOpts:   { value: string; label: string }[],
  q:            string,
  filterMetodo: string,
  filterEstado: string,
): Pago[] {
  const s = q.toLowerCase()
  return pagos.filter(p => {
    const ventaLabel  = ventasOpts.find(o => o.value === String(p.id_venta))?.label ?? ''
    const matchQ      = !s || ventaLabel.toLowerCase().includes(s) || String(p.monto).includes(s) || p.fecha.includes(s)
    const matchMetodo = !filterMetodo || String(p.id_metodo_pago) === filterMetodo
    const matchEstado = !filterEstado || String(p.id_estado_pago) === filterEstado
    return matchQ && matchMetodo && matchEstado
  })
}
