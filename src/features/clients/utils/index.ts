import type { Cliente } from '../types'

export const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'PP', label: 'Pasaporte (PP)' },
]

export const inputCls  = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
export const labelCls  = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'
export const selectCls = 'w-full bg-muted border-0 border-b-2 border-transparent data-[state=open]:border-secondary !h-auto rounded-t-lg px-4 py-3 text-sm shadow-none focus-visible:ring-0 focus-visible:border-secondary'

export function filterClientes(clientes: Cliente[], q: string, filterEstado: string): Cliente[] {
  const s = q.toLowerCase()
  return clientes.filter(c => {
    const matchQ = !s ||
      c.nombre.toLowerCase().includes(s) ||
      c.documento.includes(s) ||
      c.correo.toLowerCase().includes(s) ||
      (c.telefono ?? '').includes(s)
    const matchEstado = !filterEstado || (filterEstado === 'activo' ? c.estado : !c.estado)
    return matchQ && matchEstado
  })
}
