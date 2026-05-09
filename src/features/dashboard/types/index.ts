export type DashboardKpis = {
  ventas_mes_actual:      number
  ventas_mes_anterior:    number
  ingresos_mes:           number
  pagos_pendientes:       number
  citas_hoy:              number
  citas_pendientes:       number
  pedidos_sin_empezar:    number
  pedidos_en_preparacion: number
}

export type CitaHoy      = { id_cita: number; hora: string; cliente_nombre: string; estado: string }
export type PedidoEstado  = { estado: string; total: number }
export type VentaReciente = { id_venta: number; fecha: string; total: number; cliente_nombre: string }
export type VentaSemana   = { semana: string; total: number }
export type MetodoPagoDash = { metodo: string; total: number }

export type AlertaVenta   = { id_venta: number; cliente_nombre: string; fecha: string; total: number }
export type AlertaCita    = { id_cita: number; cliente_nombre: string; fecha: string; hora: string }
export type AlertaPedido  = { id_detalle: number; servicio: string; cliente_nombre: string; fecha: string }

export type DashboardAlertas = {
  ventas_sin_pago:   AlertaVenta[]
  citas_sin_venta:   AlertaCita[]
  pedidos_atrasados: AlertaPedido[]
}

export type DashboardData = {
  kpis:               DashboardKpis
  citas_hoy:          CitaHoy[]
  pedidos_por_estado: PedidoEstado[]
  ventas_recientes:   VentaReciente[]
  ventas_por_semana:  VentaSemana[]
  metodos_pago:       MetodoPagoDash[]
  alertas:            DashboardAlertas
}
