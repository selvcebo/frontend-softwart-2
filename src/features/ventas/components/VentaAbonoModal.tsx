// src/features/ventas/components/VentaAbonoModal.tsx
// Modal para registrar abonos y configurar el plan de pagos de una venta
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { formatCOP }  from '@/src/shared/lib/formatCOP'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/shared/components/ui/dialog'
import { Button }  from '@/src/shared/components/ui/button'
import { Input }   from '@/src/shared/components/ui/input'
import { Label }   from '@/src/shared/components/ui/label'
import { Badge }   from '@/src/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/shared/components/ui/select'
import { CheckCircle2, CreditCard, Settings2, ChevronRight } from 'lucide-react'
import { formatFecha } from '@/src/shared/lib/formatFecha'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type AbonoEsperado = { numero: number; monto: number; porcentaje: number }

type EstadoPagos = {
  id_venta:               number
  total:                  number
  num_abonos:             number
  porcentaje_primer_abono: number
  pagos_realizados:       number
  total_pagado:           number
  saldo_pendiente:        number
  completado:             boolean
  plan_abonos:            AbonoEsperado[]
  siguiente_abono:        { numero: number; montoEsperado: number; esUltimo: boolean } | null
  historial_pagos:        { id_pago: number; monto: number; fecha: string; estado: string }[]
}

type MetodoPago = { id_metodo_pago: number; nombre: string }

interface Props {
  open:         boolean
  onClose:      () => void
  idVenta:      number
  labelVenta:   string
  onSuccess:    () => void   // callback para refrescar la lista
}

