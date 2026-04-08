import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLogin } from '../hooks/useLogin'
import { Button }      from '@/src/shared/components/ui/button'
import { Input }       from '@/src/shared/components/ui/input'
import { Checkbox }    from '@/src/shared/components/ui/checkbox'
import { ArrowLeft, CalendarPlus, Eye, EyeOff, Lock, Mail, UserPlus } from 'lucide-react'

const labelCls =
  'block text-xs font-medium capitalize tracking-widest text-foreground/70'
const fieldCls =
  'bg-[#f5f3ef] border-0 border-b-2 border-transparent ' +
  'focus-visible:border-[#002926] focus-visible:ring-0 focus-visible:ring-offset-0 ' +
  'rounded-lg py-4 h-auto transition-all text-foreground placeholder:text-muted-foreground/50'

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const redirectCita   = searchParams.get('redirect') === 'cita'
  const { login, error } = useLogin(redirectCita)

  const [correo,   setCorreo]   = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(correo, password, remember)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#002926] selection:bg-[#805533]/30">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <img src="/softwart-logo.png" alt="SoftwArt" className="h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/registro"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Crear cuenta
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 pt-20 pb-12 relative overflow-hidden">

        {/* Blobs decorativos de fondo */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-[#805533] blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-[#06403d] blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-md">

          {/* Card */}
          <div className="bg-white rounded-xl shadow-2xl p-8 md:p-12 border border-white/10">

            <div className="text-center mb-10">
              <h1 className="font-serif italic text-4xl md:text-5xl text-[#002926] tracking-tight mb-2">
                Bienvenido
              </h1>
              <p className="text-muted-foreground text-sm">
                Ingrese sus credenciales para acceder.
              </p>
            </div>

            {/* Banner contextual — solo cuando viene desde "Agenda tu cita" */}
            {redirectCita && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                <CalendarPlus className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  Inicia sesión para agendar tu cita.{' '}
                  <Link to="/registro" className="text-[#805533] font-medium hover:underline">
                    ¿No tienes cuenta?
                  </Link>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Correo */}
              <div className="space-y-2">
                <label className={labelCls} htmlFor="correo">Correo electrónico</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#002926] transition-colors" />
                  <Input
                    id="correo" type="email" autoComplete="email"
                    value={correo} onChange={e => setCorreo(e.target.value)}
                    placeholder="ejemplo@artecafe.com" required
                    className={`${fieldCls} pl-12`}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={labelCls} htmlFor="password">Contraseña</label>
                  <Link
                    to="/recuperar"
                    className="text-xs text-[#805533] hover:text-[#a6714a] transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#002926] transition-colors" />
                  <Input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className={`${fieldCls} pl-12 pr-12`}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    onClick={() => setShowPass(v => !v)}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Recordarme */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={v => setRemember(v === true)}
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                  Recordarme en este dispositivo
                </label>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {/* CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-[#805533] hover:bg-[#a6714a] text-white font-serif italic text-xl py-6 rounded-lg shadow-lg shadow-[#805533]/20 transition-all active:scale-[0.98]"
                >
                  Iniciar sesión
                </Button>
              </div>
            </form>

            <div className="mt-10 text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link
                  to={redirectCita ? '/registro?redirect=cita' : '/registro'}
                  className="text-[#002926] font-semibold hover:underline decoration-[#805533] underline-offset-4 ml-1 transition-all"
                >
                  Regístrate
                </Link>
              </p>
            </div>
          </div>

          {/* Decorativo — "Artesanía & Precisión" */}
          <div className="mt-8 flex justify-center items-center gap-4 opacity-40">
            <div className="h-px w-12 bg-white/40" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">Artesanía &amp; Precisión</span>
            <div className="h-px w-12 bg-white/40" />
          </div>

        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-secondary border-t border-secondary-foreground/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-1 text-center">
          <span className="text-xs text-secondary-foreground/50">
            © {new Date().getFullYear()} SoftwArt · Todos los derechos reservados
          </span>
        </div>
      </footer>

    </div>
  )
}
