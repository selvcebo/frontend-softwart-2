export type Rol = {
  id_rol:       number
  nombre:       string
  descripcion?: string
  estado:       boolean
}

export type CreateRolDto = Omit<Rol, 'id_rol'>
export type UpdateRolDto = Partial<CreateRolDto>
