// src/features/dashboard/components/DashboardPage.tsx
import { useDashboard } from '../hooks/useDashboard'
import { formatCurrency } from '@/src/shared/lib/formatCurrency'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Badge } from '@/src/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/src/shared/components/ui/alert'
import {
  TrendingUp, TrendingDown, Minus,
  CalendarClock, Clock, PackageSearch,
  AlertTriangle, RefreshCw, Wallet,
  CreditCard, ClipboardList, DollarSign, ShoppingBag,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useState, useMemo } from 'react'

const fmt = formatCurrency

// ── Colores para el PieChart ──────────────────────────────────────────────────
const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, trend, trendLabel, color = 'primary',
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'flat'
  trendLabel?: string
  color?: 'primary' | 'amber' | 'emerald' | 'rose'
}) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    amber:   'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    rose:    'bg-rose-100 text-rose-700',
  }
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-500' : 'text-muted-foreground'

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`rounded-lg p-2 ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
        {(trendLabel || sub) && (
          <div className="flex items-center gap-1.5">
            {trend && <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />}
            <span className={`text-xs ${trendColor}`}>{trendLabel ?? sub}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Alerta chip ───────────────────────────────────────────────────────────────
function AlertChip({ count, label }: { count: number; label: string }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
      <span className="text-sm text-amber-800">
        <strong>{count}</strong> {label}
      </span>
    </div>
  )
}

// ── Tooltip personalizado para BarChart ───────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{fmt(payload[0].value)}</p>
    </div>
  )
}

// ── Page principal ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard()

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={refetch} className="flex items-center gap-1 text-sm underline">
              <RefreshCw className="h-3.5 w-3.5" />Reintentar
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Calcular tendencia ventas mes actual vs anterior
  const ventasMes    = data?.kpis.ventas_mes_actual ?? 0
  const ventasAntMes = data?.kpis.ventas_mes_anterior ?? 0
  const ventasTrend  = ventasMes > ventasAntMes ? 'up' : ventasMes < ventasAntMes ? 'down' : 'flat'
  const ventasDiff   = ventasAntMes > 0
    ? `${ventasMes > ventasAntMes ? '+' : ''}${(((ventasMes - ventasAntMes) / ventasAntMes) * 100).toFixed(1)}% vs mes anterior`
    : 'Sin datos mes anterior'

  // ── Filtro de semanas para gráfica de ventas ──────────────────────────────
  const WEEK_OPTIONS = [
    { value: 1, label: '1 semana' },
    { value: 2, label: '2 semanas' },
    { value: 4, label: '4 semanas' },
    { value: 8, label: '8 semanas' },
  ] as const
  const [weeksFilter, setWeeksFilter] = useState(8)
  const ventasFiltradas = useMemo(() => {
    if (!data) return []
    const all = data.ventas_por_semana
    return all.slice(-weeksFilter)
  }, [data, weeksFilter])

  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground capitalize">{today}</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-4 w-4" />Actualizar
        </button>
      </div>

      {/* Alertas operativas */}
      {data && (data.alertas.ventas_sin_pago > 0 || data.alertas.pedidos_atrasados > 0 || data.alertas.citas_sin_venta > 0) && (
        <div className="flex flex-wrap gap-2">
          <AlertChip count={data.alertas.ventas_sin_pago}   label="ventas sin pago registrado" />
          <AlertChip count={data.alertas.pedidos_atrasados} label="pedidos pendientes hace +3 días" />
          <AlertChip count={data.alertas.citas_sin_venta}   label="citas completadas sin venta" />
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 7 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KpiCard label="Ventas del mes"         value={fmt(ventasMes)}                          icon={DollarSign}    trend={ventasTrend}  trendLabel={ventasDiff} color="primary" />
            <KpiCard label="Ingresos cobrados"      value={fmt(data!.kpis.ingresos_mes)}            icon={Wallet}        color="emerald" sub="Pagos confirmados este mes" />
            <KpiCard label="Pagos pendientes"       value={fmt(data!.kpis.pagos_pendientes)}        icon={CreditCard}    color="amber"   sub="Pendientes de cobro" />
            <KpiCard label="Citas hoy"              value={data!.kpis.citas_hoy}                    icon={CalendarClock} color="emerald" sub="Programadas para hoy" />
            <KpiCard label="Citas pendientes"       value={data!.kpis.citas_pendientes}             icon={Clock}         color="amber"   sub="Por confirmar" />
            <KpiCard label="Pedidos sin empezar"    value={data!.kpis.pedidos_sin_empezar}          icon={PackageSearch} color="rose"    sub="Sin iniciar aún" />
            <KpiCard label="Pedidos en preparación" value={data!.kpis.pedidos_en_preparacion}       icon={ClipboardList} color="amber"   sub="En proceso ahora" />
            <KpiCard label="Total pedidos activos"  value={data!.pedidos_por_estado.reduce((a, b) => a + Number(b.total), 0)} icon={ShoppingBag} color="primary" sub="Todos los estados" />
          </>
        )}
      </div>

      {/* Fila principal: gráfica ventas + citas hoy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Ventas por semana — ocupa 2/3 */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Ventas por semana</h2>
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
              {WEEK_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setWeeksFilter(opt.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    weeksFilter === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? <Skeleton className="h-48 w-full" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={ventasFiltradas.map((d, i) => ({ ...d, fill: PIE_COLORS[i % PIE_COLORS.length] }))}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {ventasFiltradas.map((_, i) => (
                    <Cell key={`bar-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Citas hoy — ocupa 1/3 */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Citas hoy
            {data && <Badge variant="secondary" className="ml-2">{data.kpis.citas_hoy}</Badge>}
          </h2>
          {isLoading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full" />)}</div>
          ) : data!.citas_hoy.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sin citas para hoy 🎉</p>
          ) : (
            <ul className="flex flex-col gap-2 overflow-y-auto max-h-[200px]">
              {data!.citas_hoy.map(c => (
                <li key={c.id_cita} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{c.cliente_nombre}</span>
                    <span className="text-xs text-muted-foreground">{c.hora}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{c.estado}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Fila secundaria: ventas recientes + pedidos por estado + métodos pago */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Ventas recientes — 1/3 */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Últimas ventas</h2>
          {isLoading ? (
            <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-10 w-full" />)}</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {data!.ventas_recientes.map(v => (
                <li key={v.id_venta} className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-foreground truncate">{v.cliente_nombre}</span>
                    <span className="text-xs text-muted-foreground">{v.fecha}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums shrink-0 ml-2">
                    {fmt(v.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pedidos por estado — 1/3 */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Pedidos por estado</h2>
          {isLoading ? <Skeleton className="h-40 w-full" /> : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={data!.pedidos_por_estado.map(p => ({ ...p, total: Number(p.total) }))}
                  dataKey="total"
                  nameKey="estado"
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={65}
                  paddingAngle={3}
                >
                  {data!.pedidos_por_estado.map((_, i) => (
                    <Cell key={`pie-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                />
                <Tooltip formatter={(v) => [Number(v), 'Pedidos']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Métodos de pago — 1/3 */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Métodos de pago</h2>
          {isLoading ? <Skeleton className="h-40 w-full" /> : data!.metodos_pago.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sin pagos registrados</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={data!.metodos_pago.map(m => ({ ...m, total: Number(m.total) }))}
                  dataKey="total"
                  nameKey="metodo"
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={65}
                  paddingAngle={3}
                >
                  {data!.metodos_pago.map((_, i) => (
                    <Cell key={`mp-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                />
                <Tooltip formatter={(v) => [Number(v), 'Pagos']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}