export type Servicio = {
  id_servicio:  number
  nombre:       string
  descripcion?: string
  duracion:     number
  estado:       boolean
}

export type CreateServicioDto = Omit<Servicio, 'id_servicio'>
export type UpdateServicioDto = Partial<CreateServicioDto>
