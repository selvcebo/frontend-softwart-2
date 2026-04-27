// src/features/account/hooks/useAccount.ts
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { clearAuth } from '@/src/features/auth/hooks/useLogin'
import { tomorrowString } from '../utils'
import { BookedSlot } from '@/src/shared/components/TimePicker'

type ApiResponse<T> = { success: boolean; message?: string; data: T }

// ── Tipos de dominio ──────────────────────────────────────────────────────────

export type PerfilCliente = {
  id_cliente:     number
  tipoDocumento?: string
  documento?:     string
  nombre:         string
  correo:         string
  telefono:       string | null
  estado:         boolean
}

export type Cita = {
  id_cita: number
  fecha:   string
  hora:    string
  appointmentStatus?: { id_estado_cita: number; nombre: string } | null
}

export type Servicio = {
  id_detalle:  number
  fecha:       string
  servicio:    string
  estado:      string
  precio:      number
  observacion: string | null
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAccount() {
  const navigate = useNavigate()

  // ── Estado servidor ─────────────────────────────────────────────────────────
  const [perfil,    setPerfil]    = useState<PerfilCliente | null>(null)
  const [citas,     setCitas]     = useState<Cita[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  // ── Derived ─────────────────────────────────────────────────────────────────
  const primerNombre = perfil?.nombre?.split(' ')[0] ?? ''

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    const res = await apiRequest<ApiResponse<PerfilCliente>>('/api/account/perfil')
    setPerfil(res.data)
  }, [])

  const fetchMyAppointments = useCallback(async () => {
    const res = await apiRequest<ApiResponse<Cita[]>>('/api/account/citas')
    setCitas(res.data ?? [])
  }, [])

  const fetchMyServices = useCallback(async () => {
    const res = await apiRequest<ApiResponse<Servicio[]>>('/api/account/servicios')
    setServicios(res.data ?? [])
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true); setError(null)
    try {
      await Promise.all([fetchProfile(), fetchMyAppointments(), fetchMyServices()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar tu cuenta')
    } finally {
      setIsLoading(false)
    }
  }, [fetchProfile, fetchMyAppointments, fetchMyServices])

  useEffect(() => { refresh() }, [refresh])

  // ── Form perfil ─────────────────────────────────────────────────────────────
  const [perfilNombre,   setPerfilNombre]   = useState('')
  const [perfilTelefono, setPerfilTelefono] = useState('')
  const [perfilCorreo,   setPerfilCorreo]   = useState('')
  const [perfilMsg,      setPerfilMsg]      = useState<string | null>(null)
  const [perfilMsgType,  setPerfilMsgType]  = useState<'ok' | 'err'>('ok')
  const [isSavingPerfil, setIsSavingPerfil] = useState(false)

  useEffect(() => {
    if (!perfil) return
    setPerfilNombre(perfil.nombre ?? '')
    setPerfilTelefono(perfil.telefono ?? '')
    setPerfilCorreo(perfil.correo ?? '')
  }, [perfil])

  const submitPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setPerfilMsg(null); setIsSavingPerfil(true)
    try {
      const res = await apiRequest<ApiResponse<PerfilCliente>>('/api/account/perfil', {
        method: 'PUT',
        body: JSON.stringify({ nombre: perfilNombre, telefono: perfilTelefono || null, correo: perfilCorreo }),
      })
      setPerfil(res.data)
      setPerfilMsg('Datos actualizados correctamente')
      setPerfilMsgType('ok')
    } catch (e2) {
      setPerfilMsg(e2 instanceof Error ? e2.message : 'Error al actualizar')
      setPerfilMsgType('err')
    } finally { setIsSavingPerfil(false) }
  }

  // ── Form cambio de contraseña ───────────────────────────────────────────────
  const [claveActual,   setClaveActual]   = useState('')
  const [claveNueva,    setClaveNueva]    = useState('')
  const [claveConfirm,  setClaveConfirm]  = useState('')
  const [claveMsg,      setClaveMsg]      = useState<string | null>(null)
  const [claveMsgType,  setClaveMsgType]  = useState<'ok' | 'err'>('ok')
  const [isSavingClave, setIsSavingClave] = useState(false)

  const submitClave = async (e: React.FormEvent) => {
    e.preventDefault()
    setClaveMsg(null)
    if (!claveActual.trim()) { setClaveMsg('Ingresa tu contraseña actual'); setClaveMsgType('err'); return }
    if (claveNueva.length < 6) { setClaveMsg('La nueva contraseña debe tener al menos 6 caracteres'); setClaveMsgType('err'); return }
    if (claveNueva !== claveConfirm) { setClaveMsg('Las contraseñas no coinciden'); setClaveMsgType('err'); return }
    setIsSavingClave(true)
    try {
      await apiRequest('/api/account/perfil', {
        method: 'PUT',
        body: JSON.stringify({ clave_actual: claveActual, clave: claveNueva }),
      })
      setClaveMsg('Contraseña actualizada correctamente')
      setClaveMsgType('ok')
      setClaveActual(''); setClaveNueva(''); setClaveConfirm('')
    } catch (e2) {
      setClaveMsg(e2 instanceof Error ? e2.message : 'Error al cambiar contraseña')
      setClaveMsgType('err')
    } finally { setIsSavingClave(false) }
  }

  // ── Form nueva cita ─────────────────────────────────────────────────────────
  const [citaFecha,      setCitaFecha]      = useState(tomorrowString)
  const [citaHora,       setCitaHora]       = useState('')
  const [citaObs,        setCitaObs]        = useState('')
  const [disponibilidad, setDisponibilidad] = useState<BookedSlot[]>([])
  const [citaErrors,     setCitaErrors]     = useState<Record<string, string>>({})
  const [citaMsg,        setCitaMsg]        = useState<string | null>(null)
  const [citaMsgType,    setCitaMsgType]    = useState<'ok' | 'err'>('ok')
  const [isAgendando,    setIsAgendando]    = useState(false)

  const onCitaFechaChange = async (fecha: string) => {
    setCitaFecha(fecha)
    setCitaHora('')
    setCitaErrors(p => ({ ...p, fecha: '', hora: '' }))
    try {
      const res = await apiRequest<{ success: boolean; data: { id_cita: number; hora: string }[] }>(
        `/api/account/availability?fecha=${fecha}`
      )
      setDisponibilidad(
        (res.data ?? []).map(d => ({ hora: d.hora, id_cita: d.id_cita, clienteNombre: 'Ocupado' }))
      )
    } catch { setDisponibilidad([]) }
  }

  const onCitaHoraChange = (hora: string) => {
    setCitaHora(hora)
    setCitaErrors(p => ({ ...p, hora: '' }))
  }

  // Retorna true si el agendamiento fue exitoso (para que el componente cierre el modal)
  const submitCita = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!citaFecha) errs.fecha = 'Selecciona una fecha'
    if (!citaHora)  errs.hora  = 'Selecciona una hora'
    if (citaFecha < tomorrowString()) errs.fecha = 'Solo puedes agendar desde mañana'
    if (Object.keys(errs).length) { setCitaErrors(errs); return false }
    setIsAgendando(true); setCitaMsg(null); setCitaErrors({})
    try {
      await apiRequest('/api/account/citas', {
        method: 'POST',
        body: JSON.stringify({ fecha: citaFecha, hora: citaHora, observacion: citaObs || undefined }),
      })
      setCitaMsg('¡Cita agendada! Te contactaremos para confirmarla.')
      setCitaMsgType('ok')
      setCitaFecha(tomorrowString()); setCitaHora(''); setCitaObs('')
      window.location.reload()
      return true
    } catch (e2) {
      setCitaMsg(e2 instanceof Error ? e2.message : 'Error al agendar la cita')
      setCitaMsgType('err')
      return false
    } finally { setIsAgendando(false) }
  }

  const resetCitaForm = () => {
    setCitaErrors({}); setCitaMsg(null)
  }

  // ── Cancelar cita ───────────────────────────────────────────────────────────
  const onCancelAppointment = async (id_cita: number) => {
    await apiRequest(`/api/account/citas/${id_cita}/cancelar`, { method: 'PATCH' })
    setCitas(prev => prev.filter(c => c.id_cita !== id_cita))
  }

  // ── Eliminar cuenta ─────────────────────────────────────────────────────────
  const [isDeleting, setIsDeleting] = useState(false)

  const onDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await apiRequest('/api/account', { method: 'DELETE' })
      clearAuth()
      navigate('/', { replace: true })
    } catch (e2) {
      setIsDeleting(false)
      throw e2
    }
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const handleLogout = () => { clearAuth(); navigate('/', { replace: true }) }

  return {
    // servidor
    perfil, citas, servicios, isLoading, error, refresh,
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
  }
}
