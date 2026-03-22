import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useRegister } from '../hooks/useRegister'
import { Button }   from '@/src/shared/components/ui/button'
import { Input }    from '@/src/shared/components/ui/input'
import { Checkbox } from '@/src/shared/components/ui/checkbox'
import { ArrowLeft, Eye, EyeOff, LogIn } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/src/shared/components/ui/select'

const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'PP', label: 'Pasaporte' },
]

const fieldCls =
  'bg-[#f5f3ef] border-0 border-b border-border rounded-none rounded-t-lg ' +
  'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#002926] ' +
  'py-3 px-4 h-auto text-foreground placeholder:text-muted-foreground/50 transition-colors'
const labelCls = 'block text-xs font-medium uppercase tracking-widest text-foreground/70 mb-1.5'

export function RegisterPage() {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? undefined
  const { onSubmit, isLoading, error } = useRegister(redirect)

  const [tipoDocumento,  setTipoDocumento]  = useState('')
  const [documento,      setDocumento]      = useState('')
  const [nombre,         setNombre]         = useState('')
  const [correo,         setCorreo]         = useState('')
  const [telefono,       setTelefono]       = useState('')
  const [clave,          setClave]          = useState('')
  const [confirmarClave, setConfirmarClave] = useState('')
  const [showClave,      setShowClave]      = useState(false)
  const [showConfirmar,  setShowConfirmar]  = useState(false)
  const [acceptTerms,    setAcceptTerms]    = useState(false)

  const passwordsMatch    = clave === confirmarClave
  const showMismatchError = confirmarClave.length > 0 && !passwordsMatch
  const isFormValid =
    tipoDocumento && documento && nombre && correo &&
    telefono && clave && confirmarClave && passwordsMatch && acceptTerms

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordsMatch) return
    await onSubmit({ tipoDocumento, documento, nombre, correo, telefono, clave })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#002926] selection:bg-[#805533]/30">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-serif font-bold italic text-secondary">
            Arte Café
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <LogIn className="h-3.5 w-3.5" />
              Iniciar sesión
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
      <main className="flex-1 flex items-center justify-center px-4 py-24 md:py-32 relative overflow-hidden">

        {/* Blobs decorativos de fondo */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-[#805533] blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-[#06403d] blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white rounded-xl border border-white/10 p-8 md:p-12 shadow-2xl">

          {/* Cabecera */}
          <div className="text-center mb-10">
            <h1 className="font-serif italic text-4xl md:text-5xl text-[#002926] tracking-tight mb-2">
              Crear cuenta
            </h1>
            <p className="text-muted-foreground text-sm">
              Únase a nuestra comunidad de artesanos y amantes del café.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Tipo + Número de documento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Tipo de documento</label>
                <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                  <SelectTrigger className={fieldCls}>
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={labelCls} htmlFor="documento">Número de documento</label>
                <Input
                  id="documento" type="text"
                  value={documento} onChange={e => setDocumento(e.target.value)}
                  placeholder="Ej: 1023456789" required
                  className={fieldCls}
                />
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className={labelCls} htmlFor="nombre">Nombre completo</label>
              <Input
                id="nombre" type="text"
                value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Su nombre como aparece en el documento" required
                className={fieldCls}
              />
            </div>

            {/* Correo + Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelCls} htmlFor="correo">Correo electrónico</label>
                <Input
                  id="correo" type="email"
                  value={correo} onChange={e => setCorreo(e.target.value)}
                  placeholder="nombre@ejemplo.com" required
                  className={fieldCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="telefono">Teléfono</label>
                <Input
                  id="telefono" type="tel"
                  value={telefono} onChange={e => setTelefono(e.target.value)}
                  placeholder="+57 300 000 0000" required
                  className={fieldCls}
                />
              </div>
            </div>

            {/* Contraseña + Confirmar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelCls} htmlFor="clave">Contraseña</label>
                <div className="relative">
                  <Input
                    id="clave"
                    type={showClave ? 'text' : 'password'}
                    value={clave} onChange={e => setClave(e.target.value)}
                    placeholder="••••••••" required
                    className={`${fieldCls} pr-10`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    onClick={() => setShowClave(v => !v)}
                  >
                    {showClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls} htmlFor="confirmarClave">Confirmar contraseña</label>
                <div className="relative">
                  <Input
                    id="confirmarClave"
                    type={showConfirmar ? 'text' : 'password'}
                    value={confirmarClave} onChange={e => setConfirmarClave(e.target.value)}
                    placeholder="••••••••" required
                    className={`${fieldCls} pr-10`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    onClick={() => setShowConfirmar(v => !v)}
                  >
                    {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {showMismatchError && (
                  <p className="text-sm text-destructive mt-1">Las contraseñas no coinciden</p>
                )}
              </div>
            </div>

            {/* Términos */}
            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={v => setAcceptTerms(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                Acepto los{' '}
                <span className="text-foreground font-semibold underline underline-offset-2 cursor-pointer">
                  Términos de Servicio
                </span>
                {' '}y la{' '}
                <span className="text-foreground font-semibold underline underline-offset-2 cursor-pointer">
                  Política de Privacidad
                </span>
                {' '}de Arte Café.
              </label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* CTA */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full bg-[#805533] hover:bg-[#a6714a] text-white font-serif italic text-xl py-6 rounded-lg shadow-lg shadow-[#805533]/20 transition-all active:scale-[0.98]"
              >
                {isLoading ? 'Creando cuenta...' : 'Registrarse'}
              </Button>
            </div>
          </form>

          {/* Enlace login */}
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to={redirect ? `/login?redirect=${redirect}` : '/login'}
                className="text-[#002926] font-semibold ml-1 hover:underline decoration-[#805533] underline-offset-4 transition-all"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        {/* Decorativo */}
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
          <span className="font-serif text-lg font-bold italic text-secondary-foreground">Arte Café</span>
          <span className="text-xs text-secondary-foreground/50">
            © {new Date().getFullYear()} SoftwArt · Todos los derechos reservados
          </span>
        </div>
      </footer>

    </div>
  )
}
