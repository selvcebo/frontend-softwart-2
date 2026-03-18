// ================================================================
// src/features/auth/components/RecuperarPage.tsx
//
// FIX: el mensaje de éxito decía "te enviamos un enlace" pero el
// backend manda un CÓDIGO de 6 dígitos, no un link. Se corrigió
// el texto y se añade la instrucción de ir a /reset.
// ================================================================
import { useRecuperar } from '../hooks/useRecuperar'
import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/src/shared/components/ui/button'
import { Input } from '@/src/shared/components/ui/input'
import { Label } from '@/src/shared/components/ui/label'
 
export function RecuperarPage() {
  const { onSubmit, isLoading, error: hookError } = useRecuperar()
  const [correo, setCorreo] = useState('')
  const [localError, setLocalError] = useState('')
  const [success, setSuccess] = useState(false)
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (!correo.trim()) {
      setLocalError('Campo requerido')
      return
    }
    try {
      await onSubmit(correo)
      setSuccess(true)
    } catch {
      // hookError lo muestra
    }
  }
 
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Recuperar contraseña</h1>
        </div>
 
        {success ? (
          <div className="rounded-md bg-emerald-100 border border-emerald-300 p-4 text-center space-y-2">
            <p className="text-sm text-emerald-800 font-medium">
              ¡Código enviado!
            </p>
            <p className="text-sm text-emerald-700">
              Revisa tu correo — te enviamos un código de 6 dígitos.
            </p>
            <Link to="/reset" className="text-sm text-emerald-700 underline block mt-2">
              Ir a restablecer contraseña →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {hookError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
                <p className="text-sm text-destructive">{hookError}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="correo" className="text-foreground">
                Correo electrónico <span className="text-red-500">*</span>
              </Label>
              <Input
                id="correo"
                type="email"
                placeholder="correo@ejemplo.com"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value)
                  if (localError) setLocalError('')
                }}
                className="bg-card text-foreground border-border"
              />
              {localError && (
                <p className="text-sm text-destructive mt-1">{localError}</p>
              )}
            </div>
 
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar código de recuperación'
              )}
            </Button>
          </form>
        )}
 
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}