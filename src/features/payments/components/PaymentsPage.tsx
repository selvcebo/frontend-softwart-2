// src/features/payments/components/PaymentsPage.tsx
import { usePayments } from '../hooks/usePayments'
import { useSalesOptions } from '@/src/shared/hooks/useOptions'
import { formatCurrency } from '@/src/shared/lib/formatCurrency'
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import { Button }   from '@/src/shared/components/ui/button'
import { Badge }    from '@/src/shared/components/ui/badge'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/shared/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { ViewDialog } from '@/src/shared/components/ViewDialog'
import { Combobox }    from '@/src/shared/components/Combobox'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { withToast } from '@/src/shared/lib/withToast'  
import { SearchInput } from '@/src/shared/components/SearchInput'
import { Pagination }    from '@/src/shared/components/Pagination'
import { usePagination } from '@/src/shared/hooks/usePagination'
import { FilterBar }   from '@/src/shared/components/FilterBar'
import { formatDate } from '@/src/shared/lib/formatDate'
import { DatePicker } from '@/src/shared/components/DatePicker'

type Pago = { id_pago: number; id_venta: number; monto: number; fecha: string; id_metodo_pago: number; id_estado_pago: number }
const fmt = formatCurrency

const inputCls  = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
const labelCls  = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'
const selectCls = 'w-full bg-muted border-0 border-b-2 border-transparent data-[state=open]:border-secondary !h-auto rounded-t-lg px-4 py-3 text-sm shadow-none focus-visible:ring-0 focus-visible:border-secondary'

const ESTADO_BADGE: Record<string, string> = {
  Pendiente:   'border-amber-300 bg-amber-100 text-amber-800',
  Validado:    'border-emerald-300 bg-emerald-100 text-emerald-800',
  Pagado:      'border-emerald-300 bg-emerald-100 text-emerald-800',
  Reembolsado: 'border-blue-300 bg-blue-100 text-blue-800',
}

