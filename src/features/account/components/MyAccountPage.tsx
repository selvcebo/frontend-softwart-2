// src/features/account/components/MyAccountPage.tsx
import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAccount } from '../hooks/useAccount'
import { parseFechaBloque, tomorrowString, estadoBadgeClasses, estadoServicioBadgeClasses } from '../utils'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { CalendarDays, LogOut, User, Lock, AlertTriangle, Plus, Clock, Home, CalendarPlus, Wrench, ChevronDown, X } from 'lucide-react'
import { TimePicker } from '@/src/shared/components/TimePicker'
import { DatePicker } from '@/src/shared/components/DatePicker'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/src/shared/components/ui/dropdown-menu'

// ── Helpers storage ───────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('token') ?? sessionStorage.getItem('token') }
function getRol()   { return localStorage.getItem('rol')   ?? sessionStorage.getItem('rol') }

// ── Clases reutilizables ──────────────────────────────────────────────────────
const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all'
const labelCls = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'

// ── Page ──────────────────────────────────────────────────────────────────────
export function MyAccountPage() {
  const [searchParams] = useSearchParams()

  const {
    // servidor
    perfil, citas, servicios, isLoading, error,
    // derivado
    primerNombre,
    // form perfil
    perfilNombre,   setPerfilNombre,
    perfilTelefono, setPerfilTelefono,
    perfilCorreo,   setPerfilCorreo,
    perfilMsg, perfilMsgType, isSavingPerfil, submitPerfil,
    // form clave
    claveActual,  setClaveActual,
    claveNueva,   setClaveNueva,
    claveConfirm, setClaveConfirm,
    claveMsg, claveMsgType, isSavingClave, submitClave,
    // form cita
    citaFecha, citaHora, citaObs, setCitaObs,
    citaErrors, citaMsg, citaMsgType,
    isAgendando, disponibilidad,
    onCitaFechaChange, onCitaHoraChange,
    submitCita, resetCitaForm,
    // acciones
    onCancelAppointment,
    isDeleting, onDeleteAccount,
    handleLogout,
  } = useAccount()

  // ── UI state ──────────────────────────────────────────────────────────────
  const [citasOpen,     setCitasOpen]     = useState(false)
  const [serviciosOpen, setServiciosOpen] = useState(false)
  const [showCitaForm,  setShowCitaForm]  = useState(false)
  const [cancelingId,   setCancelingId]   = useState<number | null>(null)

  const closeCitaForm = () => { setShowCitaForm(false); resetCitaForm() }

  // Abrir modal si viene desde landing (?nueva-cita=true)
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSubmitCita = async (e: React.FormEvent) => {
    const ok = await submitCita(e)
    if (ok) setShowCitaForm(false)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return
    try {
      await onDeleteAccount()
    } catch (e2) {
      alert(e2 instanceof Error ? e2.message : 'Error al eliminar la cuenta')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-secondary/95 backdrop-blur-md border-b border-secondary-foreground/10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-secondary-foreground/70 hover:text-secondary-foreground transition-colors text-sm"
          >
            <Home className="h-4 w-4" />
            Inicio
          </Link>
          <span className="font-serif italic font-bold text-secondary-foreground tracking-tight">Arte Café</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary-foreground/10 transition-colors outline-none">
                <div className="h-7 w-7 rounded-full bg-secondary-foreground/15 border border-secondary-foreground/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-secondary-foreground">
                    {primerNombre ? primerNombre.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <span className="text-sm font-medium text-secondary-foreground hidden sm:block truncate max-w-[120px]">
                  {primerNombre || 'Mi cuenta'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-secondary-foreground/70 hidden sm:block shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium text-foreground truncate">{perfil?.nombre ?? ''}</p>
                <p className="text-[10px] text-muted-foreground">Cliente</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-rose-500 focus:text-rose-500 focus:bg-rose-500/10 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2 shrink-0" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="py-10 md:py-16 px-6">
        <div className="max-w-4xl mx-auto">

          {/* ── Welcome header + chips ───────────────────────────────────────── */}
          <header className="mb-8 text-center">
            {isLoading ? (
              <Skeleton className="h-8 w-48 mx-auto mb-4" />
            ) : (
              <h2 className="text-2xl font-serif text-secondary mb-4">
                Bienvenido, {primerNombre || 'bienvenido'}
              </h2>
            )}
            {!isLoading && (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {(() => {
                  const proxima = citas
                    .filter(c => c.appointmentStatus?.nombre?.toLowerCase().includes('pend'))
                    .sort((a, b) => a.fecha.localeCompare(b.fecha))[0]
                  const { mes, dia } = proxima ? parseFechaBloque(proxima.fecha) : { mes: '', dia: '' }
                  return (
                    <span
                      className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-1.5 text-sm shadow-sm cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => setCitasOpen(true)}
                    >
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="font-medium text-foreground">
                        {proxima ? `Próxima cita: ${dia} ${mes} · ${proxima.hora?.slice(0, 5)}` : 'Sin citas próximas'}
                      </span>
                    </span>
                  )
                })()}
                <span
                  className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-1.5 text-sm shadow-sm cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => setServiciosOpen(true)}
                >
                  <Wrench className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {servicios.filter(s => !s.estado.toLowerCase().includes('finaliz')).length}
                  </span>
                  <span className="text-muted-foreground">servicios activos</span>
                </span>
              </div>
            )}
          </header>

          {error && (
            <div className="mb-6 border border-destructive/30 bg-destructive/10 text-destructive rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          {/* ── Grid fila 1: dropdowns ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

            {/* ── Mis Citas ─────────────────────────────────────────────────── */}
            <section className="bg-card rounded-xl shadow-sm border border-border border-l-4 border-l-primary overflow-hidden">
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
                      onClick={e => { e.stopPropagation(); setShowCitaForm(true) }}
                      className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-all active:scale-95 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nueva cita
                    </span>
                  )}
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 shrink-0 ${citasOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {citasOpen && (
                <div className="px-6 pb-6 border-t border-border bg-background/40 overflow-y-auto max-h-[420px] pt-5">
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
                      {[...citas].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((c) => {
                        const { mes, dia } = parseFechaBloque(c.fecha)
                        const esPendiente  = c.appointmentStatus?.nombre?.toLowerCase().includes('pend') ?? false
                        return (
                          <div
                            key={c.id_cita}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-muted border border-transparent hover:border-primary/20 transition-all"
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
                            <div className="flex items-center gap-3 self-end sm:self-auto">
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

            {/* ── Mis Servicios ─────────────────────────────────────────────── */}
            <section className="bg-card rounded-xl shadow-sm border border-border border-l-4 border-l-primary overflow-hidden">
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

          </div>

          {/* ── Grid fila 2: forms (stretch para igualar alto) ─────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">

            {/* ── Mis Datos ──────────────────────────────────────────────────── */}
            <section className="bg-card rounded-xl p-6 shadow-sm border border-border border-l-4 border-l-primary">
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
                    <input id="perfil-nombre" type="text" value={perfilNombre} onChange={e => setPerfilNombre(e.target.value)} required className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="perfil-telefono">Teléfono</label>
                    <input id="perfil-telefono" type="tel" value={perfilTelefono} onChange={e => setPerfilTelefono(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="perfil-correo">Correo electrónico</label>
                    <input id="perfil-correo" type="email" value={perfilCorreo} onChange={e => setPerfilCorreo(e.target.value)} required className={inputCls} />
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
            <section className="bg-card rounded-xl p-6 shadow-sm border border-border border-l-4 border-l-primary">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-serif text-secondary">Cambiar contraseña</h2>
              </div>
              <form onSubmit={submitClave} className="space-y-5">
                <div>
                  <label className={labelCls} htmlFor="clave-actual">Contraseña actual</label>
                  <input id="clave-actual" type="password" value={claveActual} onChange={e => setClaveActual(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="clave-nueva">Nueva contraseña</label>
                  <input id="clave-nueva" type="password" value={claveNueva} onChange={e => setClaveNueva(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="clave-confirm">Confirmar contraseña</label>
                  <input id="clave-confirm" type="password" value={claveConfirm} onChange={e => setClaveConfirm(e.target.value)} className={inputCls} />
                </div>
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
                    Esta acción es permanente y eliminará toda tu información de usuario en el sistema.
                    Si tienes historial activo, la cuenta se desactivará en su lugar.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="text-destructive font-bold text-xs uppercase tracking-widest hover:underline transition-all disabled:opacity-50"
                  >
                    {isDeleting ? 'Procesando...' : 'Eliminar cuenta'}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Modal nueva cita ───────────────────────────────────────────────── */}
      {showCitaForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeCitaForm}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4 p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-secondary">Agendar nueva cita</h3>
              <button type="button" onClick={closeCitaForm} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {citaMsg && (
              <div className={`rounded-lg px-3 py-2 text-sm border ${citaMsgType === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                {citaMsg}
              </div>
            )}

            <form onSubmit={handleSubmitCita} className="flex flex-col gap-4">
              <div>
                <label className={labelCls} htmlFor="cita-fecha-mc">Fecha <span className="text-destructive">*</span></label>
                <DatePicker
                  id="cita-fecha-mc"
                  value={citaFecha}
                  min={tomorrowString()}
                  error={citaErrors.fecha}
                  onChange={onCitaFechaChange}
                />
                {citaErrors.fecha && <p className="text-xs text-destructive mt-1">{citaErrors.fecha}</p>}
              </div>

              <TimePicker
                value={citaHora}
                onChange={onCitaHoraChange}
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
                  onClick={closeCitaForm}
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
