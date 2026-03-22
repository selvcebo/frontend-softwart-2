// src/features/users/components/UsersPage.tsx
import { useUsers } from '../hooks/useUsers'
import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { Button }   from '@/src/shared/components/ui/button'
import { Input }    from '@/src/shared/components/ui/input'
import { Label }    from '@/src/shared/components/ui/label'
import { Badge }    from '@/src/shared/components/ui/badge'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Switch }   from '@/src/shared/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/shared/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/src/shared/components/ui/alert-dialog'
import { ViewDialog, EstadoBadge } from '@/src/shared/components/ViewDialog'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { withToast } from '@/src/shared/lib/withToast'   
import { SearchInput }  from '@/src/shared/components/SearchInput'
import { FilterBar }    from '@/src/shared/components/FilterBar'
import { usePagination } from '@/src/shared/hooks/usePagination'
import { Pagination } from '@/src/shared/components/Pagination'

type Usuario = { id_usuario: number; correo: string; clave: string; estado: boolean; id_rol: number }
type CreateUsuarioDto = Omit<Usuario, 'id_usuario'>
type UpdateUsuarioDto = Omit<Partial<CreateUsuarioDto>, 'clave'>

const ROL_LABELS: Record<number, string> = { 1: 'Admin', 2: 'Empleado', 3: 'Cliente' }
const getRolBadgeClass = (id_rol: number) => {
  switch (id_rol) {
    case 1: return 'border-violet-300 bg-violet-100 text-violet-800'
    case 2: return 'border-blue-300 bg-blue-100 text-blue-800'
    case 3: return 'border-emerald-300 bg-emerald-100 text-emerald-800'
    default: return 'border-border bg-muted text-muted-foreground'
  }
}

