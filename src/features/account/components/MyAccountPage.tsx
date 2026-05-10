// src/features/account/components/MyAccountPage.tsx
import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAccount } from '../hooks/useAccount'
import { parseFechaBloque, tomorrowString, estadoBadgeClasses, estadoServicioBadgeClasses } from '../utils'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import {
  CalendarDays, LogOut, User, Lock, AlertTriangle,
  Plus, Clock, Home, CalendarPlus, Wrench, X,
} from 'lucide-react'
import { TimePicker } from '@/src/shared/components/TimePicker'
import { DatePicker }  from '@/src/shared/components/DatePicker'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/src/shared/components/ui/alert-dialog'

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'perfil' | 'citas' | 'servicios'
type NavItem = { id: Tab; label: string; Icon: React.ElementType }

// ── Helpers ───────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('token') ?? sessionStorage.getItem('token') }
function getRol()   { return localStorage.getItem('rol')   ?? sessionStorage.getItem('rol') }

const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all'
const labelCls = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'
const fmtCOP   = (v: number) => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const NAV_ITEMS: NavItem[] = [
  { id: 'perfil',    label: 'Mi perfil',     Icon: User },
  { id: 'citas',     label: 'Mis citas',     Icon: CalendarDays },
  { id: 'servicios', label: 'Mis servicios', Icon: Wrench },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export function MyAccountPage() {
  const [searchParams] = useSearchParams()
  const [tab,          setTab]          = useState<Tab>('perfil')
  const [showCitaForm, setShowCitaForm] = useState(false)
  const [cancelingId,  setCancelingId]  = useState<number | null>(null)

  const {
    perfil, citas, servicios, isLoading, error, primerNombre,
    perfilNombre, setPerfilNombre, perfilTelefono, setPerfilTelefono,
    perfilCorreo, setPerfilCorreo, perfilMsg, perfilMsgType, isSavingPerfil, submitPerfil,
    claveActual, setClaveActual, claveNueva, setClaveNueva, claveConfirm, setClaveConfirm,
    claveMsg, claveMsgType, isSavingClave, submitClave,
    citaFecha, citaHora, citaObs, setCitaObs,
    citaErrors, citaMsg, citaMsgType, isAgendando, disponibilidad,
    onCitaFechaChange, onCitaHoraChange, submitCita, resetCitaForm,
    onCancelAppointment, isDeleting, onDeleteAccount, handleLogout,
  } = useAccount()

  const closeCitaForm = () => { setShowCitaForm(false); resetCitaForm() }

  useEffect(() => {
    if (searchParams.get('new-appointment') === 'true') {
      setTab('citas')
      setShowCitaForm(true)
    }
  }, [searchParams])

  // ── Guards ────────────────────────────────────────────────────────────────
  const token = getToken()
  const rol   = getRol()
  if (!token || !rol) return <Navigate to="/login" replace />
  if (rol !== 'Cliente') return <Navigate to="/" replace />

  const handleSubmitCita = async (e: React.FormEvent) => {
    const ok = await submitCita(e)
    if (ok) closeCitaForm()
  }

  const initial = primerNombre ? primerNombre.charAt(0).toUpperCase() : '?'

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Sidebar (desktop) ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 border-r border-border bg-card z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <span className="font-serif italic text-xl text-secondary">Arte Café</span>
        </div>

        {/* User info */}
        <div className="px-5 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-secondary">{initial}</span>
            </div>
            <div className="min-w-0">
              {isLoading
                ? <Skeleton className="h-4 w-28" />
                : <p className="text-sm font-semibold text-foreground truncate">{perfil?.nombre ?? ''}</p>
              }
              <p className="text-xs text-muted-foreground mt-0.5">Cliente</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={[
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                tab === id
                  ? 'bg-secondary/10 text-secondary font-semibold'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              ].join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <Home className="h-4 w-4" />
            <span>Inicio</span>
          </Link>
          <span className="font-serif italic font-bold text-secondary md:hidden">Arte Café</span>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-secondary">{initial}</span>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="md:hidden p-1.5 text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-3xl mx-auto">

            <h1 className="font-serif text-3xl text-secondary mb-6">
              {NAV_ITEMS.find(n => n.id === tab)?.label}
            </h1>

            {/* Mobile tab bar */}
            <div className="flex md:hidden gap-1 p-1 bg-muted rounded-lg mb-6">
              {NAV_ITEMS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={[
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors',
                    tab === id ? 'bg-card text-secondary shadow-sm' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">{label}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-4 text-sm">
                {error}
              </div>
            )}

            {/* ── Tab: Mi perfil ────────────────────────────────────────────── */}
            {tab === 'perfil' && (
              <div className="space-y-6">

                {/* Mis datos */}
                <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="h-5 w-5 text-primary" />
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
                        <input id="perfil-nombre" type="text" value={perfilNombre}
                          onChange={e => setPerfilNombre(e.target.value)} required className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls} htmlFor="perfil-telefono">Teléfono</label>
                        <input id="perfil-telefono" type="tel" value={perfilTelefono}
                          onChange={e => setPerfilTelefono(e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls} htmlFor="perfil-correo">Correo electrónico</label>
                        <input id="perfil-correo" type="email" value={perfilCorreo}
                          onChange={e => setPerfilCorreo(e.target.value)} required className={inputCls} />
                      </div>
                      <div className="pt-1 flex items-center gap-4">
                        <button
                          type="submit"
                          disabled={isSavingPerfil}
                          className="bg-secondary text-secondary-foreground py-2.5 px-6 rounded-lg font-medium hover:bg-secondary/90 transition-colors active:scale-95 disabled:opacity-60"
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

                {/* Cambiar contraseña */}
                <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Lock className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-serif text-secondary">Cambiar contraseña</h2>
                  </div>
                  <form onSubmit={submitClave} className="space-y-5 max-w-sm">
                    <div>
                      <label className={labelCls} htmlFor="clave-actual">Contraseña actual</label>
                      <input id="clave-actual" type="password" value={claveActual}
                        onChange={e => setClaveActual(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="clave-nueva">Nueva contraseña</label>
                      <input id="clave-nueva" type="password" value={claveNueva}
                        onChange={e => setClaveNueva(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls} htmlFor="clave-confirm">Confirmar contraseña</label>
                      <input id="clave-confirm" type="password" value={claveConfirm}
                        onChange={e => setClaveConfirm(e.target.value)} className={inputCls} />
                    </div>
                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isSavingClave}
                        className="w-full border-2 border-primary/30 text-primary py-2.5 rounded-lg font-medium hover:bg-primary/5 transition-colors disabled:opacity-60"
                      >
                        {isSavingClave ? 'Actualizando...' : 'Actualizar contraseña'}
                      </button>
                    </div>
                    {claveMsg && (
                      <p className={`text-sm ${claveMsgType === 'ok' ? 'text-emerald-700' : 'text-destructive'}`}>
                        {claveMsg}
                      </p>
                    )}
                  </form>
                </section>

                {/* Eliminar cuenta */}
                <section className="border border-destructive/20 rounded-xl p-6 bg-destructive/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <h3 className="font-serif text-lg text-destructive">Eliminar cuenta</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Esta acción es permanente. Si tienes historial activo, la cuenta se desactivará en su lugar.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          disabled={isDeleting}
                          className="text-destructive border border-destructive/30 hover:bg-destructive hover:text-destructive-foreground px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 shrink-0"
                        >
                          {isDeleting ? 'Procesando...' : 'Eliminar cuenta'}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card text-card-foreground border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-serif text-secondary">¿Eliminar tu cuenta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción es permanente y eliminará toda tu información. Si tienes historial activo, la cuenta se desactivará en su lugar.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground"
                            onClick={onDeleteAccount}
                          >
                            Sí, eliminar cuenta
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </section>

              </div>
            )}

            {/* ── Tab: Mis citas ────────────────────────────────────────────── */}
            {tab === 'citas' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {!isLoading && `${citas.length} cita${citas.length !== 1 ? 's' : ''} en total`}
                  </p>
                  <button
                    onClick={() => setShowCitaForm(true)}
                    className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-secondary/90 transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva cita
                  </button>
                </div>

                {citaMsg && (
                  <div className={`rounded-lg px-4 py-3 text-sm border ${citaMsgType === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                    {citaMsg}
                  </div>
                )}

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                  </div>
                ) : citas.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-5">Aún no tienes citas agendadas.</p>
                    <button
                      onClick={() => setShowCitaForm(true)}
                      className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 hover:bg-secondary/90 transition-all active:scale-95 text-sm"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Agendar mi primera cita
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...citas].sort((a, b) => a.fecha.localeCompare(b.fecha)).map(c => {
                      const { mes, dia } = parseFechaBloque(c.fecha)
                      const esPendiente  = c.appointmentStatus?.nombre?.toLowerCase().includes('pend') ?? false
                      return (
                        <div
                          key={c.id_cita}
                          className="bg-card rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/20 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="bg-secondary/5 border border-secondary/10 rounded-lg p-3 flex flex-col items-center min-w-[56px] shrink-0">
                              <span className="text-[10px] uppercase font-bold text-secondary/60 tracking-wider">{mes}</span>
                              <span className="text-2xl font-bold text-secondary leading-none">{dia}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">Cita #{c.id_cita}</p>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                {c.hora?.slice(0, 5)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${estadoBadgeClasses(c.appointmentStatus?.nombre)}`}>
                              {c.appointmentStatus?.nombre ?? 'Sin estado'}
                            </span>
                            {esPendiente && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    disabled={cancelingId === c.id_cita}
                                    className="text-destructive text-xs font-medium hover:underline disabled:opacity-50 transition-all"
                                  >
                                    {cancelingId === c.id_cita ? 'Cancelando...' : 'Cancelar'}
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card text-card-foreground border-border">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-serif text-secondary">¿Cancelar esta cita?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      La cita del {parseFechaBloque(c.fecha).dia} de {parseFechaBloque(c.fecha).mes} a las {c.hora?.slice(0, 5)} será cancelada. Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-border text-foreground">Volver</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground"
                                      onClick={async () => {
                                        setCancelingId(c.id_cita)
                                        try { await onCancelAppointment(c.id_cita) }
                                        catch (e2) { alert(e2 instanceof Error ? e2.message : 'Error al cancelar') }
                                        finally { setCancelingId(null) }
                                      }}
                                    >
                                      Sí, cancelar cita
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Mis servicios ────────────────────────────────────────── */}
            {tab === 'servicios' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {!isLoading && `${servicios.length} servicio${servicios.length !== 1 ? 's' : ''} en total`}
                </p>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                  </div>
                ) : servicios.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Aún no tienes servicios registrados.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {servicios.map(s => (
                      <div
                        key={s.id_detalle}
                        className="bg-card rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-start gap-4 hover:border-primary/20 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{s.servicio}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-xs text-muted-foreground">{s.fecha}</span>
                            <span className="text-xs font-medium text-primary">{fmtCOP(s.precio)}</span>
                          </div>
                          {s.observacion && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{s.observacion}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 ${estadoServicioBadgeClasses(s.estado)}`}>
                          {s.estado}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </main>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="bg-secondary border-t border-secondary-foreground/10 py-6 shrink-0">
          <div className="max-w-3xl mx-auto px-6 flex flex-col items-center gap-1 text-center">
            <span className="font-serif text-base font-bold italic text-secondary-foreground">Arte Café</span>
            <span className="text-xs text-secondary-foreground/50">
              © {new Date().getFullYear()} SoftwArt · Todos los derechos reservados
            </span>
          </div>
        </footer>
      </div>

      {/* ── Modal nueva cita ─────────────────────────────────────────────── */}
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

    </div>
  )
}
