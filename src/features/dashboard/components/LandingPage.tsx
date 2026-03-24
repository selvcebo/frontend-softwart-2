import { useState, useEffect, useRef } from 'react'
import { useLanding } from '../hooks/useLanding'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  CalendarPlus, LogOut, ArrowRight, BadgeCheck,
  Clock, MapPin, MessageCircle, X,
} from 'lucide-react'
import { Button } from '@/src/shared/components/ui/button'
import { clearAuth } from '@/src/features/auth/hooks/useLogin'

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

const CARD_IMGS = [
  'https://res.cloudinary.com/dq1etaydx/image/upload/v1774138848/landingPage1_assbrk.png',
  'https://res.cloudinary.com/dq1etaydx/image/upload/v1774138846/landingPage2restauracion_wpcpl8.png',
  'https://res.cloudinary.com/dq1etaydx/image/upload/v1774138847/landingPage3pinturas_y7uwxs.png',
  'https://res.cloudinary.com/dq1etaydx/image/upload/v1774138847/landingPage4decoracion_clyg0c.png',
  'https://res.cloudinary.com/dq1etaydx/image/upload/v1774138846/landingPage2enmarcacion_ubu86c.png',
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
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </motion.div>
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
    if (isCliente)        navigate('/mi-cuenta?nueva-cita=true')
    else if (isAdminEmpl) navigate('/admin/dashboard')
  }

  const handleLogout = () => {
    clearAuth()
    setToken(null)
  }

  return (
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
          <span
            className={`text-xl font-serif font-bold italic transition-colors duration-300 ${
              scrolled ? 'text-secondary' : 'text-secondary-foreground'
            }`}
          >
            Arte Café
          </span>

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
                <Link to="/registro">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
            {isCliente && (
              <>
                <Link to="/mi-cuenta">
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
              <motion.p
                className="text-xs font-semibold tracking-widest uppercase text-secondary-foreground/60"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                Marquetería · Laureles, Medellín
              </motion.p>

              <motion.h1
                className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight"
                initial={{ opacity: 0, y: 36 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.1, ease: EASE }}
              >
                Preservando tus momentos más{' '}
                <em className="not-italic text-accent">especiales</em>{' '}
                con manos artesanas
              </motion.h1>

              <motion.p
                className="text-lg text-secondary-foreground/70 max-w-md leading-relaxed"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.25, ease: EASE }}
              >
                Transformando recuerdos en legados duraderos a través del meticuloso
                arte de la marquetería artesanal y el enmarcado personalizado.
              </motion.p>

              <motion.div
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
                    <Link to="/registro">
                      <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                        <CalendarPlus className="h-5 w-5" />
                        Quiero agendar una cita
                      </Button>
                    </Link>
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
              </motion.div>
            </div>

            {/* Columna derecha — imagen */}
            <motion.div
              className="relative hidden md:block"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  alt="Taller artesanal Arte Café"
                  className="w-full h-full object-cover"
                  src="https://res.cloudinary.com/dq1etaydx/image/upload/v1774138848/landingPagehero_euzx3s.png"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-44 h-44 bg-primary/25 rounded-2xl -z-10" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/30 rounded-xl -z-10" />
            </motion.div>
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
                        className={`relative h-72 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                          isActive
                            ? 'ring-2 ring-primary shadow-xl scale-[1.02]'
                            : 'shadow-sm hover:shadow-md hover:scale-[1.01]'
                        }`}
                        onClick={() => setActiveService(isActive ? null : s.id_servicio)}
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
                          <motion.div
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
                          </motion.div>
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
                    <Link to="/registro">
                      <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                        <CalendarPlus className="h-5 w-5" />
                        Quiero agendar una cita
                      </Button>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      ¿Ya tienes cuenta?{' '}
                      <Link to="/login" className="text-primary hover:underline">Inicia sesión</Link>
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

            <motion.div
              ref={processRef}
              className="grid md:grid-cols-3 gap-12 relative"
              variants={STAGGER}
              initial="hidden"
              animate={processInView ? 'visible' : 'hidden'}
            >
              {PASOS.map((p, i) => (
                <motion.div key={p.n} variants={FADE_UP} className="text-center relative">
                  <div className="w-16 h-16 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-serif text-2xl font-bold mx-auto mb-6 shadow-lg">
                    {p.n}
                  </div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-3">{p.titulo}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.descripcion}</p>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-8 left-[62%] w-[78%] h-px border-t border-dashed border-border" />
                  )}
                </motion.div>
              ))}
            </motion.div>
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
                  <Link to="/registro">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2">
                      Agendar una Cita <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </FadeInView>

            <FadeInView
              delay={0.15}
              className="rounded-xl overflow-hidden border border-border shadow-sm min-h-[380px]"
            >
              <iframe
                src="https://maps.google.com/maps?q=6.2606,-75.5902&z=17&output=embed"
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
          <span className="font-serif text-lg font-bold italic text-secondary-foreground">Arte Café</span>
          <span className="text-xs text-secondary-foreground/50">
            © {new Date().getFullYear()} SoftwArt · Todos los derechos reservados
          </span>
        </div>
      </footer>

    </div>
  )
}