export function UsersPage() {
  const { usuarios, isLoading, onCrear, onEditar, onEliminar, onToggleEstado } = useUsers()

  // ── Búsqueda y filtros ─────────────────────────────────────────────────────
  const [q,           setQ]           = useState('')
  const [filterRol,   setFilterRol]   = useState('')
  const [filterEstado, setFilterEstado] = useState('')

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return usuarios.filter(u => {
      const matchQ = !s ||
        u.correo.toLowerCase().includes(s) ||
        ROL_LABELS[u.id_rol]?.toLowerCase().includes(s)
      const matchRol    = !filterRol    || String(u.id_rol) === filterRol
      const matchEstado = !filterEstado || (filterEstado === 'activo' ? u.estado : !u.estado)
      return matchQ && matchRol && matchEstado
    })
  }, [usuarios, q, filterRol, filterEstado])

  const { paginated, page, setPage, totalPages, total, pageSize, setPageSize } = usePagination(filtered)

  // ── Form ───────────────────────────────────────────────────────────────────
  const [isFormOpen,   setIsFormOpen]   = useState(false)
  const [isViewOpen,   setIsViewOpen]   = useState(false)
  const [editingId,    setEditingId]    = useState<number | null>(null)
  const [viewingItem,  setViewingItem]  = useState<Usuario | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [correo, setCorreo] = useState('')
  const [clave,  setClave]  = useState('')
  const [idRol,  setIdRol]  = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resetForm  = () => { setCorreo(''); setClave(''); setIdRol(''); setErrors({}); setEditingId(null) }
  const openCreate = () => { resetForm(); setIsFormOpen(true) }
  const openEdit   = (u: Usuario) => { setEditingId(u.id_usuario); setCorreo(u.correo); setClave(''); setIdRol(String(u.id_rol)); setErrors({}); setIsFormOpen(true) }
  const openView   = (u: Usuario) => { setViewingItem(u); setIsViewOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!correo.trim())              newErrors.correo = 'Campo requerido'
    if (!editingId && !clave.trim()) newErrors.clave  = 'Campo requerido'
    if (!idRol)                      newErrors.idRol  = 'Campo requerido'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setIsSubmitting(true)
    try {
      await withToast(
        editingId
          ? onEditar(editingId, { correo, id_rol: Number(idRol) } as UpdateUsuarioDto)
          : onCrear({ correo, clave, id_rol: Number(idRol), estado: true } as CreateUsuarioDto),
        editingId ? 'Usuario actualizado' : 'Usuario registrado'
      )
      setIsFormOpen(false); resetForm()
    } catch { } finally { setIsSubmitting(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar por correo o rol..." className="w-64" />
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Plus className="mr-2 h-4 w-4" />Registrar Usuario
          </Button>
        </div>
      </div>

      {/* FilterBar */}
      <FilterBar
        filters={[
          { key: 'rol', label: 'Rol', type: 'select', value: filterRol, onChange: setFilterRol,
            options: [{ value: '1', label: 'Admin' }, { value: '2', label: 'Empleado' }, { value: '3', label: 'Cliente' }] },
          { key: 'estado', label: 'Estado', type: 'chips', value: filterEstado, onChange: setFilterEstado,
            options: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }] },
        ]}
        onClear={() => { setFilterRol(''); setFilterEstado('') }}
      />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay usuarios que coincidan con la búsqueda." />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
     
                <TableHead className="text-muted-foreground w-[50%]">Correo</TableHead>
                <TableHead className="text-muted-foreground w-[18%]">Rol</TableHead>
                <TableHead className="text-muted-foreground w-[14%]">Estado</TableHead>
                <TableHead className="text-right text-muted-foreground w-[18%]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((u) => (
                <TableRow key={u.id_usuario}>
            
                  <TableCell className="text-foreground">{u.correo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRolBadgeClass(u.id_rol)}>
                      {ROL_LABELS[u.id_rol] ?? `Rol ${u.id_rol}`}
                    </Badge>
                  </TableCell>
                  <TableCell><Switch checked={u.estado} onCheckedChange={async () => { await withToast(onToggleEstado(u.id_usuario), 'Estado actualizado') }} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openView(u)}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)}><Pencil className="h-4 w-4 text-foreground" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent className="bg-card text-card-foreground border-border">
                          <AlertDialogHeader><AlertDialogTitle>¿Eliminar {u.correo}?</AlertDialogTitle><AlertDialogDescription>Los datos del usuario se perderán permanentemente. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { await withToast(onEliminar(u.id_usuario), 'Usuario eliminado') }}>Eliminar</AlertDialogAction>
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

          <Pagination
            page={page} totalPages={totalPages} total={total} pageSize={pageSize}
            onChange={setPage} onPageSizeChange={setPageSize} className="px-2 pb-2"
          />
        </div>
        )}

      {viewingItem && (
        <ViewDialog open={isViewOpen} onOpenChange={setIsViewOpen}
          title={`Usuario #${viewingItem.id_usuario}`} description={viewingItem.correo}
          fields={[
            { label: 'ID',     value: viewingItem.id_usuario },
            { label: 'Estado', value: <EstadoBadge estado={viewingItem.estado} /> },
            { label: 'Correo', value: viewingItem.correo, fullWidth: true },
            { label: 'Rol',    value: <Badge variant="outline" className={getRolBadgeClass(viewingItem.id_rol)}>{ROL_LABELS[viewingItem.id_rol] ?? `Rol ${viewingItem.id_rol}`}</Badge> },
          ]} />
      )}

      <Dialog open={isFormOpen} onOpenChange={(v) => { setIsFormOpen(v); if (!v) resetForm() }}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingId ? 'Editar Usuario' : 'Registrar Usuario'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">{editingId ? 'Actualiza el correo o el rol.' : 'Completa los datos del nuevo usuario.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="correo" className="text-foreground">Correo <span className="text-red-500">*</span></Label>
              <Input id="correo" type="email" value={correo} onChange={(e) => { setCorreo(e.target.value); if (errors.correo) setErrors({...errors, correo:''}) }} className="bg-card text-foreground border-border" />
              {errors.correo && <p className="text-sm text-destructive">{errors.correo}</p>}
            </div>
            {!editingId && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="clave" className="text-foreground">Contraseña <span className="text-red-500">*</span></Label>
                <Input id="clave" type="password" value={clave} onChange={(e) => { setClave(e.target.value); if (errors.clave) setErrors({...errors, clave:''}) }} className="bg-card text-foreground border-border" />
                {errors.clave && <p className="text-sm text-destructive">{errors.clave}</p>}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Rol <span className="text-red-500">*</span></Label>
              <Select value={idRol} onValueChange={(v) => { setIdRol(v); if (errors.idRol) setErrors({...errors, idRol:''}) }}>
                <SelectTrigger className="bg-card text-foreground border-border"><SelectValue placeholder="Seleccionar rol" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Admin</SelectItem>
                  <SelectItem value="2">Empleado</SelectItem>
                  <SelectItem value="3">Cliente</SelectItem>
                </SelectContent>
              </Select>
              {errors.idRol && <p className="text-sm text-destructive">{errors.idRol}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); resetForm() }} className="border-border text-foreground">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">{editingId ? 'Guardar cambios' : 'Registrar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}