// src/features/dashboard/hooks/useDashboard.ts
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import type { DashboardData } from '../types'

type ApiRes = { success: boolean; data: DashboardData }

export function useDashboard() {
  const [data,      setData]      = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchDashboard = async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await apiRequest<ApiRes>('/api/dashboard')
      setData(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  return { data, isLoading, error, refetch: fetchDashboard }
}