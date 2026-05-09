export type Cliente = {
  id_cliente:    number
  tipoDocumento: string
  documento:     string
  nombre:        string
  correo:        string
  telefono?:     string
  estado:        boolean
}

export type CreateClienteDto = Omit<Cliente, 'id_cliente'>
export type UpdateClienteDto = Partial<Omit<CreateClienteDto, 'estado'>>
