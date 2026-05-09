import type { Pedido } from '../types'

export const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
export const labelCls = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'

export const BADGE_COLORS = [
  'border-amber-300 bg-amber-100 text-amber-800',
  'border-blue-300 bg-blue-100 text-blue-800',
  'border-emerald-300 bg-emerald-100 text-emerald-800',
  'border-slate-300 bg-slate-100 text-slate-600',
  'border-purple-300 bg-purple-100 text-purple-800',
]

export function badgeClass(index: number): string {
  return BADGE_COLORS[index % BADGE_COLORS.length]
}

export function filterPedidos(
  pedidos:      Pedido[],
  ventasOpts:   { value: string; label: string }[],
  serviciosOpts: { value: string; label: string }[],
  marcosOpts:   { value: string; label: string }[],
  rawVentas:    { id_venta: number; client?: { nombre?: string } | null }[],
  estados:      { id_estado: number }[],
  q:            string,
  filterEstado: string,
): Pedido[] {
  const s = q.toLowerCase()
  const estadoOrder = new Map(estados.map((e, i) => [e.id_estado, i]))
  return pedidos.filter(p => {
    const ventaLabel    = ventasOpts.find(o => o.value === String(p.id_venta))?.label ?? ''
    const servicioLabel = serviciosOpts.find(o => o.value === String(p.id_servicio))?.label ?? ''
    const marcoLabel    = p.id_marco ? (marcosOpts.find(o => o.value === String(p.id_marco))?.label ?? '') : ''
    const clienteNombre = rawVentas.find(rv => rv.id_venta === p.id_venta)?.client?.nombre ?? ''
    const matchQ        = !s ||
      clienteNombre.toLowerCase().includes(s) ||
      ventaLabel.toLowerCase().includes(s) ||
      servicioLabel.toLowerCase().includes(s) ||
      marcoLabel.toLowerCase().includes(s) ||
      p.fecha.includes(s)
    const matchEstado   = !filterEstado || String(p.id_estado) === filterEstado
    return matchQ && matchEstado
  }).sort((a, b) => {
    const estCmp = (estadoOrder.get(a.id_estado) ?? 9) - (estadoOrder.get(b.id_estado) ?? 9)
    if (estCmp !== 0) return estCmp
    return a.fecha.localeCompare(b.fecha)
  })
}
