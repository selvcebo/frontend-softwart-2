// src/features/calculadora/components/CalculadoraPage.tsx
import { useCalculadora } from '../hooks/useCalculadora'
import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Eye, Calculator } from 'lucide-react'
import { Button }   from '@/src/shared/components/ui/button'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Switch }   from '@/src/shared/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/shared/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/shared/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/src/shared/components/ui/alert-dialog'
import { ViewDialog, EstadoBadge } from '@/src/shared/components/ViewDialog'
import { withToast } from '@/src/shared/lib/withToast'  
import { SearchInput } from '@/src/shared/components/SearchInput'
import { Pagination }    from '@/src/shared/components/Pagination'
import { usePagination } from '@/src/shared/hooks/usePagination'
import { FilterBar }   from '@/src/shared/components/FilterBar'
import { EmptyState } from '@/src/shared/components/EmptyState'

type Marco = { id_marco: number; codigo: string; colilla: number; precio_ensamblado: number; estado: boolean }

const fmt = (v: number) => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })

const inputCls = 'w-full bg-muted border-0 border-b-2 border-transparent focus:border-secondary focus:ring-0 focus:outline-none px-4 py-3 rounded-t-lg transition-all text-sm'
const labelCls = 'block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2'

export function CalculadoraPage() {
  const { marcos, isLoading, onCrear, onEditar, onEliminar, onToggleEstado } = useCalculadora()

  // ── Búsqueda y filtros ─────────────────────────────────────────────────────
  const [q,            setQ]            = useState('')
  const [filterEstado, setFilterEstado] = useState('')

  const filtered = useMemo(() => {
    const s = q.toLowerCase()
    return marcos.filter(m => {
      const matchQ      = !s || m.codigo.toLowerCase().includes(s)
      const matchEstado = !filterEstado || (filterEstado === 'activo' ? m.estado : !m.estado)
      return matchQ && matchEstado
    })
  }, [marcos, q, filterEstado])

  const { paginated, page, setPage, totalPages, total, pageSize, setPageSize } = usePagination(filtered)

  // ── Form ───────────────────────────────────────────────────────────────────
  const [isFormOpen,   setIsFormOpen]   = useState(false)
  const [isViewOpen,   setIsViewOpen]   = useState(false)
  const [isCalcOpen,   setIsCalcOpen]   = useState(false)
  const [editingId,    setEditingId]    = useState<number | null>(null)
  const [viewingItem,  setViewingItem]  = useState<Marco | null>(null)
  const [calcMarco,    setCalcMarco]    = useState<Marco | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [codigo,       setCodigo]       = useState('')
  const [colillaStr,   setColillaStr]   = useState('')
  const [precioStr,    setPrecioStr]    = useState('')
  const [largo,        setLargo]        = useState('')
  const [ancho,        setAncho]        = useState('')
  const [errors,       setErrors]       = useState<Record<string, string>>({})

  const resetForm  = () => { setCodigo(''); setColillaStr(''); setPrecioStr(''); setErrors({}); setEditingId(null) }
  const openCreate = () => { resetForm(); setIsFormOpen(true) }
  const openEdit   = (m: Marco) => { setEditingId(m.id_marco); setCodigo(m.codigo); setColillaStr(String(m.colilla)); setPrecioStr(String(m.precio_ensamblado)); setErrors({}); setIsFormOpen(true) }
  const openView   = (m: Marco) => { setViewingItem(m); setIsViewOpen(true) }
  const openCalc   = (m: Marco) => { setCalcMarco(m); setLargo(''); setAncho(''); setIsCalcOpen(true) }

  const calcValues = useMemo(() => {
    if (!calcMarco || !largo || !ancho) return { costo: 0, venta: 0 }
    const costo = ((Number(largo) + Number(ancho)) * 2 + Number(calcMarco.colilla)) * Number(calcMarco.precio_ensamblado)
    return { costo, venta: costo * 2 }
  }, [calcMarco, largo, ancho])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!codigo.trim())     newErrors.codigo  = 'Campo requerido'
    if (!colillaStr.trim()) newErrors.colilla = 'Campo requerido'
    if (!precioStr.trim())  newErrors.precio  = 'Campo requerido'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setIsSubmitting(true)
    try {
      const data = { codigo, colilla: Number(colillaStr), precio_ensamblado: Number(precioStr), estado: true }
      await withToast(
        editingId ? onEditar(editingId, data) : onCrear(data),
        editingId ? 'Marco actualizado' : 'Marco registrado'
      )
      setIsFormOpen(false); resetForm()
    } catch { } finally { setIsSubmitting(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-secondary">Calculadora de Marcos</h1>
          <p className="text-muted-foreground">Gestiona marcos y calcula precios</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Buscar por código..." className="w-56" />
          <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
            <Plus className="mr-2 h-4 w-4" />Registrar Marco
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
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-12 w-full rounded-md" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin resultados" description="No hay marcos que coincidan." />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
    
                <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground w-[28%]">Código</TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[20%]">Colilla</TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[24%]">Precio ensamblado</TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Estado</TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wide text-muted-foreground w-[14%]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((m) => (
                <TableRow key={m.id_marco} className="hover:bg-muted/40 transition-colors border-border">
      
                  <TableCell className="text-foreground font-medium">{m.codigo}</TableCell>
                  <TableCell className="text-foreground text-right tabular-nums">{fmt(m.colilla)}</TableCell>
                  <TableCell className="text-foreground text-right tabular-nums">{fmt(m.precio_ensamblado)}</TableCell>
                  <TableCell className='text-right'>
                    
                    <Switch checked={m.estado} onCheckedChange={async () => { await withToast(onToggleEstado(m.id_marco), 'Estado actualizado') }} /></TableCell>
                 
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openCalc(m)}><Calculator className="h-4 w-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openView(m)}><Eye className="h-4 w-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4 text-foreground" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent className="bg-card text-card-foreground border-border">
                          <AlertDialogHeader><AlertDialogTitle className="font-serif text-secondary">Eliminar marco</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { await withToast(onEliminar(m.id_marco), 'Marco eliminado') }}>Eliminar</AlertDialogAction>
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
          title={`Marco — ${viewingItem.codigo}`} description={`Registro #${viewingItem.id_marco}`}
          fields={[
            { label: 'ID',              value: viewingItem.id_marco },
            { label: 'Estado',          value: <EstadoBadge estado={viewingItem.estado} /> },
            { label: 'Código',          value: viewingItem.codigo },
            { label: 'Colilla',         value: fmt(viewingItem.colilla) },
            { label: 'Precio Ensamblado', value: fmt(viewingItem.precio_ensamblado) },
            { label: 'Precio Venta (×2)', value: fmt(viewingItem.precio_ensamblado * 2) },
          ]} />
      )}

      {/* Calculadora */}
      <Dialog open={isCalcOpen} onOpenChange={setIsCalcOpen}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-secondary">Calcular precio</DialogTitle>
            <DialogDescription className="text-muted-foreground">{calcMarco?.codigo}</DialogDescription>
          </DialogHeader>
          {calcMarco && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="calc-largo">Largo (cm) <span className="text-destructive">*</span></label>
                  <input id="calc-largo" type="number" min="0" value={largo} onChange={(e) => setLargo(e.target.value)} placeholder="Ej: 30" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="calc-ancho">Ancho (cm) <span className="text-destructive">*</span></label>
                  <input id="calc-ancho" type="number" min="0" value={ancho} onChange={(e) => setAncho(e.target.value)} placeholder="Ej: 20" className={inputCls} />
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                Fórmula: ((largo + ancho) × 2 + {calcMarco.colilla}) × {fmt(calcMarco.precio_ensamblado)}
              </div>
              <div className="rounded-lg border border-border p-4 flex flex-col gap-2">
                <div className="flex justify-between"><span className="text-foreground">Costo:</span><span className="font-bold text-foreground">{fmt(calcValues.costo)}</span></div>
                <div className="flex justify-between"><span className="text-foreground">Venta (×2):</span><span className="font-bold text-primary">{fmt(calcValues.venta)}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form */}
      <Dialog open={isFormOpen} onOpenChange={(v) => { setIsFormOpen(v); if (!v) resetForm() }}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-secondary">{editingId ? 'Editar Marco' : 'Registrar Marco'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Completa los datos del marco.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div>
              <label className={labelCls} htmlFor="marco-codigo">Código <span className="text-destructive">*</span></label>
              <input id="marco-codigo" value={codigo} placeholder="Ej: MDF-001" onChange={(e) => { setCodigo(e.target.value); if (errors.codigo) setErrors({}) }} className={inputCls} />
              {errors.codigo && <p className="mt-1 text-xs text-destructive">{errors.codigo}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="marco-colilla">Colilla <span className="text-destructive">*</span></label>
              <input id="marco-colilla" type="number" step="0.01" min="0" value={colillaStr} placeholder="Ej: 5" onChange={(e) => { setColillaStr(e.target.value); if (errors.colilla) setErrors({}) }} className={inputCls} />
              {errors.colilla && <p className="mt-1 text-xs text-destructive">{errors.colilla}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="marco-precio">Precio Ensamblado <span className="text-destructive">*</span></label>
              <input id="marco-precio" type="number" step="0.01" min="0" value={precioStr} placeholder="Ej: 15000" onChange={(e) => { setPrecioStr(e.target.value); if (errors.precio) setErrors({}) }} className={inputCls} />
              {errors.precio && <p className="mt-1 text-xs text-destructive">{errors.precio}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button type="button" onClick={() => { setIsFormOpen(false); resetForm() }} className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50">{editingId ? 'Guardar cambios' : 'Registrar'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}