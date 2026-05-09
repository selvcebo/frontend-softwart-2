export type Marco = {
  id_marco:          number
  codigo:            string
  colilla:           number
  precio_ensamblado: number
  estado:            boolean
}

export type CreateMarcoDto = Omit<Marco, 'id_marco'>
export type UpdateMarcoDto = Partial<CreateMarcoDto>
