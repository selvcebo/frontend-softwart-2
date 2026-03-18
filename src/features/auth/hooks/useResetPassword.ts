// ================================================================
// src/features/auth/hooks/useResetPassword.ts
//
// FIX CRÍTICO: el token NO viene de la URL (?token=...).
// El backend genera un código de 6 dígitos que llega al correo
// y el usuario lo escribe manualmente en el formulario.
// El formulario debe tener DOS campos: token + nueva_clave.
// ================================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '@/src/shared/lib/apiClient'

export function useResetPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (token: string, nueva_clave: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, nueva_clave }),
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  return { onSubmit, isLoading, error, success }
}