// src/features/auth/components/LoginPage.tsx
// CAMBIO: si viene con ?redirect=cita, después del login va a /mi-cuenta?nueva-cita=true
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLogin } from '../hooks/useLogin'
import { Button }   from '@/src/shared/components/ui/button'
import { Input }    from '@/src/shared/components/ui/input'
import { Label }    from '@/src/shared/components/ui/label'
import { Checkbox } from '@/src/shared/components/ui/checkbox'
import { CalendarPlus } from 'lucide-react'
import { SplashScreen } from '@/src/shared/components/SplashScreen'

export function LoginPage() {
  const [searchParams]  = useSearchParams()
  const redirectCita    = searchParams.get('redirect') === 'cita'

  const { login, isLoading, error } = useLogin(redirectCita)
  const [correo,   setCorreo]   = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(correo, password, remember)
  }

  if (isLoading) return <SplashScreen />

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">

        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">SoftwArt</h1>
          <p className="text-muted-foreground mt-1">Inicia sesión en tu cuenta</p>
        </div>

        {/* Banner contextual cuando viene desde "Agenda tu cita" */}
        {redirectCita && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <CalendarPlus className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              Inicia sesión para agendar tu cita. ¿No tienes cuenta?{' '}
              <Link to="/registro" className="text-primary font-medium hover:underline">Regístrate gratis</Link>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="correo" className="text-foreground">Correo <span className="text-red-500">*</span></Label>
            <Input
              id="correo" type="email" autoComplete="email"
              value={correo} onChange={e => setCorreo(e.target.value)}
              placeholder="tu@correo.com"
              className="bg-card text-foreground border-border" required
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-foreground">Contraseña <span className="text-red-500">*</span></Label>
              <Link to="/recuperar" className="text-xs text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password" type="password" autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-card text-foreground border-border" required
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember" checked={remember} onCheckedChange={v => setRemember(v === true)} />
            <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
              Recordarme en este dispositivo
            </Label>
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <Button type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Iniciar sesión
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link to={redirectCita ? '/registro?redirect=cita' : '/registro'} className="text-primary hover:underline">
            Regístrate
          </Link>
        </p>
    </div>
  )
}