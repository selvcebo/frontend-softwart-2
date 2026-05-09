export type Cita = {
  id_cita:        number
  fecha:          string
  hora:           string
  id_estado_cita: number
  id_cliente:     number
  clienteNombre?: string
}

export type CreateCitaDto = Omit<Cita, 'id_cita'>
export type UpdateCitaDto = Partial<CreateCitaDto>

export type EstadoCita = {
  id_estado_cita: number
  nombre:         string
}

export type BackendCita = {
  id_cita: number
  fecha:   string
  hora:    string
  client?:            { id_cliente: number; nombre?: string } | null
  appointmentStatus?: { id_estado_cita: number } | null
}

export type VentaLinea = {
  id:           number
  id_servicio:  string
  id_marco:     string
  precio:       string
  observacion:  string
}

export type VentaMsg = { tipo: 'ok' | 'err'; texto: string }
