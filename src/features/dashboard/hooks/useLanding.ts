// src/features/dashboard/hooks/useLanding.ts
import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

type Servicio = { id_servicio: number; nombre: string; descripcion?: string | null }

const POLL_INTERVAL = 30_000 // 30 segundos

export function useLanding() {
  const [servicios, setServicios] = useState<Servicio[]>([])

  const fetchServicios = useCallback(() => {
    apiRequest<{ data: Servicio[] }>('/api/services?limit=6&activos=true')
      .then(r => setServicios(r.data ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchServicios()

    const interval = setInterval(fetchServicios, POLL_INTERVAL)

    const onFocus = () => fetchServicios()
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [fetchServicios])

  return { servicios }
}
