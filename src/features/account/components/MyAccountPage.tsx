// src/features/account/components/MyAccountPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAccount } from '../hooks/useAccount'
import {
  inputCls, labelCls, parseFechaBloque, tomorrowString,
  estadoBadgeClasses, estadoServicioBadgeClasses,
  filterCitasCuenta, filterServiciosCuenta,
  modalBackdropVariants, modalPanelVariants,
} from '../utils'
import { getAuthToken, getAuthRol } from '@/src/features/auth/utils'
import { formatCurrency } from '@/src/shared/lib/formatCurrency'
import { formatDate }     from '@/src/shared/lib/formatDate'
import { SearchInput }    from '@/src/shared/components/SearchInput'
import { Pagination }     from '@/src/shared/components/Pagination'
import { usePagination }  from '@/src/shared/hooks/usePagination'
import { Skeleton }       from '@/src/shared/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/src/shared/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/src/shared/components/ui/alert-dialog'
import {
  CalendarDays, LogOut, User, Lock, AlertTriangle,
  Plus, Clock, CalendarPlus, Wrench, X, ChevronDown,
  Sparkles, ArrowRight,
} from 'lucide-react'
import { TimePicker } from '@/src/shared/components/TimePicker'
import { DatePicker }  from '@/src/shared/components/DatePicker'

