// src/features/orders/components/OrdersPage.tsx
import { useOrders } from '../hooks/useOrders'
import { useSalesOptions, useServicesOptions, useFrameOptions } from '@/src/shared/hooks/useOptions'
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchInput } from '@/src/shared/components/SearchInput'
import { Pagination }    from '@/src/shared/components/Pagination'
import { usePagination } from '@/src/shared/hooks/usePagination'
import { FilterBar } from '@/src/shared/components/FilterBar'
import { toast } from 'sonner'
import { formatDate } from '@/src/shared/lib/formatDate'
import { Plus, Pencil, Eye } from 'lucide-react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { Button } from '@/src/shared/components/ui/button'
import { Badge } from '@/src/shared/components/ui/badge'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/src/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/shared/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { ViewDialog } from '@/src/shared/components/ViewDialog'
import { Combobox } from '@/src/shared/components/Combobox'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { DatePicker } from '@/src/shared/components/DatePicker'
import { formatCurrency } from '@/src/shared/lib/formatCurrency'

const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
const labelCls = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'

// ── Tipo local ────────────────────────────────────────────────────────────────
type Pedido = {
  id_detalle: number; id_venta: number; id_servicio: number
  id_estado: number; id_marco: number | null
  fecha: string; observacion?: string; precio: number; estado: boolean
}

// ── Estado de servicio desde BD ───────────────────────────────────────────────
type EstadoServicio = { id_estado: number; nombre: string }

// Colores por posición (sin importar el ID de BD)
const BADGE_COLORS = [
  'border-amber-300 bg-amber-100 text-amber-800',
  'border-blue-300 bg-blue-100 text-blue-800',
  'border-emerald-300 bg-emerald-100 text-emerald-800',
  'border-slate-300 bg-slate-100 text-slate-600',
  'border-purple-300 bg-purple-100 text-purple-800',
]

function badgeClass(index: number) {
  return BADGE_COLORS[index % BADGE_COLORS.length]
}

