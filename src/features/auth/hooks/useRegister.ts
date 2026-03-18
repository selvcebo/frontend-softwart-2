// ================================================================
// src/features/auth/hooks/useRegister.ts
// ================================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '@/src/shared/lib/apiClient'

type RegisterDto = {
  tipoDocumento: string
  documento: string
  nombre: string
  correo: string
  clave: string
  telefono: string // FIX: era opcional — en el backend es NOT NULL
}

export function useRegister(loginRedirect?: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const onSubmit = async (data: RegisterDto) => {
    setIsLoading(true)
    setError(null)
    try {
      await apiRequest('/api/auth/registro', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      navigate(loginRedirect ? `/login?redirect=${loginRedirect}` : '/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setIsLoading(false)
    }
  }

  return { onSubmit, isLoading, error }
}