export function PaymentsPage() {
  const { pagos, metodosPago, estadosPago, isLoading, onCreate, onChangeStatus, onChangeMethod } = usePayments()
  const { options: ventasOpts, rawVentas } = useSalesOptions()

  // ── Búsqueda y filtros ─────────────────────────────────────────────────────
  const [q,             setQ]             = useState('')
  const [filterMetodo,  setFilterMetodo]  = useState('')
  const [filterEstado,  setFilterEstado]  = useState('')

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return pagos.filter(p => {
      const ventaLabel = ventasOpts.find(o => o.value === String(p.id_venta))?.label ?? ''
      const matchQ       = !s || ventaLabel.toLowerCase().includes(s) || String(p.monto).includes(s) || p.fecha.includes(s)
      const matchMetodo  = !filterMetodo || String(p.id_metodo_pago) === filterMetodo
      const matchEstado  = !filterEstado || String(p.id_estado_pago) === filterEstado
      return matchQ && matchMetodo && matchEstado
    })
  }, [pagos, ventasOpts, q, filterMetodo, filterEstado])

  const { paginated, page, setPage, totalPages, total, pageSize, setPageSize } = usePagination(filtered)

  // ── Form ───────────────────────────────────────────────────────────────────
  const [isFormOpen,   setIsFormOpen]   = useState(false)
  const [isViewOpen,   setIsViewOpen]   = useState(false)
  const [viewingItem,  setViewingItem]  = useState<Pago | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [idVenta,  setIdVenta]  = useState('')
  const [monto,    setMonto]    = useState('')
  const [fecha,    setFecha]    = useState('')
  const [idMetodo, setIdMetodo] = useState('')
  const [idEstado, setIdEstado] = useState('')
  const [errors,   setErrors]   = useState<Record<string, string>>({})

  const ventaPagada = useMemo(() => {
    if (!idVenta) return false
    const v = rawVentas.find(rv => String(rv.id_venta) === idVenta)
    if (!v) return false
    return (v.pagos?.length ?? 0) >= (v.num_abonos ?? 2)
  }, [idVenta, rawVentas])

  const resetForm  = () => { setIdVenta(''); setMonto(''); setFecha(''); setIdMetodo(''); setIdEstado(''); setErrors({}) }
  const openCreate = (preIdVenta = '') => {
    resetForm()
    if (preIdVenta) setIdVenta(preIdVenta)
    setFecha(new Date().toISOString().slice(0, 10))
    setIsFormOpen(true)
  }

  // Abrir form automáticamente si viene ?id_venta=X en la URL
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const idVentaParam = searchParams.get('id_venta')
    if (idVentaParam) {
      openCreate(idVentaParam)
      // Limpiar el param de la URL sin redirigir
      setSearchParams({}, { replace: true })
    }
  }, [])
  const openView   = (p: Pago) => { setViewingItem(p); setIsViewOpen(true) }

  const getMetodoLabel = (id: number) => metodosPago.find(m => m.id_metodo_pago === id)?.nombre ?? `#${id}`
  const getEstadoLabel = (id: number) => estadosPago.find(e => e.id_estado_pago === id)?.nombre ?? `#${id}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!idVenta)      errs.idVenta  = 'Campo requerido'
    if (!monto.trim()) errs.monto    = 'Campo requerido'
    if (!fecha.trim()) errs.fecha    = 'Campo requerido'
    if (!idMetodo)     errs.idMetodo = 'Campo requerido'
    if (!idEstado)     errs.idEstado = 'Campo requerido'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setIsSubmitting(true)
    try {
      await withToast(
        onCreate({ id_venta: Number(idVenta), monto: Number(monto), fecha, id_metodo_pago: Number(idMetodo), id_estado_pago: Number(idEstado) }),
        'Pago registrado correctamente'
      )
      setIsFormOpen(false); resetForm()
    } catch { } finally { setIsSubmitting(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-secondary">Pagos</h1>
          <p className="text-muted-foreground">Gestiona los pagos registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar venta, monto, fecha..." className="w-64" />
          <Button onClick={() => openCreate()} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Plus className="mr-2 h-4 w-4" />Registrar Pago
          </Button>
        </div>
      </div>

      <FilterBar
        filters={[
          { key: 'metodo', label: 'Método de pago', type: 'select', value: filterMetodo, onChange: setFilterMetodo,
            options: metodosPago.map(m => ({ value: String(m.id_metodo_pago), label: m.nombre })) },
          { key: 'estado', label: 'Estado', type: 'chips', value: filterEstado, onChange: setFilterEstado,
            options: estadosPago.map(e => ({ value: String(e.id_estado_pago), label: e.nombre })) },
        ]}
        onClear={() => { setFilterMetodo(''); setFilterEstado('') }}
      />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay pagos que coincidan." />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
     
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[28%]">Venta</TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[11%]">Monto</TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[13%]">Fecha</TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[16%]">Método</TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[18%]">Estado</TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(p => {
                const ventaLabel   = ventasOpts.find(o => o.value === String(p.id_venta))?.label ?? `#${p.id_venta}`
                const estadoNombre = getEstadoLabel(p.id_estado_pago)
                return (
                  <TableRow key={p.id_pago} className="hover:bg-muted/40 transition-colors border-border">
     
                    <TableCell className="text-foreground text-sm">{ventaLabel}</TableCell>
                    <TableCell className="text-foreground text-right font-medium tabular-nums">{fmt(p.monto)}</TableCell>
                    <TableCell className="text-foreground">{formatDate(p.fecha)}</TableCell>
                    <TableCell>
                      <Select value={String(p.id_metodo_pago)} onValueChange={v => onChangeMethod(p.id_pago, Number(v))}>
                        <SelectTrigger className="w-32 h-8 text-foreground border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>{metodosPago.map(m => <SelectItem key={m.id_metodo_pago} value={String(m.id_metodo_pago)}>{m.nombre}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={String(p.id_estado_pago)} onValueChange={v => onChangeStatus(p.id_pago, Number(v))}>
                        <SelectTrigger className="w-36 h-8">
                          <Badge variant="outline" className={ESTADO_BADGE[estadoNombre] ?? 'border-slate-300 bg-slate-100 text-slate-600'}>{estadoNombre}</Badge>
                        </SelectTrigger>
                        <SelectContent>{estadosPago.map(e => <SelectItem key={e.id_estado_pago} value={String(e.id_estado_pago)}>{e.nombre}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(p)}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>

          <Pagination
            page={page} totalPages={totalPages} total={total} pageSize={pageSize}
            onChange={setPage} onPageSizeChange={setPageSize} className="px-2 pb-2"
          />
        </div>
        )}

      {viewingItem && (
        <ViewDialog open={isViewOpen} onOpenChange={setIsViewOpen}
          title={`Pago #${viewingItem.id_pago}`} description={viewingItem.fecha}
          fields={[
            { label: 'ID',             value: viewingItem.id_pago },
            { label: 'Venta',          value: ventasOpts.find(o => o.value === String(viewingItem.id_venta))?.label ?? `#${viewingItem.id_venta}`, fullWidth: true },
            { label: 'Monto',          value: fmt(viewingItem.monto) },
            { label: 'Fecha',          value: formatDate(viewingItem.fecha) },
            { label: 'Método de pago', value: getMetodoLabel(viewingItem.id_metodo_pago) },
            { label: 'Estado',         value: getEstadoLabel(viewingItem.id_estado_pago) },
          ]} />
      )}

      <Dialog open={isFormOpen} onOpenChange={v => { setIsFormOpen(v); if (!v) resetForm() }}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-secondary">Registrar Pago</DialogTitle>
            <DialogDescription className="text-muted-foreground">Completa los datos del pago.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            <div>
              <label className={labelCls} htmlFor="pago-venta">Venta <span className="text-destructive">*</span></label>
              <Combobox id="pago-venta" options={ventasOpts} value={idVenta} onValueChange={v => { setIdVenta(v); if (errors.idVenta) setErrors(p => ({...p, idVenta:''})) }} placeholder="Buscar venta..." searchPlaceholder="ID o fecha..." />
              {errors.idVenta && <p className="mt-1 text-xs text-destructive">{errors.idVenta}</p>}
              {ventaPagada && (
                <p className="mt-1 text-xs text-destructive font-medium">Esta venta ya tiene todos sus abonos registrados y no admite más pagos.</p>
              )}
            </div>
            <div>
              <label className={labelCls} htmlFor="pago-monto">Monto <span className="text-destructive">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input id="pago-monto" type="number" step="1" min="0" value={monto} onChange={e => { setMonto(e.target.value); if (errors.monto) setErrors(p => ({...p, monto:''})) }} className={inputCls + ' pl-8'} placeholder="0" />
              </div>
              {monto && <p className="text-xs text-muted-foreground">{fmt(Number(monto))}</p>}
              {errors.monto && <p className="mt-1 text-xs text-destructive">{errors.monto}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="pago-fecha">Fecha <span className="text-destructive">*</span></label>
              <DatePicker
                id="pago-fecha"
                value={fecha}
                onChange={v => { setFecha(v); if (errors.fecha) setErrors(p => ({...p, fecha:''})) }}
                error={errors.fecha}
              />
              {errors.fecha && <p className="mt-1 text-xs text-destructive">{errors.fecha}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="pago-metodo">Método de pago <span className="text-destructive">*</span></label>
              <Select value={idMetodo} onValueChange={v => { setIdMetodo(v); if (errors.idMetodo) setErrors(p => ({...p, idMetodo:''})) }}>
                <SelectTrigger id="pago-metodo" className={selectCls}><SelectValue placeholder="Seleccionar método" /></SelectTrigger>
                <SelectContent>{metodosPago.map(m => <SelectItem key={m.id_metodo_pago} value={String(m.id_metodo_pago)}>{m.nombre}</SelectItem>)}</SelectContent>
              </Select>
              {errors.idMetodo && <p className="mt-1 text-xs text-destructive">{errors.idMetodo}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="pago-estado">Estado <span className="text-destructive">*</span></label>
              <Select value={idEstado} onValueChange={v => { setIdEstado(v); if (errors.idEstado) setErrors(p => ({...p, idEstado:''})) }}>
                <SelectTrigger id="pago-estado" className={selectCls}><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                <SelectContent>{estadosPago.map(e => <SelectItem key={e.id_estado_pago} value={String(e.id_estado_pago)}>{e.nombre}</SelectItem>)}</SelectContent>
              </Select>
              {errors.idEstado && <p className="mt-1 text-xs text-destructive">{errors.idEstado}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button type="button" onClick={() => { setIsFormOpen(false); resetForm() }} className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors">Cancelar</button>
              <button type="submit" disabled={isSubmitting || ventaPagada} className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50">Registrar</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}