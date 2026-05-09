// src/features/calculator/hooks/useCalculator.ts
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import type { Marco, CreateMarcoDto, UpdateMarcoDto } from '../types'

type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: unknown }

export function useCalculator() {
  const [marcos, setMarcos] = useState<Marco[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await apiRequest<ApiResponse<Marco[]>>('/api/frames')
      setMarcos(res.data ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const onCreate = async (data: CreateMarcoDto) => {
    await apiRequest('/api/frames', { method: 'POST', body: JSON.stringify(data) })
    await fetchAll()
  }
  const onEdit = async (id: number, data: UpdateMarcoDto) => {
    await apiRequest(`/api/frames/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    await fetchAll()
  }
  const onDelete = async (id: number) => {
    await apiRequest(`/api/frames/${id}`, { method: 'DELETE' })
    await fetchAll()
  }
  const onToggleStatus = async (id: number) => {
    setMarcos(prev => prev.map(m => m.id_marco === id ? { ...m, estado: !m.estado } : m))
    try { await apiRequest(`/api/frames/${id}/estado`, { method: 'PATCH' }) }
    catch { setMarcos(prev => prev.map(m => m.id_marco === id ? { ...m, estado: !m.estado } : m)) }
  }

  return { marcos, isLoading, error, onCreate, onEdit, onDelete, onToggleStatus }
}
