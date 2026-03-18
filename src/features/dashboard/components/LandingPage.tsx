// src/features/dashboard/components/LandingPage.tsx
import { useState } from 'react'
import { useLanding } from '../hooks/useLanding'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarPlus, Frame, Sparkles, LogOut } from 'lucide-react'
import { Button } from '@/src/shared/components/ui/button'
import { clearAuth } from '@/src/features/auth/hooks/useLogin'

function getToken() { return localStorage.getItem('token') ?? sessionStorage.getItem('token') }
function getRol()   { return localStorage.getItem('rol')   ?? sessionStorage.getItem('rol') }

export function LandingPage() {
  const { servicios } = useLanding()
  const navigate = useNavigate()

  const [token, setToken] = useState(getToken)
  const rol         = getRol()
  const isCliente   = token && rol === 'Cliente'
  const isAdminEmpl = token && (rol === 'Admin' || rol === 'Empleado')

  const handleAgendarCita = () => {
    if (isCliente)        navigate('/mi-cuenta?nueva-cita=true')
    else if (isAdminEmpl) navigate('/admin/dashboard')
  }

  const handleLogout = () => {
    clearAuth()
    setToken(null)
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-secondary/95 backdrop-blur border-b border-secondary-foreground/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-secondary-foreground">SoftwArt</span>
          <div className="flex items-center gap-2">
            {!token && (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm"
                    className="text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground">
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
                <Button variant="ghost" size="sm" onClick={handleLogout}
                  className="text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10 gap-1.5">
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
                <Button variant="ghost" size="sm" onClick={handleLogout}
                  className="text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10 gap-1.5">
                  <LogOut className="h-4 w-4" />Salir
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-secondary text-secondary-foreground/90">
        <div className="max-w-6xl mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-balance">
            Arte Café
          </h1>
          <p className="text-lg md:text-xl text-secondary-foreground/75 mb-2 font-medium tracking-wide uppercase text-sm">
            Marquetería · Laureles, Medellín
          </p>
          <p className="text-lg md:text-xl text-secondary-foreground/80 mt-6 mb-10 max-w-2xl mx-auto text-pretty">
            Enmarcamos tus momentos más especiales con materiales de calidad y atención personalizada.
          </p>

          {(isCliente || isAdminEmpl) && (
            <Button size="lg" onClick={handleAgendarCita}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <CalendarPlus className="h-5 w-5" />
              Agenda tu cita
            </Button>
          )}

        </div>
      </section>

      {/* Servicios */}
      {servicios.length > 0 && (
        <section id="servicios" className="py-20 bg-background scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-3">Nuestros servicios</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Cada pieza es única. Trabajamos con los mejores materiales para que tu obra luzca perfecta.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-10">
              {servicios.map((s) => (
                /* Contenedor: mantiene el espacio en el layout */
                <div key={s.id_servicio} className="relative h-28 w-full sm:w-72">
                  {/* Card: flota por encima al expandirse */}
                  <div className="group absolute inset-x-0 top-0 z-10 bg-card border border-border rounded-xl overflow-hidden cursor-default transition-all duration-300 hover:z-20 hover:shadow-xl hover:border-primary/40">

                    {/* Nombre — absolute para no afectar la altura, se desvanece en hover */}
                    <div className="absolute inset-0 min-h-28 flex items-center justify-center gap-3 px-6 pointer-events-none transition-opacity duration-300 group-hover:opacity-0">
                      <Frame className="w-5 h-5 text-primary shrink-0" />
                      <h3 className="font-semibold text-card-foreground text-center">{s.nombre}</h3>
                    </div>

                    {/* Descripción — en flujo normal, controla la altura real de la card */}
                    <div className="min-h-28 flex items-center justify-center px-6 py-5 bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <p className="text-sm text-foreground text-center leading-relaxed">
                        {s.descripcion ?? s.nombre}
                      </p>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* CTA bajo servicios — solo para no logueados */}
            {!token && (
              <div className="text-center mt-16">
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
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quiénes somos — placeholder hasta que Arte Café entregue la info */}
      <section className="py-20 bg-muted scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Sobre Arte Café</h2>
            <p className="text-muted-foreground text-pretty leading-relaxed">
              Somos una marquetería ubicada en el barrio Laureles – Estadio de Medellín,
              con años de experiencia enmarcando fotografías, pinturas, diplomas y todo
              lo que quieras conservar con estilo. Cada trabajo es personalizado y hecho
              con dedicación para que el resultado supere tus expectativas.
            </p>
          </div>
        </div>
      </section>

      {/* Mapa */}
      <div className="w-full h-72">
        <iframe
          src="https://maps.google.com/maps?q=6.2606,-75.5902&z=17&output=embed"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Footer */}
      <footer className="bg-secondary/95 border-t border-secondary-foreground/10 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-1 text-center">
          <span className="text-sm font-semibold text-secondary-foreground">Arte Café</span>
          <span className="text-xs text-secondary-foreground/50">
            © {new Date().getFullYear()} SoftwArt · Todos los derechos reservados
          </span>
        </div>
      </footer>

    </div>
  )
}
