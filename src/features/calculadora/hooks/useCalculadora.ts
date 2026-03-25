// src/features/calculadora/hooks/useCalculadora.ts
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

type Marco = { id_marco: number; codigo: string; colilla: number; precio_ensamblado: number; estado: boolean }
type CreateMarcoDto = Omit<Marco, 'id_marco'>
type UpdateMarcoDto = Partial<CreateMarcoDto>
type ApiResponse<T> = { success: boolean; message?: string; data: T; meta?: unknown }

export function useCalculadora() {
  const [marcos, setMarcos] = useState<Marco[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await apiRequest<ApiResponse<Marco[]>>('/api/marcos')
      setMarcos(res.data ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const onCrear = async (data: CreateMarcoDto) => {
    await apiRequest('/api/marcos', { method: 'POST', body: JSON.stringify(data) })
    await fetchAll()
  }
  const onEditar = async (id: number, data: UpdateMarcoDto) => {
    await apiRequest(`/api/marcos/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    await fetchAll()
  }
  const onEliminar = async (id: number) => {
    await apiRequest(`/api/marcos/${id}`, { method: 'DELETE' })
    await fetchAll()
  }
  const onToggleEstado = async (id: number) => {
    setMarcos(prev => prev.map(m => m.id_marco === id ? { ...m, estado: !m.estado } : m))
    try { await apiRequest(`/api/marcos/${id}/estado`, { method: 'PATCH' }) }
    catch { setMarcos(prev => prev.map(m => m.id_marco === id ? { ...m, estado: !m.estado } : m)) }
  }

  return { marcos, isLoading, error, onCrear, onEditar, onEliminar, onToggleEstado }
}
