import { useState, useEffect, useRef } from 'react'
import { useLanding } from '../hooks/useLanding'
import { Link, useNavigate } from 'react-router-dom'
import { LazyMotion, domAnimation, m, useInView } from 'framer-motion'
import {
  CalendarPlus, LogOut, ArrowRight, BadgeCheck,
  Clock, MapPin, MessageCircle, X,
} from 'lucide-react'
import { Button } from '@/src/shared/components/ui/button'
import { Input } from '@/src/shared/components/ui/input'
import { Label } from '@/src/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/shared/components/ui/dialog'
import { TimePicker } from '@/src/shared/components/TimePicker'
import { DatePicker } from '@/src/shared/components/DatePicker'
import { clearAuth } from '@/src/features/auth/hooks/useLogin'
import { toast } from 'sonner'

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('token') ?? sessionStorage.getItem('token') }
function getRol()   { return localStorage.getItem('rol')   ?? sessionStorage.getItem('rol') }

// ─── Constantes de animación ─────────────────────────────────────────────────
const EASE = [0.22, 1, 0.36, 1] as const

const STAGGER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const FADE_UP = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
}

// ─── Pasos del proceso ────────────────────────────────────────────────────────
const PASOS = [
  {
    n: '01',
    titulo: 'Consulta',
    descripcion: 'Discutimos tu visión, la historia de la pieza y tus preferencias para encontrar el ajuste perfecto.',
  },
  {
    n: '02',
    titulo: 'Selección',
    descripcion: 'Elige entre nuestra colección curada de maderas finas, texturas y soportes de calidad museística.',
  },
  {
    n: '03',
    titulo: 'Artesanía Manual',
    descripcion: 'Nuestros maestros artesanos construyen y terminan meticulosamente tu proyecto a mano en el taller.',
  },
]

const CLD = 'https://res.cloudinary.com/dq1etaydx/image/upload'
const HERO_IMG = `${CLD}/f_auto,q_auto,w_900/v1774138848/landingPagehero_euzx3s.png`
const CARD_IMGS = [
  `${CLD}/f_auto,q_auto,w_600/v1774138848/landingPage1_assbrk.png`,
  `${CLD}/f_auto,q_auto,w_600/v1774138846/landingPage2restauracion_wpcpl8.png`,
  `${CLD}/f_auto,q_auto,w_600/v1774138847/landingPage3pinturas_y7uwxs.png`,
  `${CLD}/f_auto,q_auto,w_600/v1774138847/landingPage4decoracion_clyg0c.png`,
  `${CLD}/f_auto,q_auto,w_600/v1774138846/landingPage2enmarcacion_ubu86c.png`,
]

