import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import { useRecuperar } from '../hooks/useRecuperar'
import { Button } from '@/src/shared/components/ui/button'
import { Input }  from '@/src/shared/components/ui/input'
import { ArrowLeft, ArrowRight, LockKeyhole, Loader2, LogIn, MailCheck } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

const labelCls = 'block text-xs font-medium capitalize tracking-widest text-foreground/70 mb-2'
const fieldCls =
  'bg-[#f5f3ef] border-0 border-b border-border rounded-none ' +
  'focus-visible:ring-0 focus-visible:ring-offset-0 ' +
  'px-4 py-4 h-auto transition-all text-foreground placeholder:text-muted-foreground/50'

export function RecuperarPage() {
  const { onSubmit, isLoading, error: hookError } = useRecuperar()
  const [correo,     setCorreo]     = useState('')
  const [localError, setLocalError] = useState('')
  const [success,    setSuccess]    = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (!correo.trim()) { setLocalError('Campo requerido'); return }
    try {
      await onSubmit(correo)
      setSuccess(true)
    } catch { /* hookError lo muestra */ }
  }

  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen flex flex-col bg-[#002926] selection:bg-[#805533]/30">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <m.header
        className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <img src="/softwart-logo.png" alt="SoftwArt" className="h-9 w-auto object-contain" />
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
      </m.header>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-24 relative overflow-hidden">

        {/* Blobs decorativos de fondo */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-[#805533] blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-[#06403d] blur-[100px]" />
        </div>

        <div className="w-full max-w-md relative z-10">

          {/* Card */}
          <m.div
            className="bg-white p-8 md:p-12 rounded-xl shadow-2xl border border-white/10"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: EASE }}
          >
            <AnimatePresence mode="wait">
              {success ? (

                /* ── Estado: código enviado ── */
                <m.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="text-center space-y-5"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <MailCheck className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">¡Código enviado!</h2>
                    <p className="text-muted-foreground text-sm mt-2">
                      Revisa tu correo — te enviamos un código de 6 dígitos.
                    </p>
                  </div>
                  <Link to="/reset">
                    <Button className="w-full bg-[#805533] hover:bg-[#70492c] text-white font-semibold gap-2 py-5 mt-2">
                      Ingresar mi código <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </m.div>

              ) : (

                /* ── Formulario ── */
                <m.div
                  key="form"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  {/* Ícono */}
                  <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-[#efeeea] flex items-center justify-center">
                      <LockKeyhole className="h-7 w-7 text-[#805533]" />
                    </div>
                  </div>

                  {/* Título */}
                  <h1 className="font-serif italic text-3xl md:text-4xl text-center text-[#002926] tracking-tight mb-4">
                    Recuperar contraseña
                  </h1>
                  <p className="text-muted-foreground text-center text-sm mb-10 px-4 leading-relaxed">
                    Ingresa tu correo para enviarte un código de recuperación
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-8">

                    {(hookError || localError) && (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                        <p className="text-sm text-destructive">{hookError || localError}</p>
                      </div>
                    )}

                    {/* Campo correo con subrayado animado */}
                    <div className="relative group">
                      <label className={labelCls} htmlFor="correo">Correo electrónico</label>
                      <Input
                        id="correo" type="email"
                        value={correo}
                        onChange={e => { setCorreo(e.target.value); if (localError) setLocalError('') }}
                        placeholder="ejemplo@artecafe.com" required
                        className={fieldCls}
                      />
                      {/* Barra animada de focus */}
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#002926] transition-all duration-500 group-focus-within:w-full" />
                    </div>

                    <Button
                      type="submit" disabled={isLoading}
                      className="w-full bg-[#805533] hover:bg-[#a6714a] text-white font-serif italic text-xl py-6 rounded-lg shadow-lg shadow-[#805533]/20 transition-all active:scale-[0.98] gap-2"
                    >
                      {isLoading
                        ? <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</>
                        : <>Enviar código <ArrowRight className="h-4 w-4" /></>
                      }
                    </Button>
                  </form>

                  <div className="mt-12 text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-[#805533] transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver al inicio de sesión
                    </Link>
                  </div>
                </m.div>

              )}
            </AnimatePresence>
          </m.div>

          {/* Decorativo */}
          <m.div
            className="mt-8 flex justify-center items-center gap-4 opacity-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
          >
            <div className="h-px w-12 bg-white/40" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">Artesanía &amp; Precisión</span>
            <div className="h-px w-12 bg-white/40" />
          </m.div>

        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <m.footer
        className="bg-secondary border-t border-secondary-foreground/10 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-1 text-center">
          <span className="text-xs text-secondary-foreground/50">
            © {new Date().getFullYear()} SoftwArt · Todos los derechos reservados
          </span>
        </div>
      </m.footer>

    </div>
    </LazyMotion>
  )
}
