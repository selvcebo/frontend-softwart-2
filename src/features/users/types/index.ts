export type Usuario = {
  id_usuario: number
  correo:     string
  clave:      string
  estado:     boolean
  id_rol:     number
}

export type CreateUsuarioDto = Omit<Usuario, 'id_usuario'>
export type UpdateUsuarioDto = Omit<Partial<CreateUsuarioDto>, 'clave'>

export type BackendUsuario = {
  id_usuario: number
  correo:     string
  estado:     boolean
  role?:      { id_rol: number } | null
}