export function MyAccountPage() {
  const [searchParams] = useSearchParams()

  // UI state
  const [showCitaForm,       setShowCitaForm]       = useState(false)
  const [showCitasModal,     setShowCitasModal]     = useState(false)
  const [showServiciosModal, setShowServiciosModal] = useState(false)
  const [showPerfilModal,    setShowPerfilModal]    = useState(false)
  const [cancelingId,        setCancelingId]        = useState<number | null>(null)
  const [qCitas,             setQCitas]             = useState('')
  const [qServicios,         setQServicios]         = useState('')

  const {
    perfil, citas, servicios, isLoading, error,
    primerNombre, proximaCita, serviciosActivos, ultimoServicio,
    perfilNombre, setPerfilNombre, perfilTelefono, setPerfilTelefono,
    perfilCorreo, setPerfilCorreo, perfilMsg, perfilMsgType, isSavingPerfil, submitPerfil,
    claveActual, setClaveActual, claveNueva, setClaveNueva, claveConfirm, setClaveConfirm,
    claveMsg, claveMsgType, isSavingClave, submitClave,
    citaFecha, citaHora, citaObs, setCitaObs,
    citaErrors, citaMsg, citaMsgType, isAgendando, disponibilidad,
    onCitaFechaChange, onCitaHoraChange, submitCita, resetCitaForm,
    onCancelAppointment, isDeleting, onDeleteAccount, handleLogout,
  } = useAccount()

  const filteredCitas     = useMemo(() => filterCitasCuenta([...citas].sort((a, b) => a.fecha.localeCompare(b.fecha)), qCitas), [citas, qCitas])
  const filteredServicios = useMemo(() => filterServiciosCuenta(servicios, qServicios), [servicios, qServicios])

  const citasPag     = usePagination(filteredCitas)
  const serviciosPag = usePagination(filteredServicios)

  const closeCitaForm = () => { setShowCitaForm(false); resetCitaForm() }

  useEffect(() => {
    if (searchParams.get('new-appointment') === 'true') setShowCitaForm(true)
  }, [searchParams])

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!getAuthToken() || !getAuthRol()) return <Navigate to="/login" replace />
  if (getAuthRol() !== 'Cliente')       return <Navigate to="/"      replace />

  const handleSubmitCita = async (e: React.FormEvent) => {
    const ok = await submitCita(e)
    if (ok) closeCitaForm()
  }

  const initial = primerNombre ? primerNombre.charAt(0).toUpperCase() : '?'

  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="font-serif italic font-bold text-secondary">Arte Café</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors outline-none">
              <div className="h-7 w-7 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-secondary">{initial}</span>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-foreground leading-tight truncate max-w-[160px]">{perfil?.nombre ?? ''}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Cliente</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block shrink-0" />
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
      </header>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-5xl mx-auto">

          <h1 className="font-serif text-3xl text-secondary mb-6">
            {isLoading ? <Skeleton className="h-9 w-56" /> : `Hola, ${primerNombre} 👋`}
          </h1>

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">

            {/* Chips de acceso rápido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <m.button
                onClick={() => setShowCitasModal(true)}
                className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Próxima cita</p>
                  {isLoading ? (
                    <Skeleton className="h-5 w-36" />
                  ) : proximaCita ? (
                    <p className="font-semibold text-foreground">
                      {formatDate(proximaCita.fecha)} · {proximaCita.hora?.slice(0, 5)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin citas próximas</p>
                  )}
                </div>
              </m.button>

              <m.button
                onClick={() => setShowServiciosModal(true)}
                className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-5 w-5 text-secondary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Servicios activos</p>
                  {isLoading ? (
                    <Skeleton className="h-5 w-24" />
                  ) : (
                    <p className="font-semibold text-foreground">
                      {serviciosActivos} {serviciosActivos === 1 ? 'servicio' : 'servicios'} en curso
                    </p>
                  )}
                </div>
              </m.button>

            </div>

            {/* Asymmetric grid: left 2/3 · right 1/3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* LEFT col-span-2: services area (historial) */}
              <m.section
                className="md:col-span-2 bg-card border border-border rounded-xl p-5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Último servicio</h2>
                </div>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : ultimoServicio ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{ultimoServicio.servicio}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(ultimoServicio.fecha)} · {formatCurrency(ultimoServicio.precio)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 ${estadoServicioBadgeClasses(ultimoServicio.estado)}`}>
                      {ultimoServicio.estado}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aún no tienes servicios registrados.</p>
                )}
              </m.section>

              {/* RIGHT col: account info */}
              <div className="flex flex-col gap-6">
                <m.section
                  className="bg-card border border-border rounded-xl p-5"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.21, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Mi cuenta</h2>
                  </div>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-52" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><span className="text-foreground font-medium">{perfil?.correo}</span></p>
                      {perfil?.telefono && <p>{perfil.telefono}</p>}
                      <button
                        onClick={() => setShowPerfilModal(true)}
                        className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        Editar datos <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </m.section>
              </div>

            </div>

          </div>
        </div>
      </main>

      <footer className="bg-secondary border-t border-secondary-foreground/10 py-6 shrink-0">
        <div className="max-w-3xl mx-auto px-6 flex flex-col items-center gap-1 text-center">
          <span className="font-serif text-base font-bold italic text-secondary-foreground">Arte Café</span>
          <span className="text-xs text-secondary-foreground/50">
            © {new Date().getFullYear()} SoftwArt · Todos los derechos reservados
          </span>
        </div>
      </footer>

      {/* ── Modales ──────────────────────────────────────────────────────────── */}

      {/* Modal: Mis citas */}
      <AnimatePresence>
        {showCitasModal && (
          <m.div
            key="backdrop-citas"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setShowCitasModal(false)}
            variants={modalBackdropVariants}
            initial="initial" animate="animate" exit="exit"
          >
            <m.div
              className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col gap-4 p-6 relative max-h-[90dvh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
              variants={modalPanelVariants}
              initial="initial" animate="animate" exit="exit"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl text-secondary">Mis citas</h3>
                <button type="button" onClick={() => setShowCitasModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <SearchInput value={qCitas} onChange={setQCitas} placeholder="Buscar por ID, fecha o estado..." className="w-full sm:w-72" />
                  <button
                    onClick={() => { setShowCitasModal(false); setShowCitaForm(true) }}
                    className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-secondary/90 transition-all active:scale-95 shrink-0"
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
                      onClick={() => { setShowCitasModal(false); setShowCitaForm(true) }}
                      className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 hover:bg-secondary/90 transition-all active:scale-95 text-sm"
                    >
                      <CalendarPlus className="h-4 w-4" />
                      Agendar mi primera cita
                    </button>
                  </div>
                ) : filteredCitas.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">Sin resultados para "{qCitas}".</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {citasPag.paginated.map(c => {
                        const { mes, dia } = parseFechaBloque(c.fecha)
                        const esPendiente  = c.appointmentStatus?.nombre?.toLowerCase().includes('pend') ?? false
                        return (
                          <div key={c.id_cita}
                            className="bg-card rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/20 transition-colors">
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
                                    <button disabled={cancelingId === c.id_cita}
                                      className="text-destructive text-xs font-medium hover:underline disabled:opacity-50 transition-all">
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
                                      <AlertDialogAction className="bg-destructive text-destructive-foreground"
                                        onClick={async () => {
                                          setCancelingId(c.id_cita)
                                          try { await onCancelAppointment(c.id_cita) }
                                          catch (e2) { alert(e2 instanceof Error ? e2.message : 'Error al cancelar') }
                                          finally { setCancelingId(null) }
                                        }}>
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
                    <Pagination
                      page={citasPag.page} totalPages={citasPag.totalPages}
                      total={citasPag.total} pageSize={citasPag.pageSize}
                      onChange={citasPag.setPage} onPageSizeChange={citasPag.setPageSize}
                    />
                  </>
                )}
              </div>

              <button type="button" onClick={() => setShowCitasModal(false)}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors py-2 text-center w-full">
                Cerrar
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Modal: Mis servicios */}
      <AnimatePresence>
        {showServiciosModal && (
          <m.div
            key="backdrop-servicios"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setShowServiciosModal(false)}
            variants={modalBackdropVariants}
            initial="initial" animate="animate" exit="exit"
          >
            <m.div
              className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col gap-4 p-6 relative max-h-[90dvh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
              variants={modalPanelVariants}
              initial="initial" animate="animate" exit="exit"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl text-secondary">Mis servicios</h3>
                <button type="button" onClick={() => setShowServiciosModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <SearchInput value={qServicios} onChange={setQServicios} placeholder="Buscar por servicio o estado..." className="w-full sm:w-72" />

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                </div>
              ) : servicios.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                  <Wrench className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aún no tienes servicios registrados.</p>
                </div>
              ) : filteredServicios.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">Sin resultados para "{qServicios}".</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {serviciosPag.paginated.map(s => (
                      <div key={s.id_detalle}
                        className="bg-card rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-start gap-4 hover:border-primary/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{s.servicio}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-xs text-muted-foreground">{formatDate(s.fecha)}</span>
                            <span className="text-xs font-medium text-primary">{formatCurrency(s.precio)}</span>
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
                  <Pagination
                    page={serviciosPag.page} totalPages={serviciosPag.totalPages}
                    total={serviciosPag.total} pageSize={serviciosPag.pageSize}
                    onChange={serviciosPag.setPage} onPageSizeChange={serviciosPag.setPageSize}
                  />
                </>
              )}

              <button type="button" onClick={() => setShowServiciosModal(false)}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors py-2 text-center w-full">
                Cerrar
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Modal: Mi perfil */}
      <AnimatePresence>
        {showPerfilModal && (
          <m.div
            key="backdrop-perfil"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setShowPerfilModal(false)}
            variants={modalBackdropVariants}
            initial="initial" animate="animate" exit="exit"
          >
            <m.div
              className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col gap-6 p-6 relative max-h-[90dvh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
              variants={modalPanelVariants}
              initial="initial" animate="animate" exit="exit"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl text-secondary">Mi perfil</h3>
                <button type="button" onClick={() => setShowPerfilModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mis datos + Cambiar contraseña — 2 columnas en desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                        <button type="submit" disabled={isSavingPerfil}
                          className="bg-secondary text-secondary-foreground py-2.5 px-6 rounded-lg font-medium hover:bg-secondary/90 transition-colors active:scale-95 disabled:opacity-60">
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

                <section className="bg-card rounded-xl p-6 border border-border shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Lock className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-serif text-secondary">Cambiar contraseña</h2>
                  </div>
                  <form onSubmit={submitClave} className="space-y-5">
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
                      <button type="submit" disabled={isSavingClave}
                        className="w-full border-2 border-primary/30 text-primary py-2.5 rounded-lg font-medium hover:bg-primary/5 transition-colors disabled:opacity-60">
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

              </div>

              {/* Eliminar cuenta — ancho completo */}
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
                      <button disabled={isDeleting}
                        className="text-destructive border border-destructive/30 hover:bg-destructive hover:text-destructive-foreground px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 shrink-0">
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
                        <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={onDeleteAccount}>
                          Sí, eliminar cuenta
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </section>

              <button type="button" onClick={() => setShowPerfilModal(false)}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors py-2 text-center w-full">
                Cancelar
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Modal: Nueva cita */}
      <AnimatePresence>
        {showCitaForm && (
          <m.div
            key="backdrop-nueva-cita"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={closeCitaForm}
            variants={modalBackdropVariants}
            initial="initial" animate="animate" exit="exit"
          >
            <m.div
              className="bg-card rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-4 p-6 relative"
              onClick={e => e.stopPropagation()}
              variants={modalPanelVariants}
              initial="initial" animate="animate" exit="exit"
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
                  <DatePicker id="cita-fecha-mc" value={citaFecha} min={tomorrowString()} error={citaErrors.fecha} onChange={onCitaFechaChange} />
                  {citaErrors.fecha && <p className="text-xs text-destructive mt-1">{citaErrors.fecha}</p>}
                </div>

                <TimePicker value={citaHora} onChange={onCitaHoraChange} error={citaErrors.hora} bookedSlots={disponibilidad} />

                <div>
                  <label className={labelCls} htmlFor="cita-obs">
                    Observaciones{' '}
                    <span className="text-muted-foreground font-normal normal-case tracking-normal">(opcional)</span>
                  </label>
                  <textarea id="cita-obs" value={citaObs} onChange={e => setCitaObs(e.target.value)}
                    placeholder="Cuéntanos qué necesitas, medidas, tipo de marco, etc."
                    rows={3} className={`${inputCls} resize-none`} />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button type="submit" disabled={isAgendando}
                    className="bg-secondary text-secondary-foreground py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60">
                    <CalendarPlus className="h-4 w-4" />
                    {isAgendando ? 'Agendando...' : 'Confirmar cita'}
                  </button>
                  <button type="button" onClick={closeCitaForm}
                    className="text-muted-foreground text-sm hover:text-foreground transition-colors py-2">
                    Cancelar
                  </button>
                </div>
              </form>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

    </div>
    </LazyMotion>
  )
}
