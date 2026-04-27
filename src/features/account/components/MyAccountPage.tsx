// src/features/account/components/MyAccountPage.tsx
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAccount } from '../hooks/useAccount'
import { clearAuth } from '@/src/features/auth/hooks/useLogin'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { CalendarDays, LogOut, User, Lock, AlertTriangle, Plus, Clock, Home, CalendarPlus, Wrench, ChevronDown, X } from 'lucide-react'
import { TimePicker, BookedSlot } from '@/src/shared/components/TimePicker'
import { DatePicker } from '@/src/shared/components/DatePicker'

// ── Helpers storage ───────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('token') ?? sessionStorage.getItem('token') }
function getRol()   { return localStorage.getItem('rol')   ?? sessionStorage.getItem('rol') }

// ── Fecha mínima ──────────────────────────────────────────────────────────────
function tomorrowString() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

// ── Parse fecha para el bloque de calendario ──────────────────────────────────
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
function parseFechaBloque(fecha: string): { mes: string; dia: string } {
  const parts = fecha.split(/[-T]/)
  if (parts.length >= 3) {
    return { mes: MESES[parseInt(parts[1]) - 1] ?? '', dia: String(parseInt(parts[2])) }
  }
  return { mes: '', dia: fecha }
}

// ── Color badge estado cita ───────────────────────────────────────────────────
function estadoBadgeClasses(nombre?: string) {
  if (!nombre) return 'bg-muted text-muted-foreground'
  const s = nombre.toLowerCase()
  if (s.includes('pend'))    return 'bg-orange-100 text-orange-800'
  if (s.includes('complet') || s.includes('conf') || s.includes('val'))
    return 'bg-emerald-100 text-emerald-800'
  if (s.includes('cancel'))  return 'bg-destructive/15 text-destructive'
  return 'bg-muted text-muted-foreground'
}

// ── Color badge estado servicio ───────────────────────────────────────────────
function estadoServicioBadgeClasses(estado: string) {
  const s = estado.toLowerCase()
  if (s.includes('finaliz'))    return 'bg-emerald-100 text-emerald-800'
  if (s.includes('preparac'))   return 'bg-amber-100 text-amber-800'
  return 'bg-muted text-muted-foreground'
}

// ── Clases reutilizables ──────────────────────────────────────────────────────
const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all'
const labelCls = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'

