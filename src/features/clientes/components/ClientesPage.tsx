// src/features/clientes/components/ClientesPage.tsx
import { useClientes } from '../hooks/useClientes'
import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { Button }   from '@/src/shared/components/ui/button'
import { Input }    from '@/src/shared/components/ui/input'
import { Label }    from '@/src/shared/components/ui/label'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Switch }   from '@/src/shared/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/shared/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/src/shared/components/ui/alert-dialog'
import { ViewDialog, EstadoBadge } from '@/src/shared/components/ViewDialog'
import { EmptyState } from '@/src/shared/components/EmptyState'
import { withToast } from '@/src/shared/lib/withToast'    
import { SearchInput }   from '@/src/shared/components/SearchInput'
import { FilterBar }     from '@/src/shared/components/FilterBar'
import { Pagination }    from '@/src/shared/components/Pagination'
import { usePagination } from '@/src/shared/hooks/usePagination'

type Cliente = {
  id_cliente: number; tipoDocumento: string; documento: string
  nombre: string; correo: string; telefono?: string; estado: boolean
}

const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'PP', label: 'Pasaporte (PP)' },
]

export function ClientesPage() {
  const { clientes, isLoading, onCrear, onEditar, onEliminar, onToggleEstado } = useClientes()

  // ── Búsqueda y filtros ─────────────────────────────────────────────────────
  const [q,            setQ]            = useState('')
  const [filterEstado, setFilterEstado] = useState('')

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return clientes.filter(c => {
      const matchQ = !s ||
        c.nombre.toLowerCase().includes(s) ||
        c.documento.includes(s) ||
        c.correo.toLowerCase().includes(s) ||
        (c.telefono ?? '').includes(s)
      const matchEstado = !filterEstado || (filterEstado === 'activo' ? c.estado : !c.estado)
      return matchQ && matchEstado
    })
  }, [clientes, q, filterEstado])

  const { paginated, page, setPage, totalPages, total, pageSize, setPageSize } = usePagination(filtered)

  // ── Form ───────────────────────────────────────────────────────────────────
  const [isFormOpen,   setIsFormOpen]   = useState(false)
  const [isViewOpen,   setIsViewOpen]   = useState(false)
  const [editingId,    setEditingId]    = useState<number | null>(null)
  const [viewingItem,  setViewingItem]  = useState<Cliente | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tipoDocumento, setTipoDocumento] = useState('')
  const [documento,     setDocumento]     = useState('')
  const [nombre,        setNombre]        = useState('')
  const [correo,        setCorreo]        = useState('')
  const [telefono,      setTelefono]      = useState('')
  const [errors,        setErrors]        = useState<Record<string, string>>({})

  const resetForm = () => {
    setTipoDocumento(''); setDocumento(''); setNombre('')
    setCorreo(''); setTelefono(''); setErrors({}); setEditingId(null)
  }
  const openCreate = () => { resetForm(); setIsFormOpen(true) }
  const openEdit   = (c: Cliente) => {
    setEditingId(c.id_cliente); setTipoDocumento(c.tipoDocumento)
    setDocumento(c.documento); setNombre(c.nombre)
    setCorreo(c.correo); setTelefono(c.telefono ?? '')
    setErrors({}); setIsFormOpen(true)
  }
  const openView = (c: Cliente) => { setViewingItem(c); setIsViewOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!tipoDocumento)    newErrors.tipoDocumento = 'Campo requerido'
    if (!documento.trim()) newErrors.documento     = 'Campo requerido'
    if (!nombre.trim())    newErrors.nombre        = 'Campo requerido'
    if (!correo.trim())    newErrors.correo        = 'Campo requerido'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setIsSubmitting(true)
    try {
      await withToast(
        editingId
          ? onEditar(editingId, { tipoDocumento, documento, nombre, telefono })
          : onCrear({ tipoDocumento, documento, nombre, correo, telefono, estado: true }),
        editingId ? 'Cliente actualizado correctamente' : 'Cliente registrado correctamente'
      )
      setIsFormOpen(false); resetForm()
    } catch { } finally { setIsSubmitting(false) }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gestiona los clientes registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput
            value={q} onChange={setQ}
            placeholder="Buscar nombre, documento, correo..."
            className="w-72"
          />
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Plus className="mr-2 h-4 w-4" />Registrar Cliente
          </Button>
        </div>
      </div>

      {/* FilterBar */}
      <FilterBar
        filters={[
          { key: 'estado', label: 'Estado', type: 'chips', value: filterEstado, onChange: setFilterEstado,
            options: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }] },
        ]}
        onClear={() => setFilterEstado('')}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay clientes que coincidan con la búsqueda." />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
               
                  <TableHead className="text-muted-foreground w-[22%]">Nombre</TableHead>
                  <TableHead className="text-muted-foreground w-[14%]">Documento</TableHead>
                  <TableHead className="text-muted-foreground w-[24%]">Correo</TableHead>
                  <TableHead className="text-muted-foreground w-[14%]">Teléfono</TableHead>
                  <TableHead className="text-muted-foreground w-[12%]">Estado</TableHead>
                  <TableHead className="text-right text-muted-foreground w-[14%]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c) => (
                  <TableRow key={c.id_cliente}>
  
                    <TableCell className="text-foreground font-medium">{c.nombre}</TableCell>
                    <TableCell className="text-foreground">
                      <span className="text-xs text-muted-foreground mr-1">{c.tipoDocumento}</span>{c.documento}
                    </TableCell>
                    <TableCell className="text-foreground">{c.correo}</TableCell>
                    <TableCell className="text-foreground">{c.telefono ?? '—'}</TableCell>
                    <TableCell>
                      <Switch checked={c.estado} onCheckedChange={async () => { await withToast(onToggleEstado(c.id_cliente), 'Estado actualizado') }} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(c)}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4 text-foreground" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card text-card-foreground border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar a {c.nombre}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Si <strong>{c.nombre}</strong> tiene
                                citas o ventas asociadas, su cuenta se desactivará en lugar de eliminarse.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground"
                                onClick={async () => {
                                await withToast(onEliminar(c.id_cliente), 'Cliente eliminado')
                              }}>Eliminar</AlertDialogAction>
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

      {/* ViewDialog */}
      {viewingItem && (
        <ViewDialog
          open={isViewOpen} onOpenChange={setIsViewOpen}
          title={`Cliente — ${viewingItem.nombre}`}
          description={`Registro #${viewingItem.id_cliente}`}
          fields={[
            { label: 'ID',             value: viewingItem.id_cliente },
            { label: 'Estado',         value: <EstadoBadge estado={viewingItem.estado} /> },
            { label: 'Tipo documento', value: viewingItem.tipoDocumento },
            { label: 'Documento',      value: viewingItem.documento },
            { label: 'Nombre',         value: viewingItem.nombre, fullWidth: true },
            { label: 'Correo',         value: viewingItem.correo, fullWidth: true },
            { label: 'Teléfono',       value: viewingItem.telefono },
          ]}
        />
      )}

      {/* Form */}
      <Dialog open={isFormOpen} onOpenChange={(v) => { setIsFormOpen(v); if (!v) resetForm() }}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingId ? 'Editar Cliente' : 'Registrar Cliente'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingId ? 'Puedes editar todos los campos excepto el correo.' : 'Completa los datos del nuevo cliente.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Tipo de documento <span className="text-red-500">*</span></Label>
              <Select value={tipoDocumento} onValueChange={(v) => { setTipoDocumento(v); if (errors.tipoDocumento) setErrors({...errors, tipoDocumento: ''}) }}>
                <SelectTrigger className="bg-card text-foreground border-border">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.tipoDocumento && <p className="text-sm text-destructive">{errors.tipoDocumento}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc" className="text-foreground">Número de documento <span className="text-red-500">*</span></Label>
              <Input id="doc" value={documento}
                onChange={e => { setDocumento(e.target.value); if (errors.documento) setErrors({...errors, documento: ''}) }}
                className="bg-card text-foreground border-border" />
              {errors.documento && <p className="text-sm text-destructive">{errors.documento}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nom" className="text-foreground">Nombre completo <span className="text-red-500">*</span></Label>
              <Input id="nom" value={nombre}
                onChange={e => { setNombre(e.target.value); if (errors.nombre) setErrors({...errors, nombre: ''}) }}
                className="bg-card text-foreground border-border" />
              {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
            </div>
            {!editingId && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="cor" className="text-foreground">Correo electrónico <span className="text-red-500">*</span></Label>
                <Input id="cor" type="email" value={correo}
                  onChange={e => { setCorreo(e.target.value); if (errors.correo) setErrors({...errors, correo: ''}) }}
                  className="bg-card text-foreground border-border" />
                {errors.correo && <p className="text-sm text-destructive">{errors.correo}</p>}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="tel" className="text-foreground">Teléfono (opcional)</Label>
              <Input id="tel" type="tel" value={telefono}
                onChange={e => setTelefono(e.target.value)}
                className="bg-card text-foreground border-border" />
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <Button type="button" variant="outline"
                onClick={() => { setIsFormOpen(false); resetForm() }}
                className="border-border text-foreground">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editingId ? 'Guardar cambios' : 'Registrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}