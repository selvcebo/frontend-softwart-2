// src/features/dashboard/hooks/useLanding.ts
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

type Servicio = { id_servicio: number; nombre: string; descripcion?: string | null }

export function useLanding() {
  const [servicios, setServicios] = useState<Servicio[]>([])

  useEffect(() => {
    apiRequest<{ data: Servicio[] }>('/api/servicios?limit=6')
      .then(r => setServicios(r.data ?? []))
      .catch(() => {})
  }, [])

  return { servicios }
}
