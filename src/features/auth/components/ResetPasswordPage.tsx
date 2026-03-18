// ============================================================
// src/features/auth/components/ResetPasswordPage.tsx
//
// BUG corregido línea 59: onSubmit(nuevaClave) → onSubmit(token, nuevaClave)
// El hook ahora recibe DOS parámetros: el código de 6 dígitos que
// llegó al correo + la nueva contraseña. Se agregó el campo "token".
// ============================================================
import { useResetPassword } from '../hooks/useResetPassword'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/src/shared/components/ui/button'
import { Input } from '@/src/shared/components/ui/input'
import { Label } from '@/src/shared/components/ui/label'

export function ResetPasswordPage() {
  const { onSubmit, isLoading, error } = useResetPassword()
  const [token, setToken] = useState('')
  const [nuevaClave, setNuevaClave] = useState('')
  const [confirmarClave, setConfirmarClave] = useState('')
  const [errorToken, setErrorToken] = useState('')
  const [errorNuevaClave, setErrorNuevaClave] = useState('')
  const [errorConfirmar, setErrorConfirmar] = useState('')
  const [success, setSuccess] = useState(false)

  const passwordsMatch = nuevaClave === confirmarClave
  const canSubmit =
    token.trim() !== '' &&
    nuevaClave.trim() !== '' &&
    confirmarClave.trim() !== '' &&
    passwordsMatch &&
    !isLoading

  useEffect(() => {
    if (confirmarClave && !passwordsMatch) {
      setErrorConfirmar('Las contraseñas no coinciden')
    } else {
      setErrorConfirmar('')
    }
  }, [nuevaClave, confirmarClave, passwordsMatch])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorToken('')
    setErrorNuevaClave('')
    setErrorConfirmar('')

    if (!token.trim()) {
      setErrorToken('Ingresa el código que recibiste en tu correo')
      return
    }
    if (!nuevaClave.trim()) {
      setErrorNuevaClave('Campo requerido')
      return
    }
    if (!confirmarClave.trim()) {
      setErrorConfirmar('Campo requerido')
      return
    }
    if (!passwordsMatch) {
      setErrorConfirmar('Las contraseñas no coinciden')
      return
    }

    try {
      // FIX: firma correcta — (token, nueva_clave)
      await onSubmit(token, nuevaClave)
      setSuccess(true)
    } catch {
      // El error lo muestra el hook en `error`
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Nueva contraseña</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ingresa el código de 6 dígitos que enviamos a tu correo
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-emerald-100 border border-emerald-300 p-4 text-center">
            <p className="text-sm text-emerald-800">Contraseña actualizada</p>
            <p className="text-xs text-emerald-600 mt-1">
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Error del servidor */}
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Campo: código de recuperación */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="token" className="text-foreground">
                Código de recuperación <span className="text-red-500">*</span>
              </Label>
              <Input
                id="token"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={token}
                onChange={(e) => {
                  setToken(e.target.value.replace(/\D/g, '')) // solo dígitos
                  if (errorToken) setErrorToken('')
                }}
                className="bg-card text-foreground border-border tracking-widest text-center text-lg"
              />
              {errorToken && (
                <p className="text-sm text-destructive">{errorToken}</p>
              )}
            </div>

            {/* Campo: nueva contraseña */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="nueva-clave" className="text-foreground">
                Nueva contraseña <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nueva-clave"
                type="password"
                placeholder="••••••••"
                value={nuevaClave}
                onChange={(e) => {
                  setNuevaClave(e.target.value)
                  if (errorNuevaClave) setErrorNuevaClave('')
                }}
                className="bg-card text-foreground border-border"
              />
              {errorNuevaClave && (
                <p className="text-sm text-destructive">{errorNuevaClave}</p>
              )}
            </div>

            {/* Campo: confirmar contraseña */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmar-clave" className="text-foreground">
                Confirmar contraseña <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmar-clave"
                type="password"
                placeholder="••••••••"
                value={confirmarClave}
                onChange={(e) => setConfirmarClave(e.target.value)}
                className="bg-card text-foreground border-border"
              />
              {errorConfirmar && (
                <p className="text-sm text-destructive">{errorConfirmar}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar nueva contraseña'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
