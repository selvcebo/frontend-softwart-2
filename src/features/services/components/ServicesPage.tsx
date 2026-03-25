// src/features/services/components/ServicesPage.tsx
import { useServices } from '../hooks/useServices'
import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Eye, AlertCircle, CalendarDays } from 'lucide-react'
import { Button }   from '@/src/shared/components/ui/button'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Switch }   from '@/src/shared/components/ui/switch'
import { Alert, AlertDescription } from '@/src/shared/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/src/shared/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/src/shared/components/ui/alert-dialog'
import { ViewDialog, EstadoBadge } from '@/src/shared/components/ViewDialog'
import { EmptyState }    from '@/src/shared/components/EmptyState'
import { SearchInput }   from '@/src/shared/components/SearchInput'
import { FilterBar }     from '@/src/shared/components/FilterBar'
import { Pagination }    from '@/src/shared/components/Pagination'
import { usePagination } from '@/src/shared/hooks/usePagination'
import { withToast }     from '@/src/shared/lib/withToast'

type Servicio = { id_servicio: number; nombre: string; descripcion?: string; duracion: number; estado: boolean }

const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
const labelCls = 'block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2'

// duracion ahora es en días
const fmtDuracion = (dias: number) => {
  if (!dias) return '—'
  return dias === 1 ? '1 día' : `${dias} días`
}

