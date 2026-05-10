export type Tab     = 'perfil' | 'citas' | 'servicios'
export type NavItem = { id: Tab; label: string; Icon: React.ElementType }

export type PerfilCliente = {
  id_cliente:     number
  tipoDocumento?: string
  documento?:     string
  nombre:         string
  correo:         string
  telefono:       string | null
  estado:         boolean
}

export type Cita = {
  id_cita: number
  fecha:   string
  hora:    string
  appointmentStatus?: { id_estado_cita: number; nombre: string } | null
}

export type Servicio = {
  id_detalle:  number
  fecha:       string
  servicio:    string
  estado:      string
  precio:      number
  observacion: string | null
}
