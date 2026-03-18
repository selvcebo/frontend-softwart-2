// src/features/cuenta/components/MiCuentaPage.tsx
import { useEffect, useState, useRef, useMemo } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useCuenta } from '../hooks/useCuenta'
import { clearAuth } from '@/src/features/auth/hooks/useLogin'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { Button }   from '@/src/shared/components/ui/button'
import { Input }    from '@/src/shared/components/ui/input'
import { Label }    from '@/src/shared/components/ui/label'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Badge }    from '@/src/shared/components/ui/badge'
import { Textarea } from '@/src/shared/components/ui/textarea'
import { CalendarPlus, LogOut, User, CalendarClock, ShieldAlert } from 'lucide-react'
import { TimePicker, BookedSlot } from '@/src/shared/components/TimePicker'

// ── Helpers storage ───────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('token') ?? sessionStorage.getItem('token') }
function getRol()   { return localStorage.getItem('rol')   ?? sessionStorage.getItem('rol') }
function getIdCliente() {
  return Number(localStorage.getItem('id_cliente') ?? sessionStorage.getItem('id_cliente') ?? 0)
}

// ── Fecha mínima = hoy ────────────────────────────────────────────────────────
function todayString() {
  return new Date().toISOString().slice(0, 10)
}

// ── Color badge estado cita ───────────────────────────────────────────────────
function estadoBadge(nombre?: string) {
  if (!nombre) return 'border-border bg-muted text-muted-foreground'
  const s = nombre.toLowerCase()
  if (s.includes('pend') || s.includes('program'))
    return 'border-amber-300 bg-amber-100 text-amber-800'
  if (s.includes('conf') || s.includes('apro') || s.includes('val') || s.includes('complet'))
    return 'border-emerald-300 bg-emerald-100 text-emerald-800'
  if (s.includes('cancel'))
    return 'border-rose-300 bg-rose-100 text-rose-800'
  return 'border-border bg-muted text-muted-foreground'
}