export function ServicesPage() {
  const { servicios, isLoading, onCrear, onEditar, onEliminar, onToggleEstado } = useServices()

  // ── Búsqueda y filtros ─────────────────────────────────────────────────────
  const [q,            setQ]            = useState('')
  const [filterEstado, setFilterEstado] = useState('')

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return servicios.filter(sv => {
      const matchQ      = !s || sv.nombre.toLowerCase().includes(s) || (sv.descripcion ?? '').toLowerCase().includes(s)
      const matchEstado = !filterEstado || (filterEstado === 'activo' ? sv.estado : !sv.estado)
      return matchQ && matchEstado
    })
  }, [servicios, q, filterEstado])

  const { paginated, page, setPage, totalPages, total, pageSize, setPageSize } = usePagination(filtered)

  // ── Form ───────────────────────────────────────────────────────────────────
  const [isFormOpen,   setIsFormOpen]   = useState(false)
  const [isViewOpen,   setIsViewOpen]   = useState(false)
  const [editingId,    setEditingId]    = useState<number | null>(null)
  const [viewingItem,  setViewingItem]  = useState<Servicio | null>(null)
  const [deleteError,  setDeleteError]  = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nombre,       setNombre]       = useState('')
  const [descripcion,  setDescripcion]  = useState('')
  const [duracionStr,  setDuracionStr]  = useState('')
  const [errors,       setErrors]       = useState<Record<string, string>>({})

  const resetForm  = () => { setNombre(''); setDescripcion(''); setDuracionStr(''); setErrors({}); setEditingId(null) }
  const openCreate = () => { resetForm(); setIsFormOpen(true) }
  const openEdit   = (s: Servicio) => {
    setEditingId(s.id_servicio); setNombre(s.nombre)
    setDescripcion(s.descripcion ?? ''); setDuracionStr(String(s.duracion))
    setErrors({}); setIsFormOpen(true)
  }
  const openView = (s: Servicio) => { setViewingItem(s); setIsViewOpen(true) }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!nombre.trim())      e.nombre   = 'Campo requerido'
    if (!duracionStr.trim()) e.duracion = 'Campo requerido'
    else if (Number(duracionStr) <= 0) e.duracion = 'Debe ser mayor a 0'
    return e
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate(); if (Object.keys(e).length) { setErrors(e); return }
    setIsSubmitting(true)
    try {
      const data = { nombre, descripcion, duracion: Number(duracionStr), estado: true }
      await withToast(
        editingId ? onEditar(editingId, data) : onCrear(data),
        editingId ? 'Servicio actualizado' : 'Servicio registrado'
      )
      setIsFormOpen(false); resetForm()
    } catch { setErrors({ _global: 'Ocurrió un error. Intenta de nuevo.' }) }
    finally { setIsSubmitting(false) }
  }

  const handleDelete = async (id: number, nombreServicio: string) => {
    setDeleteError(null)
    try {
      await withToast(onEliminar(id), `Servicio "${nombreServicio}" eliminado`)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'No se pudo eliminar')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-secondary">Tipos de Servicio</h1>
          <p className="text-muted-foreground">Gestiona los tipos de servicio disponibles</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar nombre o descripción..." className="w-64" />
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Plus className="mr-2 h-4 w-4" />Registrar Tipo
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

      {deleteError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{deleteError}</span>
            <Button variant="ghost" size="sm" onClick={() => setDeleteError(null)} className="ml-2 h-auto p-0 text-destructive">✕</Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay servicios que coincidan." />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[18%]">Nombre</TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[10%]">Duración</TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[36%]">Descripción</TableHead>
                  <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[12%]">Estado</TableHead>
                  <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[24%]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(s => (
                  <TableRow key={s.id_servicio} className="hover:bg-muted/40 transition-colors border-border">
             
                    <TableCell className="text-foreground font-medium">{s.nombre}</TableCell>
                    <TableCell className="text-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        {fmtDuracion(s.duracion)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{s.descripcion ?? '—'}</TableCell>
                    <TableCell>
                      <div className='flex justify-end'>
                      <Switch checked={s.estado === true} onCheckedChange={async () => { await withToast(onToggleEstado(s.id_servicio), 'Estado actualizado') }} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(s)}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4 text-foreground" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card text-card-foreground border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-serif text-secondary">¿Eliminar "{s.nombre}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Si este servicio está vinculado a pedidos existentes
                                <strong className="text-destructive"> no podrá eliminarse</strong>.
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground"
                                onClick={() => handleDelete(s.id_servicio, s.nombre)}>
                                Intentar eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize}
            onChange={setPage} onPageSizeChange={setPageSize} className="px-2 pb-2" />
        </div>
      )}

      {viewingItem && (
        <ViewDialog open={isViewOpen} onOpenChange={setIsViewOpen}
          title={`Servicio — ${viewingItem.nombre}`} description={`Registro #${viewingItem.id_servicio}`}
          fields={[
            { label: 'ID',          value: viewingItem.id_servicio },
            { label: 'Estado',      value: <EstadoBadge estado={viewingItem.estado} /> },
            { label: 'Nombre',      value: viewingItem.nombre,       fullWidth: true },
            { label: 'Duración',    value: fmtDuracion(viewingItem.duracion) },
            { label: 'Descripción', value: viewingItem.descripcion,  fullWidth: true },
          ]} />
      )}

      <Dialog open={isFormOpen} onOpenChange={v => { setIsFormOpen(v); if (!v) resetForm() }}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-secondary">
              {editingId ? 'Editar Tipo de Servicio' : 'Registrar Tipo de Servicio'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              La duración estimada ayuda a planificar la entrega del pedido.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            {errors._global && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{errors._global}</p>}
            <div>
              <label className={labelCls} htmlFor="srv-nombre">Nombre <span className="text-destructive">*</span></label>
              <input id="srv-nombre" value={nombre} placeholder="Ej: Enmarcado simple"
                onChange={e => { setNombre(e.target.value); if (errors.nombre) setErrors(p => ({...p, nombre:''})) }}
                className={inputCls} />
              {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="srv-duracion">
                Duración estimada (días) <span className="text-destructive">*</span>
              </label>
              <input id="srv-duracion" type="number" min="1" step="1" value={duracionStr}
                onChange={e => { setDuracionStr(e.target.value); if (errors.duracion) setErrors(p => ({...p, duracion:''})) }}
                className={inputCls}
                placeholder="Ej: 7 (= 1 semana)" />
              {duracionStr && Number(duracionStr) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{fmtDuracion(Number(duracionStr))}</p>
              )}
              {errors.duracion && <p className="mt-1 text-xs text-destructive">{errors.duracion}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="srv-descripcion">Descripción (opcional)</label>
              <textarea id="srv-descripcion" value={descripcion} placeholder="Descripción del servicio..." onChange={e => setDescripcion(e.target.value)}
                className={`${inputCls} resize-none`} rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button type="button" onClick={() => { setIsFormOpen(false); resetForm() }}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors">Cancelar</button>
              <button type="submit" disabled={isSubmitting}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50">
                {editingId ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}