// ── Page ──────────────────────────────────────────────────────────────────────
export function MyAccountPage() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()

  const { perfil, citas, servicios, isLoading, error, onUpdateProfile, onChangePassword, onCancelAppointment, onDeleteAccount } = useAccount()

  // ── Estado formulario perfil ──────────────────────────────────────────────
  const [nombre,         setNombre]         = useState('')
  const [telefono,       setTelefono]       = useState('')
  const [correo,         setCorreo]         = useState('')
  const [perfilMsg,      setPerfilMsg]      = useState<string | null>(null)
  const [perfilMsgType,  setPerfilMsgType]  = useState<'ok' | 'err'>('ok')
  const [isSavingPerfil, setIsSavingPerfil] = useState(false)

  // ── Estado cambio contraseña ──────────────────────────────────────────────
  const [claveActual,   setClaveActual]   = useState('')
  const [claveNueva,    setClaveNueva]    = useState('')
  const [claveConfirm,  setClaveConfirm]  = useState('')
  const [claveMsg,      setClaveMsg]      = useState<string | null>(null)
  const [claveMsgType,  setClaveMsgType]  = useState<'ok' | 'err'>('ok')
  const [isSavingClave, setIsSavingClave] = useState(false)

  // ── Estado formulario cita ────────────────────────────────────────────────
  const [citaFecha,      setCitaFecha]      = useState(tomorrowString)
  const [citaHora,       setCitaHora]       = useState('')
  const [disponibilidad, setDisponibilidad] = useState<BookedSlot[]>([])
  const [citaObs,        setCitaObs]        = useState('')
  const [citaErrors,     setCitaErrors]     = useState<Record<string, string>>({})
  const [citaMsg,        setCitaMsg]        = useState<string | null>(null)
  const [citaMsgType,    setCitaMsgType]    = useState<'ok' | 'err'>('ok')
  const [isAgendando,    setIsAgendando]    = useState(false)
  const [showCitaForm,   setShowCitaForm]   = useState(false)

  const [isDeleting,  setIsDeleting]  = useState(false)
  const [cancelingId, setCancelingId] = useState<number | null>(null)

  // ── Estado dropdowns ──────────────────────────────────────────────────────
  const [citasOpen,     setCitasOpen]     = useState(false)
  const [serviciosOpen, setServiciosOpen] = useState(false)

  // Precargar perfil en form
  useEffect(() => {
    if (!perfil) return
    setNombre(perfil.nombre ?? '')
    setTelefono(perfil.telefono ?? '')
    setCorreo(perfil.correo ?? '')
  }, [perfil])

  // Abrir modal de cita si viene desde landing
  useEffect(() => {
    if (searchParams.get('nueva-cita') === 'true') {
      setCitasOpen(true)
      setShowCitaForm(true)
    }
  }, [searchParams])

  // ── Guards — después de todos los hooks ──────────────────────────────────
  const token = getToken()
  const rol   = getRol()
  if (!token || !rol) return <Navigate to="/login" replace />
  if (rol !== 'Cliente') return <Navigate to="/" replace />

  // ── Submit perfil ─────────────────────────────────────────────────────────
  const submitPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setPerfilMsg(null); setIsSavingPerfil(true)
    try {
      await onUpdateProfile({ nombre, telefono: telefono || null, correo })
      setPerfilMsg('Datos actualizados correctamente')
      setPerfilMsgType('ok')
    } catch (e2) {
      setPerfilMsg(e2 instanceof Error ? e2.message : 'Error al actualizar')
      setPerfilMsgType('err')
    } finally { setIsSavingPerfil(false) }
  }

  // ── Submit cambio contraseña ──────────────────────────────────────────────
  const submitClave = async (e: React.FormEvent) => {
    e.preventDefault()
    setClaveMsg(null)
    if (!claveActual.trim()) { setClaveMsg('Ingresa tu contraseña actual'); setClaveMsgType('err'); return }
    if (claveNueva.length < 6) { setClaveMsg('La nueva contraseña debe tener al menos 6 caracteres'); setClaveMsgType('err'); return }
    if (claveNueva !== claveConfirm) { setClaveMsg('Las contraseñas no coinciden'); setClaveMsgType('err'); return }
    setIsSavingClave(true)
    try {
      await onChangePassword({ clave_actual: claveActual, clave: claveNueva })
      setClaveMsg('Contraseña actualizada correctamente')
      setClaveMsgType('ok')
      setClaveActual(''); setClaveNueva(''); setClaveConfirm('')
    } catch (e2) {
      setClaveMsg(e2 instanceof Error ? e2.message : 'Error al cambiar contraseña')
      setClaveMsgType('err')
    } finally { setIsSavingClave(false) }
  }

  // ── Submit nueva cita ─────────────────────────────────────────────────────
  const submitCita = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!citaFecha) errs.fecha = 'Selecciona una fecha'
    if (!citaHora)  errs.hora  = 'Selecciona una hora'
    if (citaFecha < tomorrowString()) errs.fecha = 'Solo puedes agendar desde mañana'
    if (Object.keys(errs).length) { setCitaErrors(errs); return }
    setIsAgendando(true); setCitaMsg(null); setCitaErrors({})
    try {
      await apiRequest('/api/account/citas', {
        method: 'POST',
        body: JSON.stringify({ fecha: citaFecha, hora: citaHora, observacion: citaObs || undefined }),
      })
      setCitaMsg('¡Cita agendada! Te contactaremos para confirmarla.')
      setCitaMsgType('ok')
      setCitaFecha(''); setCitaHora(''); setCitaObs('')
      setShowCitaForm(false)
      window.location.reload()
    } catch (e2) {
      setCitaMsg(e2 instanceof Error ? e2.message : 'Error al agendar la cita')
      setCitaMsgType('err')
    } finally { setIsAgendando(false) }
  }

  // ── Eliminar cuenta ───────────────────────────────────────────────────────
  const deleteAccount = async () => {
    if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return
    setIsDeleting(true)
    try {
      await onDeleteAccount()
    } catch (e2) {
      setIsDeleting(false)
      alert(e2 instanceof Error ? e2.message : 'Error al eliminar la cuenta')
    }
  }

  const handleLogout = () => { clearAuth(); navigate('/', { replace: true }) }

  const primerNombre = perfil?.nombre?.split(' ')[0] ?? ''

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 w-full bg-secondary/95 backdrop-blur-md border-b border-secondary-foreground/10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-secondary-foreground/70 hover:text-secondary-foreground transition-colors text-sm"
          >
            <Home className="h-4 w-4" />
            Inicio
          </Link>
          <span className="font-serif italic font-bold text-secondary-foreground tracking-tight">Arte Café</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-secondary-foreground/70 hover:text-secondary-foreground transition-colors text-sm"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </nav>

      <main className="py-10 md:py-16 px-6">
        <div className="max-w-4xl mx-auto">

          {/* ── Welcome header ───────────────────────────────────────────────── */}
          <header className="mb-8 text-center">
            <div className="mb-3">
              <span className="font-serif italic text-3xl font-bold text-secondary tracking-tight">
                Arte Café
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-12 w-56 mx-auto mb-2" />
            ) : (
              <h1 className="text-4xl md:text-5xl font-serif text-secondary mb-2">
                Hola, {primerNombre || 'bienvenido'} 👋
              </h1>
            )}
            <p className="text-muted-foreground">Gestiona tus citas, datos personales y preferencias.</p>
          </header>

          {error && (
            <div className="mb-6 border border-destructive/30 bg-destructive/10 text-destructive rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          {/* ── Grid 2×2 ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

            {/* ── Mis Citas (dropdown) ───────────────────────────────────────── */}
            <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              {/* Header colapsable */}
              <button
                type="button"
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-accent/40 transition-colors"
                onClick={() => setCitasOpen(v => !v)}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-6 w-6 text-primary shrink-0" />
                  <h2 className="text-xl font-serif text-secondary">Mis citas</h2>
                </div>
                <div className="flex items-center gap-2">
                  {citasOpen && !showCitaForm && (
                    <span
                      role="button"
                      onClick={e => {
                        e.stopPropagation()
                        setShowCitaForm(true)
                      }}
                      className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-all active:scale-95 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nueva cita
                    </span>
                  )}
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 shrink-0 ${citasOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Contenido colapsable */}
              {citasOpen && (
                <div className="px-6 pb-6 border-t border-border bg-background/40 overflow-y-auto max-h-[420px] pt-5">

                  {/* Mensaje post-agendado */}
                  {citaMsg && !showCitaForm && (
                    <div className={`rounded-lg px-4 py-3 text-sm mb-4 border ${citaMsgType === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                      {citaMsg}
                    </div>
                  )}

                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                  ) : citas.length === 0 && !showCitaForm ? (
                    <div className="text-center py-8">
                      <CalendarDays className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">Aún no tienes citas agendadas.</p>
                      <button
                        onClick={() => setShowCitaForm(true)}
                        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 text-sm"
                      >
                        <CalendarPlus className="h-4 w-4" />
                        Agendar mi primera cita
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {citas.map((c) => {
                        const { mes, dia } = parseFechaBloque(c.fecha)
                        const esPendiente  = c.appointmentStatus?.nombre?.toLowerCase().includes('pend') ?? false
                        return (
                          <div
                            key={c.id_cita}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted border border-transparent hover:border-primary/20 transition-all"
                          >
                            <div className="flex gap-4">
                              <div className="bg-secondary/5 rounded-lg p-2.5 flex flex-col items-center justify-center min-w-[52px]">
                                <span className="text-[10px] uppercase font-bold text-secondary/60">{mes}</span>
                                <span className="text-lg font-bold text-secondary">{dia}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-sm">Cita #{c.id_cita}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  {c.hora?.slice(0, 5)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${estadoBadgeClasses(c.appointmentStatus?.nombre)}`}>
                                {c.appointmentStatus?.nombre ?? 'Sin estado'}
                              </span>
                              {esPendiente && (
                                <button
                                  disabled={cancelingId === c.id_cita}
                                  onClick={async () => {
                                    if (!confirm('¿Seguro que deseas cancelar esta cita?')) return
                                    setCancelingId(c.id_cita)
                                    try {
                                      await onCancelAppointment(c.id_cita)
                                    } catch (e2) {
                                      alert(e2 instanceof Error ? e2.message : 'Error al cancelar')
                                    } finally { setCancelingId(null) }
                                  }}
                                  className="text-destructive text-xs font-medium hover:underline disabled:opacity-50 transition-all"
                                >
                                  {cancelingId === c.id_cita ? 'Cancelando...' : 'Cancelar'}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>
              )}
            </section>

            {/* ── Mis Servicios (dropdown) ───────────────────────────────────── */}
            <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              {/* Header colapsable */}
              <button
                type="button"
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-accent/40 transition-colors"
                onClick={() => setServiciosOpen(v => !v)}
              >
                <div className="flex items-center gap-3">
                  <Wrench className="h-6 w-6 text-primary shrink-0" />
                  <h2 className="text-xl font-serif text-secondary">Mis servicios</h2>
                </div>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${serviciosOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Contenido colapsable */}
              {serviciosOpen && (
                <div className="px-6 pb-6 border-t border-border bg-background/40 overflow-y-auto max-h-[420px] pt-5">
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-14 w-full rounded-lg" />
                      <Skeleton className="h-14 w-full rounded-lg" />
                    </div>
                  ) : servicios.length === 0 ? (
                    <div className="text-center py-8">
                      <Wrench className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground">Aún no tienes servicios registrados.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {servicios.map((s) => (
                        <div
                          key={s.id_detalle}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted border border-transparent hover:border-primary/20 transition-all"
                        >
                          <div>
                            <p className="font-semibold text-foreground text-sm">{s.servicio}</p>
                            {s.observacion && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">{s.observacion}</p>
                            )}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${estadoServicioBadgeClasses(s.estado)}`}>
                            {s.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── Mis Datos ──────────────────────────────────────────────────── */}
            <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-serif text-secondary">Mis datos</h2>
              </div>

              {isLoading ? (
                <div className="space-y-5">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <form onSubmit={submitPerfil} className="space-y-5">
                  <div>
                    <label className={labelCls} htmlFor="perfil-nombre">Nombre completo</label>
                    <input id="perfil-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="perfil-telefono">Teléfono</label>
                    <input id="perfil-telefono" type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="perfil-correo">Correo electrónico</label>
                    <input id="perfil-correo" type="email" value={correo} onChange={e => setCorreo(e.target.value)} required className={inputCls} />
                  </div>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={isSavingPerfil}
                      className="bg-secondary text-secondary-foreground py-3 px-6 rounded-lg font-medium hover:bg-secondary/90 transition-colors active:scale-95 disabled:opacity-60"
                    >
                      {isSavingPerfil ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    {perfilMsg && (
                      <span className={`text-sm ${perfilMsgType === 'ok' ? 'text-emerald-700' : 'text-destructive'}`}>
                        {perfilMsg}
                      </span>
                    )}
                  </div>
                </form>
              )}
            </section>

            {/* ── Cambiar contraseña ─────────────────────────────────────────── */}
            <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-serif text-secondary">Cambiar contraseña</h2>
              </div>
              <form onSubmit={submitClave} className="space-y-4">
                <input type="password" placeholder="Contraseña actual" value={claveActual} onChange={e => setClaveActual(e.target.value)} className={inputCls} />
                <input type="password" placeholder="Nueva contraseña" value={claveNueva} onChange={e => setClaveNueva(e.target.value)} className={inputCls} />
                <input type="password" placeholder="Confirmar contraseña" value={claveConfirm} onChange={e => setClaveConfirm(e.target.value)} className={inputCls} />
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingClave}
                    className="w-full border-2 border-primary/30 text-primary py-3 rounded-lg font-medium hover:bg-primary/5 transition-colors disabled:opacity-60"
                  >
                    {isSavingClave ? 'Actualizando...' : 'Actualizar seguridad'}
                  </button>
                </div>
                {claveMsg && (
                  <p className={`text-sm ${claveMsgType === 'ok' ? 'text-emerald-700' : 'text-destructive'}`}>
                    {claveMsg}
                  </p>
                )}
              </form>
            </section>

          </div>

          {/* ── Eliminar cuenta ────────────────────────────────────────────── */}
          <div className="mt-5 flex justify-center">
            <div className="bg-destructive/5 rounded-xl p-6 border border-destructive/10 max-w-md w-full text-center">
              <div className="flex flex-col items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <h3 className="font-serif text-xl text-destructive mb-2">Eliminar cuenta</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Esta acción es permanente y eliminará todo tu historial de citas y trabajos en el taller.
                    Si tienes historial activo, la cuenta se desactivará en su lugar.
                  </p>
                  <button
                    onClick={deleteAccount}
                    disabled={isDeleting}
                    className="text-destructive font-bold text-xs uppercase tracking-widest hover:underline transition-all disabled:opacity-50"
                  >
                    {isDeleting ? 'Procesando...' : 'Eliminar cuenta'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Cerrar sesión ───────────────────────────────────────────────── */}
          <div className="text-center py-6">
            <button
              onClick={handleLogout}
              className="text-primary font-medium inline-flex items-center gap-2 hover:underline transition-all"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>

        </div>
      </main>

      {/* ── Modal nueva cita ───────────────────────────────────────────────── */}
      {showCitaForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => { setShowCitaForm(false); setCitaErrors({}); setCitaMsg(null) }}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4 p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-secondary">Agendar nueva cita</h3>
              <button
                type="button"
                onClick={() => { setShowCitaForm(false); setCitaErrors({}); setCitaMsg(null) }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {citaMsg && (
              <div className={`rounded-lg px-3 py-2 text-sm border ${citaMsgType === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                {citaMsg}
              </div>
            )}

            <form onSubmit={submitCita} className="flex flex-col gap-4">
              <div>
                <label className={labelCls} htmlFor="cita-fecha-mc">Fecha <span className="text-destructive">*</span></label>
                <DatePicker
                  id="cita-fecha-mc"
                  value={citaFecha}
                  min={tomorrowString()}
                  error={citaErrors.fecha}
                  onChange={async (f) => {
                    setCitaFecha(f)
                    setCitaHora('')
                    setCitaErrors(p => ({ ...p, fecha: '', hora: '' }))
                    try {
                      const res = await apiRequest<{ success: boolean; data: { id_cita: number; hora: string }[] }>(
                        `/api/account/availability?fecha=${f}`
                      )
                      setDisponibilidad(
                        (res.data ?? []).map(d => ({ hora: d.hora, id_cita: d.id_cita, clienteNombre: 'Ocupado' }))
                      )
                    } catch { setDisponibilidad([]) }
                  }}
                />
                {citaErrors.fecha && <p className="text-xs text-destructive mt-1">{citaErrors.fecha}</p>}
              </div>

              <TimePicker
                value={citaHora}
                onChange={v => { setCitaHora(v); setCitaErrors(p => ({ ...p, hora: '' })) }}
                error={citaErrors.hora}
                bookedSlots={disponibilidad}
              />

              <div>
                <label className={labelCls} htmlFor="cita-obs">
                  Observaciones{' '}
                  <span className="text-muted-foreground font-normal normal-case tracking-normal">(opcional)</span>
                </label>
                <textarea
                  id="cita-obs"
                  value={citaObs}
                  onChange={e => setCitaObs(e.target.value)}
                  placeholder="Cuéntanos qué necesitas, medidas, tipo de marco, etc."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isAgendando}
                  className="bg-secondary text-secondary-foreground py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <CalendarPlus className="h-4 w-4" />
                  {isAgendando ? 'Agendando...' : 'Confirmar cita'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCitaForm(false); setCitaErrors({}); setCitaMsg(null) }}
                  className="text-muted-foreground text-sm hover:text-foreground transition-colors py-2"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-secondary border-t border-secondary-foreground/10 py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-1 text-center">
          <span className="font-serif text-lg font-bold italic text-secondary-foreground">Arte Café</span>
          <span className="text-xs text-secondary-foreground/50">
            © {new Date().getFullYear()} SoftwArt · Todos los derechos reservados
          </span>
        </div>
      </footer>

    </div>
  )
}
