// ================================================================
// src/features/auth/hooks/useRecuperar.ts
// ================================================================
import { useState } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

export function useRecuperar() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const onSubmit = async (correo: string) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await apiRequest('/api/auth/recuperar', {
        method: 'POST',
        body: JSON.stringify({ correo }),
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el correo')
    } finally {
      setIsLoading(false)
    }
  }

  return { onSubmit, isLoading, error, success }
}