export type Pago = {
  id_pago:        number
  fecha:          string
  monto:          number
  observacion?:   string
  id_venta:       number
  id_metodo_pago: number
  id_estado_pago: number
}

export type MetodoPago = { id_metodo_pago: number; nombre: string }
export type EstadoPago  = { id_estado_pago: number; nombre: string }

export type CreatePagoDto = Omit<Pago, 'id_pago'>
export type UpdatePagoDto = Partial<CreatePagoDto>

export type BackendPago = {
  id_pago:        number
  fecha:          string
  monto:          number
  observacion?:   string
  sale?:          { id_venta: number }        | null
  paymentMethod?: { id_metodo_pago: number }  | null
  paymentStatus?: { id_estado_pago: number }  | null
}
