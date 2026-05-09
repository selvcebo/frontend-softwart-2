export type Venta = {
  id_venta:         number
  fecha:            string
  total:            number
  observacion?:     string
  estado:           boolean
  id_cliente:       number
  id_cita:          number | null
  num_abonos:       number
  pagos_realizados: number
}

export type CreateVentaDto = Omit<Venta, 'id_venta' | 'num_abonos' | 'pagos_realizados'>
export type UpdateVentaDto = Partial<CreateVentaDto>

export type BackendPayment = { paymentStatus?: { nombre?: string } | null }
export type BackendVenta = {
  id_venta:    number
  fecha:       string
  total:       number
  observacion?: string
  estado:      boolean
  num_abonos?: number
  client?:       { id_cliente: number } | null
  appointment?:  { id_cita: number } | null
  payments?:     BackendPayment[] | null
}

export type AbonoEsperado = { number: number; amount: number; percentage: number }
export type EstadoPago    = { id_estado_pago: number; nombre: string }
export type MetodoPago    = { id_metodo_pago: number; nombre: string }

export type EstadoPagos = {
  id_venta:                number
  total:                   number
  num_abonos:              number
  porcentaje_primer_abono: number
  pagos_realizados:        number
  total_pagado:            number
  saldo_pendiente:         number
  completado:              boolean
  plan_abonos:             AbonoEsperado[]
  siguiente_abono:         { number: number; expectedAmount: number; isLast: boolean } | null
  historial_pagos:         { id_pago: number; monto: number; fecha: string; estado: string }[]
}

export interface SaleInstallmentModalProps {
  open:       boolean
  onClose:    () => void
  idVenta:    number
  labelVenta: string
  onSuccess:  () => void
}
