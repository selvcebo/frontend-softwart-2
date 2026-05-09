import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import type { EstadoServicio } from '../types'

export function useEstadosServicio(): EstadoServicio[] {
  const [estados, setEstados] = useState<EstadoServicio[]>([])
  useEffect(() => {
    apiRequest<{ success: boolean; data: EstadoServicio[] }>('/api/service-status')
      .then(r => setEstados(r.data ?? []))
      .catch(() => {})
  }, [])
  return estados
}
