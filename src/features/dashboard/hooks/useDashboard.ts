// src/features/dashboard/hooks/useDashboard.ts
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'

type DashboardKpis = {
  ventas_mes_actual:   number
  ventas_mes_anterior: number
  ingresos_mes:        number
  pagos_pendientes:    number
  citas_hoy:           number
  citas_pendientes:    number
  pedidos_sin_empezar:   number
  pedidos_en_preparacion: number
}

type CitaHoy = {
  id_cita:        number
  hora:           string
  cliente_nombre: string
  estado:         string
}

type PedidoEstado  = { estado: string; total: number }
type VentaReciente = { id_venta: number; fecha: string; total: number; cliente_nombre: string }
type VentaSemana   = { semana: string; total: number }
type MetodoPago    = { metodo: string; total: number }

type DashboardAlertas = {
  ventas_sin_pago:   number
  pedidos_atrasados: number
  citas_sin_venta:   number
}

type DashboardData = {
  kpis:               DashboardKpis
  citas_hoy:          CitaHoy[]
  pedidos_por_estado: PedidoEstado[]
  ventas_recientes:   VentaReciente[]
  ventas_por_semana:  VentaSemana[]
  metodos_pago:       MetodoPago[]
  alertas:            DashboardAlertas
}

type ApiRes = { success: boolean; data: DashboardData }

export function useDashboard() {
  const [data,      setData]      = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchDashboard = async () => {
    setIsLoading(true); setError(null)
    try {
      const res = await apiRequest<ApiRes>('/api/dashboard')
      setData(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  return { data, isLoading, error, refetch: fetchDashboard }
}