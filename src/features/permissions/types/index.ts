export type Permiso = {
  id_permiso:   number
  nombre:       string
  descripcion?: string
}

export type PermisoRol = {
  id_rol:     number
  id_permiso: number
}

export type PermisoRolRaw = {
  permission: { id_permiso: number }
  role:       { id_rol: number }
}