// ── Componente ────────────────────────────────────────────────────────────────
export function VentaAbonoModal({ open, onClose, idVenta, labelVenta, onSuccess }: Props) {
  const [estado,       setEstado]       = useState<EstadoPagos | null>(null)
  const [metodos,      setMetodos]      = useState<MetodoPago[]>([])
  const [isLoading,    setIsLoading]    = useState(false)
  const [tab,          setTab]          = useState<'pagar' | 'configurar'>('pagar')

  // Form pago
  const [monto,        setMonto]        = useState('')
  const [idMetodo,     setIdMetodo]     = useState('')
  const [fechaPago,    setFechaPago]    = useState(new Date().toISOString().slice(0, 10))
  const [pagoMsg,      setPagoMsg]      = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [isPagando,    setIsPagando]    = useState(false)

  // Form configurar
  const [numAbonos,    setNumAbonos]    = useState('')
  const [pctPrimero,   setPctPrimero]   = useState('')
  const [configMsg,    setConfigMsg]    = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [isConfigurando, setIsConfigurando] = useState(false)

  const fmt = formatCOP

  // Cargar estado de pagos y métodos
  useEffect(() => {
    if (!open || !idVenta) return
    setIsLoading(true)
    setPagoMsg(null); setConfigMsg(null); setTab('pagar')

    Promise.all([
      apiRequest<{ success: boolean; data: EstadoPagos }>(`/api/ventas/${idVenta}/estado-pagos`),
      apiRequest<{ success: boolean; data: MetodoPago[] }>('/api/metodo-pago?limit=50'),
    ])
      .then(([estadoRes, metodosRes]) => {
        setEstado(estadoRes.data)
        setMetodos(metodosRes.data ?? [])
        // Pre-llenar monto con el siguiente abono esperado
        if (estadoRes.data.siguiente_abono) {
          setMonto(String(estadoRes.data.siguiente_abono.montoEsperado))
        }
        setNumAbonos(String(estadoRes.data.num_abonos))
        setPctPrimero(String(estadoRes.data.porcentaje_primer_abono))
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [open, idVenta])

  const handlePagar = async () => {
    if (!idMetodo) { setPagoMsg({ tipo: 'err', texto: 'Selecciona el método de pago' }); return }
    setIsPagando(true); setPagoMsg(null)
    try {
      const res = await apiRequest<{ success: boolean; message: string; data: any }>(
        `/api/ventas/${idVenta}/abono`,
        { method: 'POST', body: JSON.stringify({ monto: Number(monto), id_metodo_pago: Number(idMetodo), fecha: fechaPago }) }
      )
      setPagoMsg({ tipo: 'ok', texto: res.message })
      onSuccess()
      // Recargar estado
      const estadoRes = await apiRequest<{ success: boolean; data: EstadoPagos }>(`/api/ventas/${idVenta}/estado-pagos`)
      setEstado(estadoRes.data)
      if (estadoRes.data.siguiente_abono) setMonto(String(estadoRes.data.siguiente_abono.montoEsperado))
      else setMonto('')
    } catch (e) {
      setPagoMsg({ tipo: 'err', texto: e instanceof Error ? e.message : 'Error al registrar abono' })
    } finally { setIsPagando(false) }
  }

  const handleConfigurar = async () => {
    setIsConfigurando(true); setConfigMsg(null)
    try {
      const res = await apiRequest<{ success: boolean; message: string; data: any }>(
        `/api/ventas/${idVenta}/configurar-abonos`,
        { method: 'PATCH', body: JSON.stringify({
            num_abonos:             Number(numAbonos),
            porcentaje_primer_abono: Number(pctPrimero),
        })}
      )
      setConfigMsg({ tipo: 'ok', texto: res.message })
      const estadoRes = await apiRequest<{ success: boolean; data: EstadoPagos }>(`/api/ventas/${idVenta}/estado-pagos`)
      setEstado(estadoRes.data)
      if (estadoRes.data.siguiente_abono) setMonto(String(estadoRes.data.siguiente_abono.montoEsperado))
    } catch (e) {
      setConfigMsg({ tipo: 'err', texto: e instanceof Error ? e.message : 'Error al configurar' })
    } finally { setIsConfigurando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="bg-card text-card-foreground border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-5 w-5 text-primary" />
            Abonos — {labelVenta}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {estado ? `Total: ${fmt(estado.total)} · ${estado.pagos_realizados}/${estado.num_abonos} abonos` : 'Cargando...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Cargando...</div>
        ) : !estado ? null : (
          <div className="flex flex-col gap-4 mt-2">

            {/* ── Barra de progreso ────────────────────────────────────────── */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Pagado: {fmt(estado.total_pagado)}</span>
                <span>Saldo: {fmt(estado.saldo_pendiente)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, estado.total_pagado / estado.total * 100)}%` }}
                />
              </div>
            </div>

            {/* ── Plan de abonos ───────────────────────────────────────────── */}
            <div className="grid gap-1.5">
              {estado.plan_abonos.map(ab => {
                const pagado = estado.historial_pagos[ab.numero - 1]
                return (
                  <div key={ab.numero}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm
                      ${pagado ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800'
                               : ab.numero === (estado.pagos_realizados + 1)
                                 ? 'border-primary/40 bg-primary/5'
                                 : 'border-border bg-muted/30'}`}
                  >
                    <div className="flex items-center gap-2">
                      {pagado
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        : <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                      }
                      <span className="font-medium text-foreground">Abono {ab.numero}</span>
                      <span className="text-muted-foreground text-xs">({ab.porcentaje}%)</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-foreground">{fmt(ab.monto)}</span>
                      {pagado && (
                        <span className="ml-2 text-xs text-emerald-600">{formatFecha(pagado.fecha)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Tabs: Pagar / Configurar ─────────────────────────────────── */}
            {!estado.completado && (
              <>
                <div className="flex gap-1 border-b border-border pb-0 -mb-1">
                  {(['pagar', 'configurar'] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => setTab(t)}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
                        ${tab === t
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    >
                      {t === 'pagar' ? '💳 Registrar abono' : '⚙️ Configurar plan'}
                    </button>
                  ))}
                </div>

                {/* Tab Pagar */}
                {tab === 'pagar' && estado.siguiente_abono && (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">Abono {estado.siguiente_abono.numero} esperado: </span>
                      <span className="font-bold text-foreground">{fmt(estado.siguiente_abono.montoEsperado)}</span>
                      {estado.siguiente_abono.esUltimo && (
                        <Badge variant="outline" className="ml-2 text-[10px] border-amber-300 bg-amber-50 text-amber-700">Último abono</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-foreground text-xs">Monto ($) <span className="text-red-500">*</span></Label>
                        <Input
                          type="number" min="0" value={monto}
                          onChange={e => setMonto(e.target.value)}
                          className="bg-card border-border h-9 text-sm"
                        />
                        {monto && <p className="text-xs text-muted-foreground">{fmt(Number(monto))}</p>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-foreground text-xs">Fecha <span className="text-red-500">*</span></Label>
                        <Input
                          type="date" value={fechaPago}
                          onChange={e => setFechaPago(e.target.value)}
                          className="bg-card border-border h-9 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label className="text-foreground text-xs">Método de pago <span className="text-red-500">*</span></Label>
                      <Select value={idMetodo} onValueChange={setIdMetodo}>
                        <SelectTrigger className="bg-card border-border h-9 text-sm">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {metodos.map(m => (
                            <SelectItem key={m.id_metodo_pago} value={String(m.id_metodo_pago)}>{m.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handlePagar}
                      disabled={isPagando || !monto || !idMetodo}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 self-end"
                    >
                      <ChevronRight className="h-4 w-4" />
                      {isPagando ? 'Registrando...' : `Registrar abono ${estado.siguiente_abono.numero}`}
                    </Button>
                  </div>
                )}

                {/* Tab Configurar */}
                {tab === 'configurar' && (
                  <div className="flex flex-col gap-3">
                    {estado.pagos_realizados > 0 && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Ya hay {estado.pagos_realizados} pago(s) registrado(s). No se puede cambiar la configuración.
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-foreground text-xs">Número de abonos <span className="text-red-500">*</span></Label>
                        <Input
                          type="number" min="1" max="12"
                          value={numAbonos}
                          onChange={e => setNumAbonos(e.target.value)}
                          disabled={estado.pagos_realizados > 0}
                          className="bg-card border-border h-9 text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground">Máximo 12</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-foreground text-xs">% primer abono <span className="text-red-500">*</span></Label>
                        <Input
                          type="number" min="1" max="99"
                          value={pctPrimero}
                          onChange={e => setPctPrimero(e.target.value)}
                          disabled={estado.pagos_realizados > 0}
                          className="bg-card border-border h-9 text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground">Entre 1 y 99</p>
                      </div>
                    </div>

                    {/* Preview del plan */}
                    {numAbonos && pctPrimero && Number(numAbonos) >= 1 && Number(pctPrimero) >= 1 && (
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground mb-1.5">Vista previa:</p>
                        {(() => {
                          const t = estado.total
                          const n = Number(numAbonos)
                          const p = Number(pctPrimero)
                          const a1 = Math.round(t * p / 100 * 100) / 100
                          const resto = t - a1
                          if (n === 1) return <p>Abono único: {fmt(t)}</p>
                          const intermedios = Array.from({ length: n - 2 }, (_, i) =>
                            Math.round(resto / (n - 1) * 100) / 100
                          )
                          const ultimo = Math.round((resto - intermedios.reduce((a,b) => a+b, 0)) * 100) / 100
                          return (
                            <div className="space-y-0.5">
                              <p>Abono 1: {fmt(a1)} ({p}%)</p>
                              {intermedios.map((m, i) => <p key={i}>Abono {i+2}: {fmt(m)}</p>)}
                              <p>Abono {n} (último): {fmt(ultimo)}</p>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {configMsg && (
                      <div className={`rounded-lg border px-3 py-2 text-sm ${configMsg.tipo === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
                        {configMsg.texto}
                      </div>
                    )}

                    <Button
                      onClick={handleConfigurar}
                      disabled={isConfigurando || estado.pagos_realizados > 0}
                      variant="outline"
                      className="gap-2 self-end"
                    >
                      <Settings2 className="h-4 w-4" />
                      {isConfigurando ? 'Guardando...' : 'Guardar configuración'}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Feedback del último pago — fuera del bloque siguiente_abono para que persista aunque se complete */}
            {pagoMsg && tab === 'pagar' && (
              <div className={`rounded-lg border px-3 py-2 text-sm ${pagoMsg.tipo === 'ok' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}>
                {pagoMsg.texto}
              </div>
            )}

            {/* Completado */}
            {estado.completado && (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Venta completamente pagada</p>
                  <p className="text-xs text-emerald-700">{estado.num_abonos} abono(s) · Total: {fmt(estado.total)}</p>
                </div>
              </div>
            )}

          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}