// ── Sección con título ────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-card-foreground">{title}</h2>
      </div>
      {children}
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function MiCuentaPage() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const citaFormRef   = useRef<HTMLDivElement>(null)

  // Hook siempre primero
  const { perfil, citas, isLoading, error, onActualizarPerfil, onCambiarClave, onCancelarCita, onEliminarCuenta } = useCuenta()

  // Guards después del hook
  const token = getToken()
  const rol   = getRol()
  if (!token || !rol) return <Navigate to="/login" replace />
  if (rol !== 'Cliente') return <Navigate to="/" replace />

  // ── Estado formulario perfil ──────────────────────────────────────────────
  const [nombre,        setNombre]        = useState('')
  const [telefono,      setTelefono]      = useState('')
  const [correo,        setCorreo]        = useState('')
  const [perfilMsg,     setPerfilMsg]     = useState<string | null>(null)
  const [perfilMsgType, setPerfilMsgType] = useState<'ok' | 'err'>('ok')
  const [isSavingPerfil, setIsSavingPerfil] = useState(false)

  // ── Estado cambio contraseña ──────────────────────────────────────────────
  const [claveActual,   setClaveActual]   = useState('')
  const [claveNueva,    setClaveNueva]    = useState('')
  const [claveConfirm,  setClaveConfirm]  = useState('')
  const [claveMsg,      setClaveMsg]      = useState<string | null>(null)
  const [claveMsgType,  setClaveMsgType]  = useState<'ok' | 'err'>('ok')
  const [isSavingClave, setIsSavingClave] = useState(false)

  // ── Estado formulario cita ────────────────────────────────────────────────
  const [citaFecha,     setCitaFecha]     = useState('')
  const [citaHora,      setCitaHora]      = useState('')
  const [disponibilidad, setDisponibilidad] = useState<BookedSlot[]>([])
  const [citaObs,       setCitaObs]       = useState('')
  const [citaErrors,    setCitaErrors]    = useState<Record<string, string>>({})
  const [citaMsg,       setCitaMsg]       = useState<string | null>(null)
  const [citaMsgType,   setCitaMsgType]   = useState<'ok' | 'err'>('ok')
  const [isAgendando,   setIsAgendando]   = useState(false)
  const [showCitaForm,  setShowCitaForm]  = useState(false)

  const [isDeleting,   setIsDeleting]   = useState(false)
  const [cancelingId,  setCancelingId]  = useState<number | null>(null)

  // Precargar perfil en form
  useEffect(() => {
    if (!perfil) return
    setNombre(perfil.nombre ?? '')
    setTelefono(perfil.telefono ?? '')
    setCorreo(perfil.correo ?? '')
  }, [perfil])

  // Abrir form de cita si viene desde landing
  useEffect(() => {
    if (searchParams.get('nueva-cita') === 'true') {
      setShowCitaForm(true)
      setTimeout(() => citaFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    }
  }, [searchParams])

  // ── Submit perfil (datos personales) ─────────────────────────────────────
  const submitPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setPerfilMsg(null); setIsSavingPerfil(true)
    try {
      await onActualizarPerfil({ nombre, telefono: telefono || null, correo })
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
      await onCambiarClave({ clave_actual: claveActual, clave: claveNueva })
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
    if (!citaFecha)          errs.fecha = 'Selecciona una fecha'
    if (!citaHora)           errs.hora  = 'Selecciona una hora'
    if (citaFecha < todayString()) errs.fecha = 'No puedes agendar en fechas pasadas'
    if (Object.keys(errs).length) { setCitaErrors(errs); return }

    setIsAgendando(true); setCitaMsg(null); setCitaErrors({})
    try {
      // Primer estado de cita (Pendiente) — el backend asigna id_cliente desde el token
      await apiRequest('/api/cuenta/citas', {
        method: 'POST',
        body: JSON.stringify({
          fecha:       citaFecha,
          hora:        citaHora,
          observacion: citaObs || undefined,
          // id_cliente y id_estado_cita los asigna el backend desde el JWT
        }),
      })
      setCitaMsg('¡Cita agendada! Te contactaremos para confirmarla.')
      setCitaMsgType('ok')
      setCitaFecha(''); setCitaHora(''); setCitaObs('')
      setShowCitaForm(false)
      // Recargar citas
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
      await onEliminarCuenta()
    } catch (e2) {
      setIsDeleting(false)
      alert(e2 instanceof Error ? e2.message : 'Error al eliminar la cuenta')
    }
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mi cuenta</h1>
            <p className="text-muted-foreground">
              {perfil?.nombre ? `Hola, ${perfil.nombre.split(' ')[0]} 👋` : 'Bienvenido'}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />Cerrar sesión
          </Button>
        </div>

        {error && (
          <div className="border border-destructive/40 bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {/* ── Mis citas ─────────────────────────────────────────────────────── */}
        <Section icon={CalendarClock} title="Mis citas">
          {/* Mensaje de cita agendada exitosamente */}
          {citaMsg && !showCitaForm && (
            <div className={`rounded-lg border px-4 py-3 text-sm ${citaMsgType === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
              {citaMsg}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : citas.length === 0 && !showCitaForm ? (
            <div className="text-center py-6">
              <CalendarPlus className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Aún no tienes citas agendadas.</p>
              <Button onClick={() => setShowCitaForm(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <CalendarPlus className="h-4 w-4" />Agendar mi primera cita
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {citas.map((c) => {
                const esPendiente = c.estadoCita?.nombre?.toLowerCase().includes('pend') ?? false
                return (
                  <div key={c.id_cita} className="flex items-center justify-between gap-3 border border-border rounded-lg p-3">
                    <div className="text-sm">
                      <div className="text-foreground font-medium">
                        {c.fecha} · {c.hora?.slice(0, 5)}
                      </div>
                      <div className="text-muted-foreground text-xs">Cita #{c.id_cita}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={estadoBadge(c.estadoCita?.nombre)}>
                        {c.estadoCita?.nombre ?? 'Sin estado'}
                      </Badge>
                      {esPendiente && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={cancelingId === c.id_cita}
                          onClick={async () => {
                            if (!confirm('¿Seguro que deseas cancelar esta cita?')) return
                            setCancelingId(c.id_cita)
                            try {
                              await onCancelarCita(c.id_cita)
                            } catch (e2) {
                              alert(e2 instanceof Error ? e2.message : 'Error al cancelar')
                            } finally {
                              setCancelingId(null)
                            }
                          }}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-7 px-2 text-xs"
                        >
                          {cancelingId === c.id_cita ? 'Cancelando...' : 'Cancelar'}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Botón agendar nueva (si ya tiene citas) */}
          {citas.length > 0 && !showCitaForm && (
            <Button
              variant="outline"
              onClick={() => { setShowCitaForm(true); setTimeout(() => citaFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) }}
              className="gap-2 self-start"
            >
              <CalendarPlus className="h-4 w-4" />Nueva cita
            </Button>
          )}

          {/* ── Formulario nueva cita ──────────────────────────────────────── */}
          {showCitaForm && (
            <div ref={citaFormRef} className="border border-primary/20 bg-primary/5 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Agendar nueva cita</h3>
                <button onClick={() => { setShowCitaForm(false); setCitaErrors({}); setCitaMsg(null) }}
                  className="text-muted-foreground hover:text-foreground text-sm">Cancelar</button>
              </div>

              {citaMsg && (
                <div className={`rounded-lg border px-3 py-2 text-sm ${citaMsgType === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
                  {citaMsg}
                </div>
              )}

              <form onSubmit={submitCita} className="flex flex-col gap-4">
                <div className="flex flex-col gap-4">
                  {/* Fecha */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Fecha <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      min={todayString()}
                      value={citaFecha}
                      onChange={async e => {
                      const f = e.target.value
                      setCitaFecha(f)
                      setCitaHora('')
                      setCitaErrors(p => ({...p, fecha: '', hora: ''}))
                      if (f) {
                        try {
                          const res = await apiRequest<{ success: boolean; data: { id_cita: number; hora: string }[] }>(
                            `/api/cuenta/disponibilidad?fecha=${f}`
                          )
                          setDisponibilidad(
                            (res.data ?? []).map(d => ({
                              hora:          d.hora,
                              id_cita:       d.id_cita,
                              clienteNombre: 'Ocupado',
                            }))
                          )
                        } catch { setDisponibilidad([]) }
                      } else {
                        setDisponibilidad([])
                      }
                    }}
                      className="bg-card text-foreground border-border"
                    />
                    {citaErrors.fecha && <p className="text-xs text-destructive">{citaErrors.fecha}</p>}
                  </div>

                  {/* Hora */}
                  <div className="sm:col-span-2">
                    <TimePicker
                      value={citaHora}
                      onChange={v => { setCitaHora(v); setCitaErrors(p => ({...p, hora: ''})) }}
                      error={citaErrors.hora}
                      bookedSlots={disponibilidad}
                    />
                  </div>
                </div>

                {/* Observaciones */}
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Observaciones <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                  <Textarea
                    value={citaObs}
                    onChange={e => setCitaObs(e.target.value)}
                    placeholder="Cuéntanos qué necesitas, medidas, tipo de marco, etc."
                    className="bg-card text-foreground border-border min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={isAgendando}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                    <CalendarPlus className="h-4 w-4" />
                    {isAgendando ? 'Agendando...' : 'Confirmar cita'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Section>

        {/* ── Mis datos ─────────────────────────────────────────────────────── */}
        <Section icon={User} title="Mis datos">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={submitPerfil} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre">Nombre completo <span className="text-red-500">*</span></Label>
                <Input id="nombre" value={nombre} onChange={e => setNombre(e.target.value)}
                  className="bg-card text-foreground border-border" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" value={telefono} onChange={e => setTelefono(e.target.value)}
                  className="bg-card text-foreground border-border" />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="correo">Correo <span className="text-red-500">*</span></Label>
                <Input id="correo" type="email" value={correo} onChange={e => setCorreo(e.target.value)}
                  className="bg-card text-foreground border-border" required />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={isSavingPerfil}
                  className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSavingPerfil ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                {perfilMsg && (
                  <span className={`text-sm ${perfilMsgType === 'ok' ? 'text-emerald-600' : 'text-destructive'}`}>
                    {perfilMsg}
                  </span>
                )}
              </div>
            </form>
          )}
        </Section>

        {/* ── Cambiar contraseña ─────────────────────────────────────────────── */}
        <Section icon={ShieldAlert} title="Cambiar contraseña">
          <p className="text-sm text-muted-foreground -mt-2">
            Necesitas ingresar tu contraseña actual para confirmar el cambio.
          </p>
          <form onSubmit={submitClave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="claveActual">Contraseña actual <span className="text-red-500">*</span></Label>
              <Input id="claveActual" type="password" value={claveActual}
                onChange={e => setClaveActual(e.target.value)}
                placeholder="••••••••"
                className="bg-card text-foreground border-border max-w-sm" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="claveNueva">Nueva contraseña <span className="text-red-500">*</span></Label>
              <Input id="claveNueva" type="password" value={claveNueva}
                onChange={e => setClaveNueva(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="bg-card text-foreground border-border" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="claveConfirm">Confirmar nueva contraseña <span className="text-red-500">*</span></Label>
              <Input id="claveConfirm" type="password" value={claveConfirm}
                onChange={e => setClaveConfirm(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="bg-card text-foreground border-border" />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={isSavingClave} variant="outline"
                className="border-border text-foreground">
                {isSavingClave ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
              {claveMsg && (
                <span className={`text-sm ${claveMsgType === 'ok' ? 'text-emerald-600' : 'text-destructive'}`}>
                  {claveMsg}
                </span>
              )}
            </div>
          </form>
        </Section>

        {/* ── Eliminar cuenta ───────────────────────────────────────────────── */}
        <section className="border border-destructive/30 bg-destructive/5 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />Eliminar cuenta
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            Si tienes historial de citas o ventas, tu cuenta se desactivará en lugar de eliminarse permanentemente.
          </p>
          <Button variant="destructive" disabled={isDeleting} onClick={deleteAccount}>
            {isDeleting ? 'Procesando...' : 'Eliminar mi cuenta'}
          </Button>
        </section>

      </div>
    </div>
  )
}