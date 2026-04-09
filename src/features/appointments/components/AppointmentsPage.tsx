// src/features/appointments/components/AppointmentsPage.tsx
import { useAppointments } from '../hooks/useAppointments'
import { useServicesOptions, useFrameOptions } from '@/src/shared/hooks/useOptions'
import { apiRequest } from '@/src/shared/lib/apiClient'
import { useClientsOptions } from '@/src/shared/hooks/useOptions'
import { useState, useMemo, useCallback } from 'react'
import { SearchInput }   from '@/src/shared/components/SearchInput'
import { Pagination }    from '@/src/shared/components/Pagination'
import { usePagination } from '@/src/shared/hooks/usePagination'
import { FilterBar } from '@/src/shared/components/FilterBar'
import { withToast } from '@/src/shared/lib/withToast'   
import { formatDate, formatTime } from '@/src/shared/lib/formatDate'
import { Plus, Pencil, Eye, ShoppingCart, PlusCircle, Trash } from 'lucide-react'
import { Button } from '@/src/shared/components/ui/button'
import { Input } from '@/src/shared/components/ui/input'
import { Badge } from '@/src/shared/components/ui/badge'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/shared/components/ui/select'
import { TimePicker, BookedSlot } from '@/src/shared/components/TimePicker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/shared/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { ViewDialog } from '@/src/shared/components/ViewDialog'
import { Combobox } from '@/src/shared/components/Combobox'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { DatePicker } from '@/src/shared/components/DatePicker'

type Cita = { id_cita: number; fecha: string; hora: string; id_estado_cita: number; id_cliente: number }

const inputCls  = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
const labelCls  = 'block text-xs font-bold capitalize tracking-widest text-muted-foreground mb-2'
const selectCls = 'w-full bg-muted border-0 border-b-2 border-transparent data-[state=open]:border-secondary !h-auto rounded-t-lg px-4 py-3 text-sm shadow-none focus-visible:ring-0 focus-visible:border-secondary'

const ESTADO_BADGE: Record<number, string> = {
  1: 'border-amber-300 bg-amber-100 text-amber-800',
  2: 'border-blue-300 bg-blue-100 text-blue-800',
  3: 'border-emerald-300 bg-emerald-100 text-emerald-800',
  4: 'border-slate-300 bg-slate-100 text-slate-600',
}

