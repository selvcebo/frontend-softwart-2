export type Pedido = {
  id_detalle:   number
  id_venta:     number
  id_servicio:  number
  id_estado:    number
  id_marco:     number | null
  fecha:        string
  observacion?: string
  precio:       number
  estado:       boolean
}

export type CreatePedidoDto = Omit<Pedido, 'id_detalle'>
export type UpdatePedidoDto = Partial<CreatePedidoDto>

export type BackendDetalle = {
  id_detalle:    number
  fecha:         string
  precio:        number
  observacion?:  string
  estado:        boolean
  sale?:          { id_venta: number }    | null
  service?:       { id_servicio: number } | null
  serviceStatus?: { id_estado: number }   | null
  frame?:         { id_marco: number }    | null
}

export type EstadoServicio = { id_estado: number; nombre: string }
