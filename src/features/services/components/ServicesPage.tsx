// src/features/services/components/ServicesPage.tsx
import { useServices } from '../hooks/useServices'
import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Eye, AlertCircle, CalendarDays } from 'lucide-react'
import { Button }   from '@/src/shared/components/ui/button'
import { Input }    from '@/src/shared/components/ui/input'
import { Label }    from '@/src/shared/components/ui/label'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Switch }   from '@/src/shared/components/ui/switch'
import { Textarea } from '@/src/shared/components/ui/textarea'
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
          <h1 className="text-3xl font-bold text-foreground">Tipos de Servicio</h1>
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
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay servicios que coincidan." />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">ID</TableHead>
                  <TableHead className="text-muted-foreground">Nombre</TableHead>
                  <TableHead className="text-muted-foreground">Duración</TableHead>
                  <TableHead className="text-muted-foreground">Descripción</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-right text-muted-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(s => (
                  <TableRow key={s.id_servicio}>
                    <TableCell className="text-foreground">{s.id_servicio}</TableCell>
                    <TableCell className="text-foreground font-medium">{s.nombre}</TableCell>
                    <TableCell className="text-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        {fmtDuracion(s.duracion)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">{s.descripcion ?? '—'}</TableCell>
                    <TableCell>
                      <Switch checked={s.estado === true} onCheckedChange={async () => { await withToast(onToggleEstado(s.id_servicio), 'Estado actualizado') }} />
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
                              <AlertDialogTitle>¿Eliminar "{s.nombre}"?</AlertDialogTitle>
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
            <DialogTitle className="text-foreground">
              {editingId ? 'Editar Tipo de Servicio' : 'Registrar Tipo de Servicio'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              La duración estimada ayuda a planificar la entrega del pedido.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {errors._global && <p className="text-sm text-destructive">{errors._global}</p>}
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Nombre <span className="text-red-500">*</span></Label>
              <Input value={nombre}
                onChange={e => { setNombre(e.target.value); if (errors.nombre) setErrors(p => ({...p, nombre:''})) }}
                className="bg-card text-foreground border-border" />
              {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> Duración estimada (días) <span className="text-red-500">*</span>
              </Label>
              <Input type="number" min="1" step="1" value={duracionStr}
                onChange={e => { setDuracionStr(e.target.value); if (errors.duracion) setErrors(p => ({...p, duracion:''})) }}
                className="bg-card text-foreground border-border"
                placeholder="Ej: 7 (= 1 semana)" />
              {duracionStr && Number(duracionStr) > 0 && (
                <p className="text-xs text-muted-foreground">{fmtDuracion(Number(duracionStr))}</p>
              )}
              {errors.duracion && <p className="text-sm text-destructive">{errors.duracion}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Descripción (opcional)</Label>
              <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                className="bg-card text-foreground border-border" rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); resetForm() }}
                className="border-border text-foreground">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editingId ? 'Guardar cambios' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}