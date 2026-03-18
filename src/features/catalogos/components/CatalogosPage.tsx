// src/features/catalogos/components/CatalogosPage.tsx
// CAMBIO CLAVE: onToggle ahora recibe (id, nombre, estadoActual) en vez de solo (id)
import { useCatalogos } from '../hooks/useCatalogos'
import { useState } from 'react'
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/src/shared/components/ui/button'
import { Input } from '@/src/shared/components/ui/input'
import { Label } from '@/src/shared/components/ui/label'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Switch } from '@/src/shared/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/shared/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/src/shared/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/src/shared/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/src/shared/components/ui/alert'
import { EmptyState } from '@/src/shared/components/EmptyState'

type CatalogItem = { id: number; nombre: string; estado: boolean }

interface CatalogTabProps {
  items: CatalogItem[]
  isLoading: boolean
  onToggle: (id: number, nombre: string, estadoActual: boolean) => Promise<void>
  onCreate: (data: { nombre: string }) => Promise<void>
  onEdit: (id: number, data: { nombre: string }) => Promise<void>
  onDelete: (id: number) => Promise<string | null>
  singularLabel: string
}

function CatalogTab({ items, isLoading, onToggle, onCreate, onEdit, onDelete, singularLabel }: CatalogTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nombre, setNombre] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => { setNombre(''); setFieldError(''); setEditingId(null) }
  const openCreate = () => { resetForm(); setIsFormOpen(true) }
  const openEdit = (item: CatalogItem) => { setEditingId(item.id); setNombre(item.nombre); setFieldError(''); setIsFormOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) { setFieldError('Campo requerido'); return }
    setIsSubmitting(true)
    try {
      if (editingId) await onEdit(editingId, { nombre })
      else await onCreate({ nombre })
      setIsFormOpen(false); resetForm()
    } catch { setFieldError('Ocurrió un error. Intenta de nuevo.') }
    finally { setIsSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    const err = await onDelete(id)
    if (err) setDeleteErrorMsg(err)
  }

  return (
    <div className="flex flex-col gap-4">
      {deleteErrorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{deleteErrorMsg}</span>
            <button onClick={() => setDeleteErrorMsg(null)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />Agregar {singularLabel}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState title="Sin registros" description={`No hay ${singularLabel.toLowerCase()}s registrados.`} />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground w-16">ID</TableHead>
                <TableHead className="text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-muted-foreground w-24">Estado</TableHead>
                <TableHead className="text-right text-muted-foreground w-28">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="text-foreground">{item.id}</TableCell>
                  <TableCell className="text-foreground font-medium">{item.nombre}</TableCell>
                  <TableCell>
                    {/* ✅ checked siempre boolean explícito + pasa nombre y estado actual al handler */}
                    <Switch
                      checked={Boolean(item.estado)}
                      onCheckedChange={() => onToggle(item.id, item.nombre, item.estado)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4 text-foreground" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card text-card-foreground border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar {singularLabel.toLowerCase()}</AlertDialogTitle>
                            <AlertDialogDescription>
                              Si este valor está siendo usado por citas, pedidos o pagos,
                              <strong className="text-destructive"> no podrá eliminarse</strong> y verás un aviso.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => handleDelete(item.id)}>
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
      )}

      <Dialog open={isFormOpen} onOpenChange={v => { setIsFormOpen(v); if (!v) resetForm() }}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingId ? `Editar ${singularLabel}` : `Agregar ${singularLabel}`}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Ingresa el nombre.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Nombre <span className="text-red-500">*</span></Label>
              <Input value={nombre} onChange={e => { setNombre(e.target.value); setFieldError('') }}
                className="bg-card text-foreground border-border" autoFocus />
              {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); resetForm() }} className="border-border text-foreground">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editingId ? 'Guardar' : 'Agregar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function CatalogosPage() {
  const {
    estadosCita, estadosServicio, metodosPago, estadosPago, isLoading,
    toggleEstadoCita, toggleEstadoServicio, toggleMetodoPago, toggleEstadoPago,
    crearEstadoCita, crearEstadoServicio, crearMetodoPago, crearEstadoPago,
    editarEstadoCita, editarEstadoServicio, editarMetodoPago, editarEstadoPago,
    eliminarEstadoCita, eliminarEstadoServicio, eliminarMetodoPago, eliminarEstadoPago,
  } = useCatalogos()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Catálogos</h1>
        <p className="text-muted-foreground">Gestiona los valores de referencia del sistema</p>
      </div>
      <Tabs defaultValue="estado-cita">
        <TabsList className="bg-muted">
          <TabsTrigger value="estado-cita">Estados de Cita</TabsTrigger>
          <TabsTrigger value="estado-servicio">Estados de Servicio</TabsTrigger>
          <TabsTrigger value="metodo-pago">Métodos de Pago</TabsTrigger>
          <TabsTrigger value="estado-pago">Estados de Pago</TabsTrigger>
        </TabsList>
        <TabsContent value="estado-cita" className="mt-4">
          <CatalogTab items={estadosCita.map(e => ({ id: e.id_estado_cita, nombre: e.nombre, estado: e.estado }))}
            isLoading={isLoading} onToggle={toggleEstadoCita}
            onCreate={crearEstadoCita} onEdit={editarEstadoCita} onDelete={eliminarEstadoCita} singularLabel="Estado de Cita" />
        </TabsContent>
        <TabsContent value="estado-servicio" className="mt-4">
          <CatalogTab items={estadosServicio.map(e => ({ id: e.id_estado, nombre: e.nombre, estado: e.estado }))}
            isLoading={isLoading} onToggle={toggleEstadoServicio}
            onCreate={crearEstadoServicio} onEdit={editarEstadoServicio} onDelete={eliminarEstadoServicio} singularLabel="Estado de Servicio" />
        </TabsContent>
        <TabsContent value="metodo-pago" className="mt-4">
          <CatalogTab items={metodosPago.map(m => ({ id: m.id_metodo_pago, nombre: m.nombre, estado: m.estado }))}
            isLoading={isLoading} onToggle={toggleMetodoPago}
            onCreate={crearMetodoPago} onEdit={editarMetodoPago} onDelete={eliminarMetodoPago} singularLabel="Método de Pago" />
        </TabsContent>
        <TabsContent value="estado-pago" className="mt-4">
          <CatalogTab items={estadosPago.map(e => ({ id: e.id_estado_pago, nombre: e.nombre, estado: e.estado }))}
            isLoading={isLoading} onToggle={toggleEstadoPago}
            onCreate={crearEstadoPago} onEdit={editarEstadoPago} onDelete={eliminarEstadoPago} singularLabel="Estado de Pago" />
        </TabsContent>
      </Tabs>
    </div>
  )
}