export function AppointmentsPage() {
  const { citas, estadosCita, isLoading, onCreate, onEdit, onChangeStatus, refresh } = useAppointments()
  const { options: clientesOpts }  = useClientsOptions()
  const { options: serviciosOpts } = useServicesOptions()
  const { options: marcosOpts }    = useFrameOptions()

  const [q,            setQ]            = useState('')
  const [filterEstado, setFilterEstado] = useState('')

  const ESTADO_ORDER: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3 }

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return citas.filter(c => {
      const clienteLabel = clientesOpts.find(o => o.value === String(c.id_cliente))?.label ?? ''
      const matchQ       = !s ||
        String(c.id_cita).includes(s) ||
        c.fecha.includes(s) ||
        c.hora.includes(s) ||
        clienteLabel.toLowerCase().includes(s)
      const matchEstado  = !filterEstado || String(c.id_estado_cita) === filterEstado
      return matchQ && matchEstado
    }).sort((a, b) => {
      // 1. Fecha (más reciente primero)
      const fechaCmp = b.fecha.localeCompare(a.fecha)
      if (fechaCmp !== 0) return fechaCmp
      // 2. Estado: Pendiente → Completada → No asistió → Cancelada
      return (ESTADO_ORDER[a.id_estado_cita] ?? 9) - (ESTADO_ORDER[b.id_estado_cita] ?? 9)
    })
  }, [citas, clientesOpts, q, filterEstado])

  const { paginated, page, setPage, totalPages, total, pageSize, setPageSize } = usePagination(filtered)

  // ── Form cita ──────────────────────────────────────────────────────────────
  const [isFormOpen,   setIsFormOpen]   = useState(false)
  const [isViewOpen,   setIsViewOpen]   = useState(false)
  const [editingId,    setEditingId]    = useState<number | null>(null)
  const [viewingItem,  setViewingItem]  = useState<Cita | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [idCliente,    setIdCliente]    = useState('')
  const [fecha,        setFecha]        = useState('')
  const [hora,         setHora]         = useState('')
  const [idEstado,     setIdEstado]     = useState('')
  const [errors,       setErrors]       = useState<Record<string, string>>({})

  // ── Modal Crear Venta ──────────────────────────────────────────────────────
  type VentaLinea = { id: number; id_servicio: string; id_marco: string; precio: string; observacion: string }
  type VentaMsg   = { tipo: 'ok' | 'err'; texto: string }

  const [ventaModalCita, setVentaModalCita] = useState<Cita | null>(null)
  const [ventaLineas,    setVentaLineas]    = useState<VentaLinea[]>([])
  const [ventaObs,       setVentaObs]       = useState('')
  const [ventaErrors,    setVentaErrors]    = useState<Record<string, string>>({})
  const [isCreandoVenta, setIsCreandoVenta] = useState(false)
  const [ventaMsg,       setVentaMsg]       = useState<VentaMsg | null>(null)

  const lineaVacia = useCallback((id: number): VentaLinea =>
    ({ id, id_servicio: '', id_marco: '', precio: '', observacion: '' }), [])

  const openVentaModal = (cita: Cita) => {
    setVentaModalCita(cita)
    setVentaLineas([lineaVacia(Date.now())])
    setVentaObs('')
    setVentaErrors({})
    setVentaMsg(null)
  }

  const addLinea    = () => setVentaLineas(p => [...p, lineaVacia(Date.now())])
  const removeLinea = (id: number) => setVentaLineas(p => p.filter(l => l.id !== id))
  const updateLinea = (id: number, field: string, value: string) =>
    setVentaLineas(p => p.map(l => l.id === id ? { ...l, [field]: value } : l))

  const totalVenta = ventaLineas.reduce((sum, l) => sum + (Number(l.precio) || 0), 0)
  const fmt        = (v: number) => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })

  const handleCrearVenta = async () => {
    const errs: Record<string, string> = {}
    ventaLineas.forEach((l, i) => {
      if (!l.id_servicio) errs[`servicio_${i}`] = 'Requerido'
      if (!l.precio || isNaN(Number(l.precio)) || Number(l.precio) <= 0)
        errs[`precio_${i}`] = 'Precio inválido'
    })
    if (Object.keys(errs).length) { setVentaErrors(errs); return }
    if (!ventaModalCita) return

    setIsCreandoVenta(true); setVentaMsg(null)
    try {
      await apiRequest(`/api/appointments/${ventaModalCita.id_cita}/create-sale`, {
        method: 'POST',
        body: JSON.stringify({
          observacion: ventaObs || undefined,
          servicios: ventaLineas.map(l => ({
            id_servicio: Number(l.id_servicio),
            id_marco:    l.id_marco ? Number(l.id_marco) : null,
            precio:      Number(l.precio),
            observacion: l.observacion || undefined,
          })),
        }),
      })
      setVentaMsg({ tipo: 'ok', texto: `Venta creada por ${fmt(totalVenta)}. La cita pasó a Completada.` })
      await refresh()
      setTimeout(() => setVentaModalCita(null), 1800)
    } catch (e) {
      setVentaMsg({ tipo: 'err', texto: e instanceof Error ? e.message : 'Error al crear la venta' })
    } finally {
      setIsCreandoVenta(false)
    }
  }

  // ── Form helpers ───────────────────────────────────────────────────────────
  const todayStr   = () => new Date().toISOString().slice(0, 10)
  const resetForm  = () => { setIdCliente(''); setFecha(''); setHora(''); setIdEstado(''); setErrors({}); setEditingId(null) }
  const openCreate = () => { resetForm(); setIdEstado('1'); setFecha(todayStr()); setIsFormOpen(true) }
  const openEdit   = (c: Cita) => { setEditingId(c.id_cita); setIdCliente(String(c.id_cliente)); setFecha(c.fecha); setHora(c.hora); setIdEstado(String(c.id_estado_cita)); setErrors({}); setIsFormOpen(true) }
  const openView   = (c: Cita) => { setViewingItem(c); setIsViewOpen(true) }

  const getEstadoLabel = (id: number) => estadosCita.find(e => e.id_estado_cita === id)?.nombre ?? `Estado ${id}`
  const validateFecha  = (f: string) => { const t = new Date(); t.setHours(0,0,0,0); return new Date(f) >= t }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!idCliente)    newErrors.idCliente = 'Campo requerido'
    if (!fecha.trim()) newErrors.fecha = 'Campo requerido'
    else if (!validateFecha(fecha)) newErrors.fecha = 'La fecha no puede ser en el pasado'
    if (!hora.trim()) {
      newErrors.hora = 'Campo requerido'
    } else {
      const h = Number(hora.split(':')[0])
      if (h < 13 || h >= 18) newErrors.hora = 'La hora debe estar entre 13:00 y 18:00'
    }
    if (!idEstado) newErrors.idEstado = 'Campo requerido'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setIsSubmitting(true)
    try {
      const data = { id_cliente: Number(idCliente), fecha, hora, id_estado_cita: Number(idEstado) }
      await withToast(
        editingId ? onEdit(editingId, data) : onCreate(data),
        editingId ? 'Cita actualizada' : 'Cita registrada'
      )
      setIsFormOpen(false); resetForm()
    } catch { } finally { setIsSubmitting(false) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-secondary">Citas</h1>
            <p className="text-muted-foreground">Gestiona las citas programadas</p>
          </div>
          <div className="flex items-center gap-2">  
            <SearchInput value={q} onChange={setQ} placeholder="Buscar por fecha, hora o #cita..." className="w-64" />
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />Registrar Cita
          </Button>
          </div>
        
        </div>

        <FilterBar
          filters={[
            { key: 'estado', label: 'Estado', type: 'select', value: filterEstado, onChange: setFilterEstado,
              options: estadosCita.map(e => ({ value: String(e.id_estado_cita), label: e.nombre })) },
          ]}
          onClear={() => setFilterEstado('')}
        />

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}
          </div>
        ) : citas.length === 0 ? (
          <EmptyState title="Sin registros" description="No hay citas registradas aún." />
        ) : (
          <div className="flex flex-col gap-2">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
               
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[34%]">Cliente</TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Fecha</TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[12%]">Hora</TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[20%]">Estado</TableHead>
                  <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[20%]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c) => {
                  const clienteLabel = clientesOpts.find(o => o.value === String(c.id_cliente))?.label ?? `#${c.id_cliente}`
                  return (
                    <TableRow key={c.id_cita} className="hover:bg-muted/40 transition-colors border-border">
                    
                      <TableCell className="text-foreground">{clienteLabel}</TableCell>
                      <TableCell className="text-foreground">{formatDate(c.fecha)}</TableCell>
                      <TableCell className="text-foreground">{formatTime(c.hora)}</TableCell>
                      <TableCell>
                        <Select value={String(c.id_estado_cita)} onValueChange={(v) => onChangeStatus(c.id_cita, Number(v))}>
                          <SelectTrigger className="w-36 h-8">
                            <Badge variant="outline" className={ESTADO_BADGE[c.id_estado_cita] ?? ESTADO_BADGE[4]}>
                              {getEstadoLabel(c.id_estado_cita)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {estadosCita.map(e => (
                              <SelectItem key={e.id_estado_cita} value={String(e.id_estado_cita)}>{e.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openView(c)}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4 text-foreground" />
                          </Button>
                          {c.id_estado_cita !== 4 && (
                            <Button variant="ghost" size="icon" title="Crear venta" onClick={() => openVentaModal(c)}>
                              <ShoppingCart className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
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
      </div>

      {/* ── ViewDialog ──────────────────────────────────────────────────────── */}
      {viewingItem && (
        <ViewDialog
          open={isViewOpen} onOpenChange={setIsViewOpen}
          title={`Cita #${viewingItem.id_cita}`}
          description={`${viewingItem.fecha} — ${viewingItem.hora}`}
          fields={[
            { label: 'ID',      value: viewingItem.id_cita },
            { label: 'Estado',  value: <Badge variant="outline" className={ESTADO_BADGE[viewingItem.id_estado_cita] ?? ESTADO_BADGE[4]}>{getEstadoLabel(viewingItem.id_estado_cita)}</Badge> },
            { label: 'Cliente', value: clientesOpts.find(o => o.value === String(viewingItem.id_cliente))?.label ?? `#${viewingItem.id_cliente}`, fullWidth: true },
            { label: 'Fecha',   value: formatDate(viewingItem.fecha) },
            { label: 'Hora',    value: formatTime(viewingItem.hora) },
          ]}
        />
      )}

      {/* ── Dialog Form Cita ────────────────────────────────────────────────── */}
      <Dialog open={isFormOpen} onOpenChange={(v) => { setIsFormOpen(v); if (!v) resetForm() }}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-secondary">{editingId ? 'Editar Cita' : 'Registrar Cita'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Completa los datos de la cita.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            <div>
              <label className={labelCls} htmlFor="cita-cliente">Cliente <span className="text-destructive">*</span></label>
              <Combobox
                id="cita-cliente"
                options={clientesOpts} value={idCliente}
                onValueChange={(v) => { setIdCliente(v); if (errors.idCliente) setErrors({...errors, idCliente: ''}) }}
                placeholder="Buscar cliente..." searchPlaceholder="Nombre o documento..."
              />
              {errors.idCliente && <p className="mt-1 text-xs text-destructive">{errors.idCliente}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="cita-fecha">Fecha <span className="text-destructive">*</span></label>
              <DatePicker
                id="cita-fecha"
                value={fecha}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(v) => { setFecha(v); if (errors.fecha) setErrors({...errors, fecha: ''}) }}
                error={errors.fecha}
              />
              {errors.fecha && <p className="mt-1 text-xs text-destructive">{errors.fecha}</p>}
            </div>
            <TimePicker
              value={hora}
              onChange={(v) => { setHora(v); if (errors.hora) setErrors({...errors, hora: ''}) }}
              error={errors.hora}
              bookedSlots={
                fecha
                  ? (citas as any[])
                      .filter((c: any) => c.fecha === fecha && c.id_cita !== editingId)
                      .map((c: any): BookedSlot => ({ hora: c.hora, clienteNombre: c.clienteNombre, id_cita: c.id_cita }))
                  : []
              }
            />
            <div>
              <label className={labelCls} htmlFor="cita-estado">Estado <span className="text-destructive">*</span></label>
              <Select value={idEstado} onValueChange={(v) => { setIdEstado(v); if (errors.idEstado) setErrors({...errors, idEstado: ''}) }}>
                <SelectTrigger id="cita-estado" className={selectCls}>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {estadosCita.map(e => <SelectItem key={e.id_estado_cita} value={String(e.id_estado_cita)}>{e.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.idEstado && <p className="mt-1 text-xs text-destructive">{errors.idEstado}</p>}
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

      {/* ── Modal Crear Venta desde Cita ─────────────────────────────────────── */}
      <Dialog open={ventaModalCita !== null} onOpenChange={v => { if (!v) setVentaModalCita(null) }}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
              Crear venta — Cita #{ventaModalCita?.id_cita}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {ventaModalCita != null
                ? `${clientesOpts.find(o => o.value === String(ventaModalCita.id_cliente))?.label ?? 'Cliente'} · ${ventaModalCita.fecha} ${ventaModalCita.hora}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 mt-2">
            {/* Mensaje resultado */}
            {ventaMsg !== null && (
              <div className={`rounded-lg border px-4 py-3 text-sm ${
                ventaMsg.tipo === 'ok'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-destructive/40 bg-destructive/10 text-destructive'
              }`}>
                {ventaMsg.texto}
              </div>
            )}

            {/* Líneas de servicio */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className={labelCls}>Servicios</span>
                <Button type="button" variant="outline" size="sm" onClick={addLinea} className="gap-1 h-7 text-xs">
                  <PlusCircle className="h-3.5 w-3.5" />Agregar servicio
                </Button>
              </div>

              {ventaLineas.map((linea, i) => (
                <div key={linea.id} className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg border border-border bg-background">
                  <div className="col-span-4 flex flex-col gap-1">
                    <label className="block text-xs text-muted-foreground mb-0.5" htmlFor={`srv-svc-${i}`}>Tipo de Servicio <span className="text-destructive">*</span></label>
                    <select
                      id={`srv-svc-${i}`}
                      value={linea.id_servicio}
                      onChange={e => updateLinea(linea.id, 'id_servicio', e.target.value)}
                      className="flex h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Seleccionar...</option>
                      {serviciosOpts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    {ventaErrors[`servicio_${i}`] && <p className="text-[10px] text-destructive">{ventaErrors[`servicio_${i}`]}</p>}
                  </div>
                  <div className="col-span-3 flex flex-col gap-1">
                    <label className="block text-xs text-muted-foreground mb-0.5" htmlFor={`srv-marco-${i}`}>Marco (opcional)</label>
                    <select
                      id={`srv-marco-${i}`}
                      value={linea.id_marco}
                      onChange={e => updateLinea(linea.id, 'id_marco', e.target.value)}
                      className="flex h-8 w-full rounded-md border border-border bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Sin marco</option>
                      {marcosOpts.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3 flex flex-col gap-1">
                    <label className="block text-xs text-muted-foreground mb-0.5" htmlFor={`srv-precio-${i}`}>Precio (COP) <span className="text-destructive">*</span></label>
                    <Input
                      id={`srv-precio-${i}`}
                      type="number" min="0" placeholder="0"
                      value={linea.precio}
                      onChange={e => updateLinea(linea.id, 'precio', e.target.value)}
                      className="h-8 text-xs bg-card border-border"
                    />
                    {ventaErrors[`precio_${i}`] && <p className="text-[10px] text-destructive">{ventaErrors[`precio_${i}`]}</p>}
                  </div>
                  <div className="col-span-2 flex items-end pb-0.5">
                    <Button
                      type="button" variant="ghost" size="icon"
                      disabled={ventaLineas.length === 1}
                      onClick={() => removeLinea(linea.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="col-span-12 flex flex-col gap-1">
                    <Input
                      placeholder="Observación de este servicio (opcional)"
                      value={linea.observacion}
                      onChange={e => updateLinea(linea.id, 'observacion', e.target.value)}
                      className="h-7 text-xs bg-card border-border"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Observación general */}
            <div>
              <label className={labelCls} htmlFor="venta-obs">Observación general (opcional)</label>
              <textarea
                id="venta-obs"
                value={ventaObs}
                onChange={e => setVentaObs(e.target.value)}
                placeholder="Notas sobre la venta..."
                className="w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm resize-none"
                rows={2}
              />
            </div>

            {/* Total + confirmar */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">{fmt(totalVenta)}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setVentaModalCita(null)} disabled={isCreandoVenta} className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCrearVenta}
                  disabled={isCreandoVenta || ventaMsg?.tipo === 'ok'}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-all disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isCreandoVenta ? 'Creando...' : 'Crear venta'}
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}