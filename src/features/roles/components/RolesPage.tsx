// src/features/roles/components/RolesPage.tsx
import { useRoles } from '../hooks/useRoles'
import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { Button }   from '@/src/shared/components/ui/button'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Switch }   from '@/src/shared/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/shared/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/src/shared/components/ui/alert-dialog'
import { ViewDialog, EstadoBadge } from '@/src/shared/components/ViewDialog'
import { EmptyState }    from '@/src/shared/components/EmptyState'
import { SearchInput }   from '@/src/shared/components/SearchInput'
import { FilterBar }     from '@/src/shared/components/FilterBar'
import { Pagination }    from '@/src/shared/components/Pagination'
import { usePagination } from '@/src/shared/hooks/usePagination'
import { withToast }     from '@/src/shared/lib/withToast'

type Rol = { id_rol: number; nombre: string; descripcion?: string; estado: boolean }

const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
const labelCls = 'block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2'

export function RolesPage() {
  const { roles, isLoading, onCrear, onEditar, onEliminar, onToggleEstado } = useRoles()

  // ── Búsqueda y filtros ─────────────────────────────────────────────────────
  const [q,            setQ]            = useState('')
  const [filterEstado, setFilterEstado] = useState('')

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return roles.filter(r => {
      const matchQ      = !s || r.nombre.toLowerCase().includes(s) || (r.descripcion ?? '').toLowerCase().includes(s)
      const matchEstado = !filterEstado || (filterEstado === 'activo' ? r.estado : !r.estado)
      return matchQ && matchEstado
    })
  }, [roles, q, filterEstado])

  const { paginated, page, setPage, totalPages, total, pageSize, setPageSize } = usePagination(filtered)

  // ── Form ───────────────────────────────────────────────────────────────────
  const [isFormOpen,   setIsFormOpen]   = useState(false)
  const [isViewOpen,   setIsViewOpen]   = useState(false)
  const [editingId,    setEditingId]    = useState<number | null>(null)
  const [viewingItem,  setViewingItem]  = useState<Rol | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nombre,       setNombre]       = useState('')
  const [descripcion,  setDescripcion]  = useState('')
  const [errors,       setErrors]       = useState<Record<string, string>>({})

  const resetForm  = () => { setNombre(''); setDescripcion(''); setErrors({}); setEditingId(null) }
  const openCreate = () => { resetForm(); setIsFormOpen(true) }
  const openEdit   = (r: Rol) => { setEditingId(r.id_rol); setNombre(r.nombre); setDescripcion(r.descripcion ?? ''); setErrors({}); setIsFormOpen(true) }
  const openView   = (r: Rol) => { setViewingItem(r); setIsViewOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) { setErrors({ nombre: 'Campo requerido' }); return }
    setIsSubmitting(true)
    try {
      await withToast(
        editingId ? onEditar(editingId, { nombre, descripcion }) : onCrear({ nombre, descripcion, estado: true }),
        editingId ? 'Rol actualizado' : 'Rol registrado'
      )
      setIsFormOpen(false); resetForm()
    } catch { } finally { setIsSubmitting(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-secondary">Roles</h1>
          <p className="text-muted-foreground">Gestiona los roles del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar nombre o descripción..." className="w-64" />
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Plus className="mr-2 h-4 w-4" />Registrar Rol
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
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay roles que coincidan." />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
            
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[22%]">Nombre</TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[42%]">Descripción</TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Estado</TableHead>
                  <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[22%]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((r) => (
                  <TableRow key={r.id_rol} className="hover:bg-muted/40 transition-colors border-border">
          
                    <TableCell className="text-foreground font-medium">{r.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{r.descripcion ?? '—'}</TableCell>
                    <TableCell><Switch checked={r.estado} onCheckedChange={async () => { await withToast(onToggleEstado(r.id_rol), 'Estado actualizado') }} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(r)}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4 text-foreground" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent className="bg-card text-card-foreground border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-serif text-secondary">¿Eliminar rol "{r.nombre}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Si este rol tiene usuarios asignados no podrá eliminarse. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground"
                                onClick={async () => { await withToast(onEliminar(r.id_rol), 'Rol eliminado') }}>
                                Eliminar
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
          title={`Rol — ${viewingItem.nombre}`} description={`Registro #${viewingItem.id_rol}`}
          fields={[
            { label: 'ID',          value: viewingItem.id_rol },
            { label: 'Estado',      value: <EstadoBadge estado={viewingItem.estado} /> },
            { label: 'Nombre',      value: viewingItem.nombre,      fullWidth: true },
            { label: 'Descripción', value: viewingItem.descripcion, fullWidth: true },
          ]} />
      )}

      <Dialog open={isFormOpen} onOpenChange={(v) => { setIsFormOpen(v); if (!v) resetForm() }}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-secondary">{editingId ? 'Editar Rol' : 'Registrar Rol'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Completa los datos del rol.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            <div>
              <label className={labelCls}>Nombre <span className="text-destructive">*</span></label>
              <input value={nombre} placeholder="Ej: Administrador" onChange={e => { setNombre(e.target.value); if (errors.nombre) setErrors({}) }}
                className={inputCls} />
              {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>}
            </div>
            <div>
              <label className={labelCls}>Descripción (opcional)</label>
              <input value={descripcion} placeholder="Descripción del rol..." onChange={e => setDescripcion(e.target.value)}
                className={inputCls} />
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