// ─── Helper: fade-in al entrar en viewport ───────────────────────────────────
function FadeInView({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px 0px' })
  return (
    <m.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </m.div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────
export function LandingPage() {
  const { servicios } = useLanding()
  const navigate = useNavigate()

  const [token, setToken] = useState(getToken)
  const rol         = getRol()
  const isCliente   = token && rol === 'Cliente'
  const isAdminEmpl = token && (rol === 'Admin' || rol === 'Empleado')

  // Navbar: transparente en top → opaca en scroll
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Servicio activo (click para revelar descripción)
  const [activeService, setActiveService] = useState<number | null>(null)

  // Stagger del proceso
  const processRef    = useRef<HTMLDivElement>(null)
  const processInView = useInView(processRef, { once: true, margin: '-60px 0px' })

  const handleAgendarCita = () => {
    if (isCliente)        navigate('/my-account?nueva-cita=true')
    else if (isAdminEmpl) navigate('/admin/dashboard')
  }

  const handleLogout = () => {
    clearAuth()
    setToken(null)
  }

  // ── Agendar cita sin cuenta (invitado) ───────────────────────────────────
  const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

  const [apptOpen,    setApptOpen]    = useState(false)
  const [apptStep,    setApptStep]    = useState<1 | 2>(1)
  const [apptDone,    setApptDone]    = useState(false)
  const [apptBusy,    setApptBusy]    = useState(false)
  const [bookedSlots, setBookedSlots] = useState<{ hora: string }[]>([])

  const [clientForm, setClientForm] = useState({
    tipoDocumento: '', documento: '', nombre: '', correo: '', telefono: '',
  })
  const tomorrowStr = () => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10)
  }

  const [apptForm, setApptForm] = useState({ fecha: tomorrowStr(), hora: '', observacion: '' })
  const [apptErrors, setApptErrors] = useState<Record<string, string>>({})

  const openAppt = () => {
    setApptStep(1)
    setApptDone(false)
    setClientForm({ tipoDocumento: '', documento: '', nombre: '', correo: '', telefono: '' })
    setApptForm({ fecha: tomorrowStr(), hora: '', observacion: '' })
    setApptErrors({})
    setBookedSlots([])
    setApptOpen(true)
  }

  const loadAvailability = async (fecha: string) => {
    try {
      const res  = await fetch(`${BASE}/api/auth/availability?fecha=${fecha}`)
      const body = await res.json()
      setBookedSlots((body.data ?? []).map((d: { id_cita: number; hora: string }) => ({
        hora: d.hora, id_cita: d.id_cita,
      })))
    } catch { setBookedSlots([]) }
  }

  const handleDateChange = async (fecha: string) => {
    setApptForm(f => ({ ...f, fecha, hora: '' }))
    setApptErrors(p => ({ ...p, fecha: '', hora: '' }))
    await loadAvailability(fecha)
  }

  const handleApptSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!apptForm.fecha) errs.fecha = 'Selecciona una fecha'
    if (!apptForm.hora)  errs.hora  = 'Selecciona una hora'
    if (apptForm.fecha < tomorrowStr()) errs.fecha = 'Solo puedes agendar desde mañana'
    if (Object.keys(errs).length) { setApptErrors(errs); return }
    setApptBusy(true)
    try {
      const res  = await fetch(`${BASE}/api/auth/guest-appointment`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...clientForm, ...apptForm }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.message ?? 'Error al agendar cita')
        return
      }
      setApptDone(true)
    } catch {
      toast.error('No se pudo conectar con el servidor')
    } finally {
      setApptBusy(false)
    }
  }

  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <img
            src="/softwart-logo.png"
            alt="SoftwArt"
            className="h-9 w-auto object-contain"
          />

          {/* Links (desktop) */}
          <div
            className={`hidden md:flex items-center gap-8 transition-colors duration-300 ${
              scrolled ? 'text-foreground' : 'text-secondary-foreground/80'
            }`}
          >
            {[
              ['Inicio',    '#inicio'],
              ['Servicios', '#servicios'],
              ['Proceso',   '#proceso'],
              ['Contacto',  '#contacto'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm font-medium hover:opacity-70 transition-opacity duration-200"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            {!token && (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`hidden sm:flex transition-colors duration-300 ${
                      scrolled
                        ? ''
                        : 'text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground'
                    }`}
                  >
                    Iniciar sesión
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
            {isCliente && (
              <>
                <Link to="/my-account">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Mi cuenta
                  </Button>
                </Link>
                <Button
                  variant="ghost" size="sm" onClick={handleLogout}
                  className={`gap-1.5 ${scrolled ? '' : 'text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground'}`}
                >
                  <LogOut className="h-4 w-4" />Salir
                </Button>
              </>
            )}
            {isAdminEmpl && (
              <>
                <Link to="/admin/dashboard">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Panel admin
                  </Button>
                </Link>
                <Button
                  variant="ghost" size="sm" onClick={handleLogout}
                  className={`gap-1.5 ${scrolled ? '' : 'text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground'}`}
                >
                  <LogOut className="h-4 w-4" />Salir
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section
          id="inicio"
          className="relative min-h-screen flex items-center bg-secondary text-secondary-foreground overflow-hidden"
        >
          {/* Grain texture overlay */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-16 items-center py-28 pt-32">

            {/* Columna izquierda */}
            <div className="space-y-8">
              <m.p
                className="text-xs font-semibold tracking-widest uppercase text-secondary-foreground/60"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                Marquetería · Laureles, Medellín
              </m.p>

              <m.h1
                className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight"
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.1, ease: EASE }}
              >
                Preservando tus momentos más{' '}
                <em className="not-italic text-accent">especiales</em>{' '}
                con manos artesanas
              </m.h1>

              <m.p
                className="text-lg text-secondary-foreground/70 max-w-md leading-relaxed"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.25, ease: EASE }}
              >
                Transformando recuerdos en legados duraderos a través del meticuloso
                arte de la marquetería artesanal y el enmarcado personalizado.
              </m.p>

              <m.div
                className="flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
              >
                {(isCliente || isAdminEmpl) ? (
                  <Button
                    size="lg"
                    onClick={handleAgendarCita}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                  >
                    <CalendarPlus className="h-5 w-5" />
                    Agenda tu cita
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                      onClick={openAppt}
                    >
                      <CalendarPlus className="h-5 w-5" />
                      Quiero agendar una cita
                    </Button>
                    <Link to="/login">
                      <Button
                        size="lg" variant="ghost"
                        className="text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
                      >
                        Ya tengo cuenta
                      </Button>
                    </Link>
                  </>
                )}
              </m.div>
            </div>

            {/* Columna derecha — imagen (LCP: sin animación de entrada para render inmediato) */}
            <div className="relative hidden md:block">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  alt="Taller artesanal Arte Café"
                  className="w-full h-full object-cover"
                  src={HERO_IMG}
                  width={900}
                  height={1125}
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-44 h-44 bg-primary/25 rounded-2xl -z-10" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/30 rounded-xl -z-10" />
            </div>
          </div>
        </section>

        {/* ── Servicios ───────────────────────────────────────────────────── */}
        {servicios.length > 0 && (
          <section id="servicios" className="py-20 bg-muted scroll-mt-16">
            <div className="max-w-7xl mx-auto px-6">
              <FadeInView className="text-center mb-8">
                <span className="text-xs font-semibold tracking-widest uppercase text-primary">
                  Artesanía
                </span>
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-3">
                  Nuestros Servicios
                </h2>
                <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
                  Cada pieza es única. Trabajamos con los mejores materiales para que tu obra luzca perfecta.
                </p>
              </FadeInView>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {servicios.map((s, i) => {
                  const isActive = activeService === s.id_servicio
                  return (
                    <FadeInView key={s.id_servicio} delay={i * 0.08}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={`relative h-72 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                          isActive
                            ? 'ring-2 ring-primary shadow-xl scale-[1.02]'
                            : 'shadow-sm hover:shadow-md hover:scale-[1.01]'
                        }`}
                        onClick={() => setActiveService(isActive ? null : s.id_servicio)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveService(isActive ? null : s.id_servicio) }}
                      >
                        <img
                          src={CARD_IMGS[i % CARD_IMGS.length]}
                          alt={s.nombre}
                          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isActive ? 'scale-105 blur-sm' : ''}`}
                        />
                        <div className={`absolute inset-0 z-10 transition-all duration-500 ${isActive ? 'bg-black/70' : 'bg-gradient-to-t from-black/75 via-black/20 to-transparent'}`} />
                        <div className="absolute bottom-0 p-4 z-20 w-full">
                          <h3 className="text-white font-semibold text-base leading-tight">
                            {s.nombre}
                          </h3>
                          <m.div
                            className="overflow-hidden"
                            initial={false}
                            animate={isActive ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                            transition={{ duration: 0.35, ease: EASE }}
                          >
                            <p className="text-white/80 text-xs leading-relaxed mt-2">
                              {s.descripcion ?? s.nombre}
                            </p>
                            <button
                              className="mt-2 text-accent text-xs font-semibold flex items-center gap-1"
                              onClick={e => { e.stopPropagation(); setActiveService(null) }}
                            >
                              <X className="h-3 w-3" /> Cerrar
                            </button>
                          </m.div>
                          {!isActive && (
                            <span className="text-white/50 text-[10px] flex items-center gap-1 mt-1">
                              <ArrowRight className="h-3 w-3" /> Ver descripción
                            </span>
                          )}
                        </div>
                      </div>
                    </FadeInView>
                  )
                })}
              </div>

              {!token && (
                <FadeInView className="text-center mt-10 mb-2">
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                      onClick={openAppt}
                    >
                      <CalendarPlus className="h-5 w-5" />
                      Quiero agendar una cita
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      ¿Ya tienes cuenta?{' '}
                      <Link to="/login" className="text-primary underline underline-offset-2">Inicia sesión</Link>
                    </p>
                  </div>
                </FadeInView>
              )}
            </div>
          </section>
        )}

        {/* ── Proceso ─────────────────────────────────────────────────────── */}
        <section id="proceso" className="py-24 bg-background scroll-mt-16">
          <div className="max-w-7xl mx-auto px-6">
            <FadeInView className="text-center mb-10">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-3">
                Cómo Trabajamos
              </h2>
              <p className="text-muted-foreground">
                Un viaje desde el concepto hasta la creación
              </p>
            </FadeInView>

            <m.div
              ref={processRef}
              className="grid md:grid-cols-3 gap-12 relative"
              variants={STAGGER}
              initial="hidden"
              animate={processInView ? 'visible' : 'hidden'}
            >
              {PASOS.map((p, i) => (
                <m.div key={p.n} variants={FADE_UP} className="text-center relative">
                  <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-serif text-2xl font-bold mx-auto mb-6 shadow-lg">
                    {p.n}
                  </div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-3">{p.titulo}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.descripcion}</p>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-[62%] w-[78%] h-px border-t border-dashed border-border" />
                  )}
                </m.div>
              ))}
            </m.div>
          </div>
        </section>

        {/* ── Sobre Arte Café ─────────────────────────────────────────────── */}
        <section className="py-20 bg-muted scroll-mt-16">
          <div className="max-w-7xl mx-auto px-6">
            <FadeInView className="max-w-2xl mx-auto text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                <BadgeCheck className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-foreground">Sobre Arte Café</h2>
              <p className="text-muted-foreground text-pretty leading-relaxed">
                Somos una marquetería ubicada en el barrio Laureles – Estadio de Medellín,
                con años de experiencia enmarcando fotografías, pinturas, diplomas y todo
                lo que quieras conservar con estilo. Cada trabajo es personalizado y hecho
                con dedicación para que el resultado supere tus expectativas.
              </p>
            </FadeInView>
          </div>
        </section>

        {/* ── Contacto ────────────────────────────────────────────────────── */}
        <section id="contacto" className="py-20 bg-background scroll-mt-16">
          <div className="max-w-7xl mx-auto px-8 lg:px-12 grid md:grid-cols-2 gap-8 items-stretch">
            <FadeInView className="bg-muted rounded-2xl border border-border p-8 flex flex-col justify-between">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
                  Visita Nuestro Taller
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Taller Principal y Galería</p>
                      <p className="text-muted-foreground text-sm">Cra. 74 #50, Laureles – Estadio, Medellín</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Horario de Atención</p>
                      <p className="text-muted-foreground text-sm">Lun – Vie: 09:00 – 18:00</p>
                      <p className="text-muted-foreground text-sm">Sábado: 10:00 – 14:00</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <MessageCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Contacto (WhatsApp)</p>
                      <p className="text-muted-foreground text-sm">+57 300 5414130</p>
                    </div>
                  </div>
                </div>
              </div>
              {!token && (
                <div className="mt-8">
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2"
                    onClick={openAppt}
                  >
                    Agendar una Cita <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </FadeInView>

            <FadeInView
              delay={0.15}
              className="rounded-xl overflow-hidden border border-border shadow-sm min-h-[380px]"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1589.1411649985575!2d-75.5900702757797!3d6.26116392340876!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e44290015ff5b7d%3A0x17b7e0f09ebe520e!2zQXJ0ZUNhZsOp!5e0!3m2!1ses-419!2sco!4v1777095655596!5m2!1ses-419!2sco"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '380px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Arte Café"
              />
            </FadeInView>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-secondary border-t border-secondary-foreground/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-1 text-center">
          <span className="text-xs text-secondary-foreground/75">
            © {new Date().getFullYear()} SoftwArt · Todos los derechos reservados
          </span>
        </div>
      </footer>

    </div>

    {/* ── Dialog agendar cita sin cuenta ────────────────────────────────── */}
    <Dialog open={apptOpen} onOpenChange={setApptOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {apptDone ? '¡Cita agendada!' : apptStep === 1 ? 'Tus datos' : 'Elige tu cita'}
          </DialogTitle>
          {!apptDone && (
            <p className="text-xs text-muted-foreground">
              Paso {apptStep} de 2 ·{' '}
              {apptStep === 1
                ? 'Completa tus datos de contacto'
                : 'Selecciona fecha y hora disponible'}
            </p>
          )}
        </DialogHeader>

        {/* ── Éxito ── */}
        {apptDone && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
              <BadgeCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">¡Tu cita quedó registrada!</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Te llegará una confirmación al correo. Nos vemos pronto en Arte Café.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              ¿Quieres rastrear el estado de tus pedidos?{' '}
              <Link
                to="/register"
                className="text-primary underline underline-offset-2"
                onClick={() => setApptOpen(false)}
              >
                Crea una cuenta
              </Link>
            </p>
            <Button className="w-full" onClick={() => setApptOpen(false)}>Cerrar</Button>
          </div>
        )}

        {/* ── Paso 1: datos del cliente ── */}
        {!apptDone && apptStep === 1 && (
          <form
            onSubmit={async (e) => { e.preventDefault(); await loadAvailability(apptForm.fecha); setApptStep(2) }}
            className="flex flex-col gap-4 pt-1"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="g-tipo">Tipo de documento</Label>
                <Select
                  value={clientForm.tipoDocumento}
                  onValueChange={v => setClientForm(f => ({ ...f, tipoDocumento: v }))}
                  required
                >
                  <SelectTrigger id="g-tipo">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                    <SelectItem value="PP">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="g-doc">Número de documento</Label>
                <Input
                  id="g-doc"
                  value={clientForm.documento}
                  onChange={e => setClientForm(f => ({ ...f, documento: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="g-nombre">Nombre completo</Label>
              <Input
                id="g-nombre"
                value={clientForm.nombre}
                onChange={e => setClientForm(f => ({ ...f, nombre: e.target.value }))}
                minLength={2}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="g-correo">Correo electrónico</Label>
              <Input
                id="g-correo"
                type="email"
                value={clientForm.correo}
                onChange={e => setClientForm(f => ({ ...f, correo: e.target.value }))}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="g-tel">
                Teléfono <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Input
                id="g-tel"
                type="tel"
                value={clientForm.telefono}
                onChange={e => setClientForm(f => ({ ...f, telefono: e.target.value }))}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              ¿Prefieres acceso completo con rastreo de pedidos?{' '}
              <Link
                to="/register"
                className="text-primary underline underline-offset-2"
                onClick={() => setApptOpen(false)}
              >
                Crear una cuenta
              </Link>
            </p>

            <Button
              type="submit"
              disabled={!clientForm.tipoDocumento}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Siguiente →
            </Button>
          </form>
        )}

        {/* ── Paso 2: fecha y hora ── */}
        {!apptDone && apptStep === 2 && (
          <form onSubmit={handleApptSubmit} className="flex flex-col gap-4 pt-1">
            <div>
              <Label className="mb-1.5 block">
                Fecha <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                value={apptForm.fecha}
                min={tomorrowStr()}
                error={apptErrors.fecha}
                onChange={handleDateChange}
              />
              {apptErrors.fecha && <p className="text-xs text-destructive mt-1">{apptErrors.fecha}</p>}
            </div>

            <TimePicker
              value={apptForm.hora}
              onChange={v => { setApptForm(f => ({ ...f, hora: v })); setApptErrors(p => ({ ...p, hora: '' })) }}
              error={apptErrors.hora}
              bookedSlots={bookedSlots}
            />

            <div>
              <Label className="mb-1.5 block" htmlFor="g-obs">
                Observaciones{' '}
                <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
              </Label>
              <textarea
                id="g-obs"
                value={apptForm.observacion}
                onChange={e => setApptForm(f => ({ ...f, observacion: e.target.value }))}
                placeholder="Cuéntanos qué necesitas, medidas, tipo de marco, etc."
                rows={3}
                className="w-full bg-muted border-0 border-b-2 border-transparent px-4 py-3 rounded-t-lg text-sm resize-none focus:outline-none focus:border-secondary transition-all"
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setApptStep(1)}>
                ← Atrás
              </Button>
              <Button
                type="submit"
                disabled={apptBusy}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <CalendarPlus className="h-4 w-4" />
                {apptBusy ? 'Agendando…' : 'Confirmar cita'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>

    </LazyMotion>
  )
}
