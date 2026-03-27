import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import { useResetPassword } from '../hooks/useResetPassword'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { Button } from '@/src/shared/components/ui/button'
import { Input }  from '@/src/shared/components/ui/input'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

const labelCls = 'block text-xs font-medium uppercase tracking-widest text-foreground/70 mb-1'

// Código — grande, mono, centrado, fondo suave
const codeCls =
  'w-full bg-[#f5f3ef] border-0 border-b-2 border-border ' +
  'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#002926] ' +
  'px-4 py-3 h-auto text-2xl tracking-[0.5em] text-center font-mono ' +
  'transition-all text-foreground placeholder:text-muted-foreground/30'

// Contraseñas — sin fondo, solo línea inferior
const passCls =
  'w-full bg-transparent border-0 border-b border-border ' +
  'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#002926] ' +
  'py-3 px-0 h-auto transition-all text-foreground placeholder:text-muted-foreground/50'

export function ResetPasswordPage() {
  const { onSubmit, isLoading, error } = useResetPassword()

  const [token,          setToken]          = useState('')
  const [nuevaClave,     setNuevaClave]     = useState('')
  const [confirmarClave, setConfirmarClave] = useState('')
  const [showNueva,      setShowNueva]      = useState(false)
  const [showConfirmar,  setShowConfirmar]  = useState(false)
  const [errorToken,     setErrorToken]     = useState('')
  const [errorNueva,     setErrorNueva]     = useState('')
  const [errorConfirmar, setErrorConfirmar] = useState('')
  const [success,        setSuccess]        = useState(false)

  // Reenviar código
  const [correoReenvio, setCorreoReenvio] = useState('')
  const [isResending,   setIsResending]   = useState(false)
  const [resendOk,      setResendOk]      = useState(false)
  const [resendError,   setResendError]   = useState('')

  const passwordsMatch = nuevaClave === confirmarClave
  const canSubmit =
    token.trim() !== '' &&
    nuevaClave.trim() !== '' &&
    confirmarClave.trim() !== '' &&
    passwordsMatch &&
    !isLoading

  useEffect(() => {
    if (confirmarClave && !passwordsMatch) setErrorConfirmar('Las contraseñas no coinciden')
    else setErrorConfirmar('')
  }, [nuevaClave, confirmarClave, passwordsMatch])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => { window.location.href = '/login' }, 2000)
    return () => clearTimeout(t)
  }, [success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorToken(''); setErrorNueva(''); setErrorConfirmar('')
    if (!token.trim())          { setErrorToken('Ingresa el código que recibiste en tu correo'); return }
    if (!nuevaClave.trim())     { setErrorNueva('Campo requerido'); return }
    if (!confirmarClave.trim()) { setErrorConfirmar('Campo requerido'); return }
    if (!passwordsMatch)        { setErrorConfirmar('Las contraseñas no coinciden'); return }
    try {
      await onSubmit(token, nuevaClave)
      setSuccess(true)
    } catch { /* error lo muestra el hook */ }
  }

  const handleReenviar = async () => {
    if (!correoReenvio.trim()) return
    setIsResending(true)
    setResendError('')
    setResendOk(false)
    try {
      await apiRequest('/api/auth/reenviar-codigo', {
        method: 'POST',
        body: JSON.stringify({ correo: correoReenvio }),
      })
      setResendOk(true)
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Error al reenviar el código')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen flex flex-col bg-[#002926] selection:bg-[#805533]/30">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
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
      </header>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 pt-20 pb-12 relative overflow-hidden">

        {/* Blobs decorativos de fondo */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-[#805533] blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-[#06403d] blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-xl overflow-hidden shadow-2xl">

          {/* ── Panel izquierdo: imagen con overlay ───────────────────── */}
          <div className="hidden md:block relative bg-[#efeeea] overflow-hidden">
            <div className="absolute inset-0 opacity-20 mix-blend-multiply bg-[#002926] z-10" />
            <img
              alt="Herramientas de marquetería artesanal"
              src="https://res.cloudinary.com/dq1etaydx/image/upload/v1774138852/resetPasswordimg_letuc5.png"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002926]/60 to-transparent z-20" />
            <div className="absolute bottom-8 left-8 right-8 z-30">
              <h2 className="font-serif text-3xl text-white leading-tight tracking-tight">
                La paciencia es el alma<br />de la artesanía.
              </h2>
              <p className="text-white/80 mt-2 text-sm">
                Protege tu espacio en nuestro atelier digital.
              </p>
            </div>
          </div>

          {/* ── Panel derecho: formulario ──────────────────────────────── */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {success ? (

                /* ── Estado: contraseña actualizada ── */
                <m.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="text-center space-y-5"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">¡Contraseña actualizada!</h2>
                    <p className="text-muted-foreground text-sm mt-2">Redirigiendo al inicio de sesión...</p>
                  </div>
                </m.div>

              ) : (

                /* ── Formulario ── */
                <m.div
                  key="form"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <div className="mb-10">
                    <h1 className="font-serif italic text-4xl text-[#002926] tracking-tight mb-3">
                      Nueva contraseña
                    </h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Introduce el código de 6 dígitos que enviamos a tu correo y establece tu nueva clave de acceso.
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Código de recuperación */}
                    <div className="space-y-2">
                      <label className={labelCls} htmlFor="token">Código de recuperación</label>
                      <Input
                        id="token" type="text"
                        maxLength={6}
                        value={token}
                        onChange={e => { setToken(e.target.value.replace(/\D/g, '')); if (errorToken) setErrorToken('') }}
                        placeholder="000000"
                        className={codeCls}
                      />
                      {errorToken && <p className="text-sm text-destructive">{errorToken}</p>}
                    </div>

                    {/* Contraseñas */}
                    <div className="space-y-6">

                      <div>
                        <label className={labelCls} htmlFor="nueva-clave">Nueva contraseña</label>
                        <div className="relative">
                          <Input
                            id="nueva-clave"
                            type={showNueva ? 'text' : 'password'}
                            value={nuevaClave}
                            onChange={e => { setNuevaClave(e.target.value); if (errorNueva) setErrorNueva('') }}
                            placeholder="••••••••"
                            className={`${passCls} pr-8`}
                          />
                          <button
                            type="button"
                            className="absolute right-0 bottom-3 text-muted-foreground/50 hover:text-[#805533] transition-colors"
                            onClick={() => setShowNueva(v => !v)}
                          >
                            {showNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errorNueva && <p className="text-sm text-destructive mt-1">{errorNueva}</p>}
                      </div>

                      <div>
                        <label className={labelCls} htmlFor="confirmar-clave">Confirmar contraseña</label>
                        <div className="relative">
                          <Input
                            id="confirmar-clave"
                            type={showConfirmar ? 'text' : 'password'}
                            value={confirmarClave}
                            onChange={e => setConfirmarClave(e.target.value)}
                            placeholder="••••••••"
                            className={`${passCls} pr-8`}
                          />
                          <button
                            type="button"
                            className="absolute right-0 bottom-3 text-muted-foreground/50 hover:text-[#805533] transition-colors"
                            onClick={() => setShowConfirmar(v => !v)}
                          >
                            {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errorConfirmar && <p className="text-sm text-destructive mt-1">{errorConfirmar}</p>}
                      </div>

                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                      <Button
                        type="submit" disabled={!canSubmit}
                        className="w-full bg-[#805533] hover:bg-[#a6714a] text-white font-serif italic text-xl py-6 rounded-lg shadow-lg shadow-[#805533]/20 transition-all active:scale-[0.98] gap-2"
                      >
                        {isLoading
                          ? 'Guardando...'
                          : <><LockKeyhole className="h-4 w-4" />Guardar nueva contraseña</>
                        }
                      </Button>
                    </div>

                    {/* Reenviar código */}
                    <div className="border-t border-border/30 pt-6 space-y-3">
                      <p className="text-xs text-muted-foreground text-center">¿No recibiste el código?</p>
                      {resendOk ? (
                        <p className="text-xs text-emerald-600 text-center">Código reenviado correctamente.</p>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="Tu correo"
                            value={correoReenvio}
                            onChange={e => { setCorreoReenvio(e.target.value); if (resendError) setResendError('') }}
                            className="bg-[#f5f3ef] border-0 border-b border-border focus-visible:ring-0 focus-visible:ring-offset-0 h-9 px-3 text-sm rounded-none flex-1"
                          />
                          <Button
                            type="button"
                            disabled={isResending || !correoReenvio.trim()}
                            onClick={handleReenviar}
                            variant="outline"
                            className="text-xs px-3 h-9 border-[#805533] text-[#805533] hover:bg-[#805533] hover:text-white shrink-0"
                          >
                            {isResending ? 'Enviando...' : 'Reenviar'}
                          </Button>
                        </div>
                      )}
                      {resendError && <p className="text-xs text-destructive">{resendError}</p>}
                    </div>

                  </form>
                </m.div>

              )}
            </AnimatePresence>
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
    </LazyMotion>
  )
}
