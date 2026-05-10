// src/features/account/utils.ts
import type { Cita, Servicio } from './types'

export const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all'
export const labelCls = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'

export const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export function filterCitasCuenta(citas: Cita[], q: string): Cita[] {
  const s = q.toLowerCase()
  if (!s) return citas
  return citas.filter(c =>
    String(c.id_cita).includes(s) ||
    c.fecha.includes(s) ||
    (c.appointmentStatus?.nombre ?? '').toLowerCase().includes(s)
  )
}

export function filterServiciosCuenta(servicios: Servicio[], q: string): Servicio[] {
  const s = q.toLowerCase()
  if (!s) return servicios
  return servicios.filter(sv =>
    sv.servicio.toLowerCase().includes(s) ||
    sv.fecha.includes(s) ||
    sv.estado.toLowerCase().includes(s) ||
    (sv.observacion ?? '').toLowerCase().includes(s)
  )
}

export function tomorrowString(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function parseFechaBloque(fecha: string): { mes: string; dia: string } {
  const parts = fecha.split(/[-T]/)
  if (parts.length >= 3) {
    return { mes: MESES[parseInt(parts[1]) - 1] ?? '', dia: String(parseInt(parts[2])) }
  }
  return { mes: '', dia: fecha }
}

export function estadoBadgeClasses(nombre?: string): string {
  if (!nombre) return 'bg-muted text-muted-foreground'
  const s = nombre.toLowerCase()
  if (s.includes('pend'))    return 'bg-orange-100 text-orange-800'
  if (s.includes('complet') || s.includes('conf') || s.includes('val'))
    return 'bg-emerald-100 text-emerald-800'
  if (s.includes('cancel'))  return 'bg-destructive/15 text-destructive'
  return 'bg-muted text-muted-foreground'
}

export function estadoServicioBadgeClasses(estado: string): string {
  const s = estado.toLowerCase()
  if (s.includes('finaliz'))  return 'bg-emerald-100 text-emerald-800'
  if (s.includes('preparac')) return 'bg-amber-100 text-amber-800'
  return 'bg-muted text-muted-foreground'
}
