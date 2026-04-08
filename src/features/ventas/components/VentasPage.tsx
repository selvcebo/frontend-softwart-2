// src/features/ventas/components/VentasPage.tsx
import { useVentas } from '../hooks/useVentas'
import { useClientesOptions, useCitasOptions } from '@/src/shared/hooks/useOptions'
import { formatCOP }        from '@/src/shared/lib/formatCOP'
import { VentaAbonoModal } from './VentaAbonoModal'
import { useState, useMemo } from 'react'
import { SearchInput } from '@/src/shared/components/SearchInput'
import { Pagination }    from '@/src/shared/components/Pagination'
import { usePagination } from '@/src/shared/hooks/usePagination'
import { FilterBar } from '@/src/shared/components/FilterBar'
import { withToast } from '@/src/shared/lib/withToast'   
import { formatFecha } from '@/src/shared/lib/formatFecha'
import { Plus, Pencil, Trash2, Eye, CreditCard, CheckCircle2, CircleDashed } from 'lucide-react'
import { Button } from '@/src/shared/components/ui/button'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Switch } from '@/src/shared/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/shared/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/src/shared/components/ui/alert-dialog'
import { ViewDialog, EstadoBadge } from '@/src/shared/components/ViewDialog'
import { Combobox } from '@/src/shared/components/Combobox'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { DatePicker } from '@/src/shared/components/DatePicker'

type Venta = { id_venta: number; fecha: string; total: number; observacion?: string; estado: boolean; id_cliente: number; id_cita: number | null; num_abonos: number; pagos_realizados: number }

const fmt = formatCOP

const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
const labelCls = 'block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2'