// ── Hook para cargar estados de servicio ──────────────────────────────────────
function useEstadosServicio() {
  const [estados, setEstados] = useState<EstadoServicio[]>([])
  useEffect(() => {
    apiRequest<{ success: boolean; data: EstadoServicio[] }>('/api/service-status')
      .then(r => setEstados(r.data ?? []))
      .catch(() => {})
  }, [])
  return estados
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function OrdersPage() {
  const { pedidos, isLoading, onCreate, onEdit, onChangeStatus } = useOrders()
  const { options: ventasOpts, rawVentas } = useSalesOptions()
  const { options: serviciosOpts } = useServicesOptions()
  const { options: marcosOpts }    = useFrameOptions()
  const estados = useEstadosServicio()
  const [searchParams] = useSearchParams()

  // ── Búsqueda y filtros ─────────────────────────────────────────────────
  const [q,            setQ]            = useState(searchParams.get('q') ?? '')
  const [filterEstado, setFilterEstado] = useState('')

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    // Mapa de orden de estado por posición en el array (Sin empezar=0, En preparación=1, Completado=2)
    const estadoOrder = new Map(estados.map((e, i) => [e.id_estado, i]))
    return pedidos.filter(p => {
      const ventaLabel    = ventasOpts.find(o => o.value === String(p.id_venta))?.label ?? ''
      const servicioLabel = serviciosOpts.find(o => o.value === String(p.id_servicio))?.label ?? ''
      const marcoLabel    = p.id_marco ? (marcosOpts.find(o => o.value === String(p.id_marco))?.label ?? '') : ''
      const clienteNombre = rawVentas.find(rv => rv.id_venta === p.id_venta)?.client?.nombre ?? ''
      const matchQ        = !s ||
        clienteNombre.toLowerCase().includes(s) ||
        ventaLabel.toLowerCase().includes(s) ||
        servicioLabel.toLowerCase().includes(s) ||
        marcoLabel.toLowerCase().includes(s) ||
        p.fecha.includes(s)
      const matchEstado   = !filterEstado || String(p.id_estado) === filterEstado
      return matchQ && matchEstado
    }).sort((a, b) => {
      // 1. Estado: Sin empezar → En preparación → Completado
      const estCmp = (estadoOrder.get(a.id_estado) ?? 9) - (estadoOrder.get(b.id_estado) ?? 9)
      if (estCmp !== 0) return estCmp
      // 2. Fecha: más viejo primero
      return a.fecha.localeCompare(b.fecha)
    })
  }, [pedidos, ventasOpts, serviciosOpts, marcosOpts, q, filterEstado, estados])

  const { paginated, page, setPage, totalPages, total, pageSize, setPageSize } = usePagination(filtered)

  const [isFormOpen,   setIsFormOpen]   = useState(false)
  const [isViewOpen,   setIsViewOpen]   = useState(false)
  const [editingId,    setEditingId]    = useState<number | null>(null)
  const [viewingItem,  setViewingItem]  = useState<Pedido | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError,  setActionError]  = useState<string | null>(null)

  const [idVenta,      setIdVenta]      = useState('')
  const [idServicio,   setIdServicio]   = useState('')
  const [idMarco,      setIdMarco]      = useState('')
  const [idEstado,     setIdEstado]     = useState('')
  const [fecha,        setFecha]        = useState('')
  const [precio,       setPrecio]       = useState('')
  const [observacion,  setObservacion]  = useState('')
  const [errors,       setErrors]       = useState<Record<string, string>>({})

  // Helpers para nombre y color de estado por id
  const estadoNombre = (id: number) =>
    estados.find(e => e.id_estado === id)?.nombre ?? `Estado ${id}`
  const estadoColor = (id: number) => {
    const idx = estados.findIndex(e => e.id_estado === id)
    return badgeClass(idx === -1 ? 0 : idx)
  }

  const resetForm = () => {
    setIdVenta(''); setIdServicio(''); setIdMarco(''); setIdEstado('')
    setFecha(''); setPrecio(''); setObservacion(''); setErrors({}); setEditingId(null)
  }
  const openCreate = () => { resetForm(); setFecha(new Date().toISOString().slice(0, 10)); setIsFormOpen(true) }
  const openEdit   = (p: Pedido) => {
    setEditingId(p.id_detalle); setIdVenta(String(p.id_venta))
    setIdServicio(String(p.id_servicio)); setIdMarco(p.id_marco ? String(p.id_marco) : '')
    setIdEstado(String(p.id_estado)); setFecha(p.fecha)
    setPrecio(String(p.precio)); setObservacion(p.observacion ?? '')
    setErrors({}); setIsFormOpen(true)
  }

  const handleVentaChange = (v: string) => {
    setIdVenta(v)
    if (errors.idVenta) setErrors(p => ({...p, idVenta: ''}))
    if (!editingId) {
      const total = rawVentas.find(rv => String(rv.id_venta) === v)?.total
      if (total != null) setPrecio(String(total))
    }
  }
  const openView = (p: Pedido) => { setViewingItem(p); setIsViewOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!idVenta)      newErrors.idVenta    = 'Campo requerido'
    if (!idServicio)   newErrors.idServicio = 'Campo requerido'
    if (!fecha.trim()) newErrors.fecha      = 'Campo requerido'
    if (!precio)       newErrors.precio     = 'Campo requerido'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setIsSubmitting(true)
    try {
      const data = {
        id_venta: Number(idVenta), id_servicio: Number(idServicio),
        id_marco: idMarco ? Number(idMarco) : null,
        id_estado: idEstado ? Number(idEstado) : (estados[0]?.id_estado ?? 1), fecha,
        precio: Number(precio), observacion, estado: true,
      }
      const err = editingId ? await onEdit(editingId, data) : await onCreate(data)
      if (err) { setActionError(err); return }
      toast.success(editingId ? 'Pedido actualizado' : 'Pedido registrado')
      setIsFormOpen(false); resetForm()
    } finally { setIsSubmitting(false) }
  }

  const handleCambiarEstado = async (id: number, id_estado: number) => {
    const err = await onChangeStatus(id, id_estado)
    if (err) setActionError(err)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-secondary">Servicios</h1>
  
          <p className="text-muted-foreground">Gestiona los servicios registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar venta, tipo de servicio, marco, fecha..." className="w-72" />
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Plus className="mr-2 h-4 w-4" />Registrar Servicio
          </Button>
        </div>
      </div>

      <FilterBar
        filters={[
          { key: 'estado', label: 'Estado', type: 'select', value: filterEstado, onChange: setFilterEstado,
            options: estados.map((e, i) => ({ value: String(e.id_estado), label: e.nombre })) },
        ]}
        onClear={() => setFilterEstado('')}
      />

      {actionError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)}>✕</button>
          </div>
        )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin registros" description="No hay pedidos registrados aún." />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
           
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[18%]">Venta</TableHead>
               
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Tipo de Servicio</TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[13%]">Marco</TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[11%]">Fecha</TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[10%]">Precio</TableHead>
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[18%]">Estado</TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[16%]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((p) => {
                const ventaLabel    = ventasOpts.find(o => o.value === String(p.id_venta))?.label ?? `#${p.id_venta}`
                const servicioLabel = serviciosOpts.find(o => o.value === String(p.id_servicio))?.label ?? `#${p.id_servicio}`
                const marcoLabel    = p.id_marco
                  ? (marcosOpts.find(o => o.value === String(p.id_marco))?.label ?? `#${p.id_marco}`)
                  : '—'
                const clienteNombre = rawVentas.find(rv => rv.id_venta === p.id_venta)?.client?.nombre ?? '—'
                return (
                  <TableRow key={p.id_detalle} className="hover:bg-muted/40 transition-colors border-border">
                    <TableCell className="text-foreground text-sm">
                      <div className="font-medium">{clienteNombre}</div>
                      <div className="text-xs text-muted-foreground">{ventaLabel}</div>
                    </TableCell>
                    <TableCell className="text-foreground">{servicioLabel}</TableCell>
                    <TableCell className="text-foreground">{marcoLabel}</TableCell>
                    <TableCell className="text-foreground">{formatDate(p.fecha)}</TableCell>
                    <TableCell className="text-foreground">{formatCurrency(p.precio)}</TableCell>
                    <TableCell>
                      {/* ── Dropdown dinámico con estados reales de BD ── */}
                      <Select
                        value={String(p.id_estado)}
                        onValueChange={(v) => handleCambiarEstado(p.id_detalle, Number(v))}
                      >
                        <SelectTrigger className="w-36 h-8 border-0 bg-transparent p-0 shadow-none focus:ring-0">
                          <Badge variant="outline" className={estadoColor(p.id_estado)}>
                            {estadoNombre(p.id_estado)}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {estados.map((e, i) => (
                            <SelectItem key={e.id_estado} value={String(e.id_estado)}>
                              <Badge variant="outline" className={badgeClass(i)}>{e.nombre}</Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(p)}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4 text-foreground" />
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
            page={page} totalPages={totalPages} total={total} pageSize={pageSize}
            onChange={setPage} onPageSizeChange={setPageSize} className="px-2 pb-2"
          />
        </div>
      )}

      {/* ── Ver detalle ──────────────────────────────────────────────────────── */}
      {viewingItem && (
        <ViewDialog
          open={isViewOpen} onOpenChange={setIsViewOpen}
          title={`Pedido #${viewingItem.id_detalle}`} description={viewingItem.fecha}
          fields={[
            { label: 'ID',          value: viewingItem.id_detalle },
            { label: 'Estado',      value: <Badge variant="outline" className={estadoColor(viewingItem.id_estado)}>{estadoNombre(viewingItem.id_estado)}</Badge> },
            { label: 'Venta',       value: ventasOpts.find(o => o.value === String(viewingItem.id_venta))?.label ?? `#${viewingItem.id_venta}`, fullWidth: true },
            { label: 'Servicio',    value: serviciosOpts.find(o => o.value === String(viewingItem.id_servicio))?.label ?? `#${viewingItem.id_servicio}` },
            { label: 'Marco',       value: viewingItem.id_marco ? (marcosOpts.find(o => o.value === String(viewingItem.id_marco))?.label ?? `#${viewingItem.id_marco}`) : '—' },
            { label: 'Fecha',       value: formatDate(viewingItem.fecha) },
            { label: 'Precio',      value: formatCurrency(viewingItem.precio) },
            { label: 'Observación', value: viewingItem.observacion, fullWidth: true },
          ]}
        />
      )}

      {/* ── Form crear/editar ─────────────────────────────────────────────────── */}
      <Dialog open={isFormOpen} onOpenChange={(v) => { setIsFormOpen(v); if (!v) resetForm() }}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-secondary">{editingId ? 'Editar Servicio' : 'Registrar Servicio'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Completa los datos del servicio.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            <div>
              <label className={labelCls} htmlFor="ped-venta">Venta <span className="text-destructive">*</span></label>
              <Combobox id="ped-venta" options={ventasOpts} value={idVenta} onValueChange={handleVentaChange} placeholder="Buscar venta..." searchPlaceholder="ID o fecha..." />
              {errors.idVenta && <p className="mt-1 text-xs text-destructive">{errors.idVenta}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="ped-servicio">Tipo de Servicio <span className="text-destructive">*</span></label>
              <Combobox id="ped-servicio" options={serviciosOpts} value={idServicio} onValueChange={(v) => { setIdServicio(v); if (errors.idServicio) setErrors({...errors, idServicio: ''}) }} placeholder="Buscar servicio..." searchPlaceholder="Nombre del servicio..." />
              {errors.idServicio && <p className="mt-1 text-xs text-destructive">{errors.idServicio}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="ped-marco">Marco (opcional)</label>
              <Combobox id="ped-marco" options={marcosOpts} value={idMarco} onValueChange={setIdMarco} placeholder="Seleccionar marco..." searchPlaceholder="Código del marco..." />
            </div>
          
            <div>
              <label className={labelCls} htmlFor="ped-fecha">Fecha <span className="text-destructive">*</span></label>
              <DatePicker
                id="ped-fecha"
                value={fecha}
                onChange={(v) => { setFecha(v); if (errors.fecha) setErrors({...errors, fecha: ''}) }}
                error={errors.fecha}
              />
              {errors.fecha && <p className="mt-1 text-xs text-destructive">{errors.fecha}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="ped-precio">Precio {!editingId && <span className="text-muted-foreground font-normal normal-case tracking-normal">(tomado de la venta)</span>}</label>
              <input
                id="ped-precio"
                type="number" step="0.01"
                value={precio}
                readOnly={!editingId}
                onChange={editingId ? (e) => { setPrecio(e.target.value); if (errors.precio) setErrors({...errors, precio: ''}) } : undefined}
                className={inputCls + (!editingId ? ' opacity-60 cursor-not-allowed' : '')}
                placeholder={!editingId ? 'Se completa al seleccionar la venta' : 'Ingrese el precio...'}
              />
              {errors.precio && <p className="mt-1 text-xs text-destructive">{errors.precio}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="ped-observacion">Observación (opcional)</label>
              <textarea id="ped-observacion" value={observacion} onChange={(e) => setObservacion(e.target.value)} className={inputCls + ' resize-none'} rows={3} placeholder='Detalles adicionales del pedido...'/>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button type="button" onClick={() => { setIsFormOpen(false); resetForm() }} className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50">
                {editingId ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}