export function VentasPage() {
  const { ventas, isLoading, onCrear, onEditar, onEliminar, onToggleEstado, refetch } = useVentas()

  // ── Modal de abonos ───────────────────────────────────────────────────────
  const [abonoModalVenta, setAbonoModalVenta] = useState<{ id: number; label: string } | null>(null)
  const { options: clientesOpts } = useClientesOptions()
  const { options: citasOpts, rawCitas } = useCitasOptions()

  // ── Búsqueda y filtros ─────────────────────────────────────────────────
  const [q,            setQ]            = useState('')
  const [filterEstado, setFilterEstado] = useState('')

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return ventas.filter(v => {
      const clienteLabel = clientesOpts.find(o => o.value === String(v.id_cliente))?.label ?? ''
      const citaLabel    = v.id_cita ? (citasOpts.find(o => o.value === String(v.id_cita))?.label ?? '') : ''
      const matchQ       = !s ||
        clienteLabel.toLowerCase().includes(s) ||
        citaLabel.toLowerCase().includes(s) ||
        v.fecha.includes(s)
      const matchEstado  = !filterEstado || (filterEstado === 'activo' ? v.estado : !v.estado)
      return matchQ && matchEstado
    })
  }, [ventas, clientesOpts, citasOpts, q, filterEstado])

  const { paginated, page, setPage, totalPages, total: paginationTotal, pageSize, setPageSize } = usePagination(filtered)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [viewingItem, setViewingItem] = useState<Venta | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [idCliente, setIdCliente] = useState('')
  const [idCita, setIdCita] = useState('')

  // Citas filtradas por el cliente seleccionado en el formulario
  const citasFormOpts = useMemo(() =>
    idCliente
      ? citasOpts.filter(opt =>
          rawCitas.find(c => String(c.id_cita) === opt.value)?.cliente?.id_cliente === Number(idCliente)
        )
      : [],
  [idCliente, citasOpts, rawCitas])
  const [fecha, setFecha] = useState('')
  const [total, setTotal] = useState('')
  const [observacion, setObservacion] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm = () => { setIdCliente(''); setIdCita(''); setFecha(''); setTotal(''); setObservacion(''); setErrors({}); setEditingId(null) }
  const openCreate = () => { resetForm(); setFecha(new Date().toISOString().slice(0, 10)); setIsFormOpen(true) }
  const openEdit = (v: Venta) => {
    setEditingId(v.id_venta); setIdCliente(String(v.id_cliente))
    setIdCita(v.id_cita ? String(v.id_cita) : ''); setFecha(v.fecha)
    setTotal(String(v.total)); setObservacion(v.observacion ?? '')
    setErrors({}); setIsFormOpen(true)
  }
  const openView = (v: Venta) => { setViewingItem(v); setIsViewOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!idCliente)    errs.idCliente = 'Campo requerido'
    if (!fecha.trim()) errs.fecha = 'Campo requerido'
    if (!total.trim()) errs.total = 'Campo requerido'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setIsSubmitting(true)
    try {
      const data = { id_cliente: Number(idCliente), id_cita: idCita ? Number(idCita) : null, fecha, total: Number(total), observacion, estado: true }
      await withToast(
        editingId ? onEditar(editingId, data) : onCrear(data),
        editingId ? 'Venta actualizada' : 'Venta registrada'
      )
      setIsFormOpen(false); resetForm()
    } catch { } finally { setIsSubmitting(false) }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-secondary">Ventas</h1>
          <p className="text-muted-foreground">Gestiona las ventas registradas</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar cliente, cita, fecha..." className="w-64" />
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Plus className="mr-2 h-4 w-4" />Registrar Venta
          </Button>
        </div>
      </div>

      <FilterBar
        filters={[
          { key: 'estado', label: 'Estado', type: 'chips', value: filterEstado, onChange: setFilterEstado,
            options: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }] },
        ]}
        onClear={() => setFilterEstado('')}
      />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin registros" description="No hay ventas registradas aún." />
      ) : (
        <>
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
           
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[24%]">Cliente</TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[15%]">Cita</TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[12%]">Fecha</TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[17%]">Total</TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Estado</TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[18%]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(v => {
                const clienteLabel = clientesOpts.find(o => o.value === String(v.id_cliente))?.label ?? `#${v.id_cliente}`
                const citaLabel = v.id_cita ? (citasOpts.find(o => o.value === String(v.id_cita))?.label ?? `#${v.id_cita}`) : '—'
                const pagada = v.pagos_realizados >= v.num_abonos
                return (
                  <TableRow key={v.id_venta} className={pagada ? 'bg-emerald-50 dark:bg-emerald-950/30 border-border' : 'hover:bg-muted/40 transition-colors border-border'}>

                    <TableCell className="text-foreground">{clienteLabel}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{citaLabel}</TableCell>
                    <TableCell className="text-foreground">{formatFecha(v.fecha)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-medium tabular-nums text-foreground">{fmt(v.total)}</span>
                        {pagada
                          ? <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium"><CheckCircle2 className="h-3 w-3" />Pagada</span>
                          : <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><CircleDashed className="h-3 w-3" />{v.pagos_realizados}/{v.num_abonos} abonos</span>
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Switch checked={v.estado} onCheckedChange={async () => { await withToast(onToggleEstado(v.id_venta), 'Estado actualizado') }} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(v)}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                       
                        <Button
                          variant="ghost" size="icon"
                          title="Gestionar abonos"
                          onClick={() => setAbonoModalVenta({
                            id:    v.id_venta,
                            label: `Venta #${v.id_venta} · ${clienteLabel}`,
                          })}
                        >
                          <CreditCard className="h-4 w-4 text-primary" />
                        </Button>
                        
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>

          <Pagination
            page={page} totalPages={totalPages} total={paginationTotal} pageSize={pageSize}
            onChange={setPage} onPageSizeChange={setPageSize} className="px-2 pb-2"
          />
        </div>
        </>
        )}

      {viewingItem && (
        <ViewDialog open={isViewOpen} onOpenChange={setIsViewOpen}
          title={`Venta #${viewingItem.id_venta}`} description={viewingItem.fecha}
          fields={[
            { label: 'ID',     value: viewingItem.id_venta },
            { label: 'Estado', value: <EstadoBadge estado={viewingItem.estado} /> },
            { label: 'Cliente', value: clientesOpts.find(o => o.value === String(viewingItem.id_cliente))?.label ?? `#${viewingItem.id_cliente}`, fullWidth: true },
            { label: 'Cita',   value: viewingItem.id_cita ? (citasOpts.find(o => o.value === String(viewingItem.id_cita))?.label ?? `#${viewingItem.id_cita}`) : '—' },
            { label: 'Fecha',  value: formatFecha(viewingItem.fecha) },
            { label: 'Total',  value: fmt(viewingItem.total) },
            { label: 'Observación', value: viewingItem.observacion ?? '—', fullWidth: true },
          ]} />
      )}

      <Dialog open={isFormOpen} onOpenChange={v => { setIsFormOpen(v); if (!v) resetForm() }}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-secondary">{editingId ? 'Editar Venta' : 'Registrar Venta'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Completa los datos de la venta.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            <div>
              <label className={labelCls} htmlFor="vta-cliente">Cliente <span className="text-destructive">*</span></label>
              <Combobox id="vta-cliente" options={clientesOpts} value={idCliente}
                onValueChange={v => { setIdCliente(v); setIdCita(''); if (errors.idCliente) setErrors(p => ({...p, idCliente:''})) }}
                placeholder="Buscar cliente..." searchPlaceholder="Nombre o documento..." />
              {errors.idCliente && <p className="mt-1 text-xs text-destructive">{errors.idCliente}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="vta-cita">Cita (opcional)</label>
              <Combobox id="vta-cita" options={citasFormOpts} value={idCita}
                onValueChange={v => {
                  setIdCita(v)
                  const citaFecha = rawCitas.find(c => String(c.id_cita) === v)?.fecha
                  if (citaFecha) setFecha(citaFecha)
                }}
                placeholder={idCliente ? 'Vincular a una cita...' : 'Selecciona un cliente primero'}
                searchPlaceholder="Buscar cita..." />
            </div>
            <div>
              <label className={labelCls} htmlFor="vta-fecha">Fecha <span className="text-destructive">*</span></label>
              <DatePicker
                id="vta-fecha"
                value={fecha}
                onChange={v => { setFecha(v); if (errors.fecha) setErrors(p => ({...p, fecha:''})) }}
                error={errors.fecha}
              />
              {errors.fecha && <p className="mt-1 text-xs text-destructive">{errors.fecha}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="vta-total">Total <span className="text-destructive">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <input id="vta-total" type="number" step="1" min="0" value={total}
                  onChange={e => { setTotal(e.target.value); if (errors.total) setErrors(p => ({...p, total:''})) }}
                  className={inputCls + ' pl-8'} placeholder="0" />
              </div>
              {total && <p className="text-xs text-muted-foreground">{fmt(Number(total))}</p>}
              {errors.total && <p className="mt-1 text-xs text-destructive">{errors.total}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="vta-observacion">Observación (opcional)</label>
              <textarea id="vta-observacion" value={observacion} placeholder="Notas o detalles de la venta..." onChange={e => setObservacion(e.target.value)}
                className={inputCls + ' resize-none'} rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button type="button" onClick={() => { setIsFormOpen(false); resetForm() }} className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50">
                {editingId ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal abonos */}
      {abonoModalVenta && (
        <VentaAbonoModal
          open={abonoModalVenta !== null}
          onClose={() => setAbonoModalVenta(null)}
          idVenta={abonoModalVenta.id}
          labelVenta={abonoModalVenta.label}
          onSuccess={refetch}
        />
      )}
    </div>
  )
}