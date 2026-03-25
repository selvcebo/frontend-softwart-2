// src/features/permisos/components/PermisosPage.tsx
import { usePermisos } from '../hooks/usePermisos'
import { useState, useMemo } from 'react'
import { ShieldCheck, ShieldOff, Lock, AlertCircle, ChevronDown, CheckSquare, Square } from 'lucide-react'
import { Label } from '@/src/shared/components/ui/label'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { Checkbox } from '@/src/shared/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/shared/components/ui/select'
import { Alert, AlertDescription } from '@/src/shared/components/ui/alert'
import { Badge } from '@/src/shared/components/ui/badge'
import { Button } from '@/src/shared/components/ui/button'
import { EmptyState } from '@/src/shared/components/EmptyState'

const ADMIN_ROL_ID = 1

// ── Agrupación por módulo: formato "MODULO.ACCION" ───────────────────────────
// Ej: "CLIENTES.VER" → módulo "CLIENTES", acción "VER"
// Ej: "CUENTA.VER_PERFIL" → módulo "CUENTA", acción "VER_PERFIL"

const MODULO_LABELS: Record<string, string> = {
  CUENTA:    '👤 Mi Cuenta (Cliente)',
  CLIENTES:  '🧑‍💼 Clientes',
  CITAS:     '📅 Citas',
  VENTAS:    '💰 Ventas',
  PEDIDOS:   '📦 Pedidos',
  PAGOS:     '💳 Pagos',
  MARCOS:    '🖼️ Marcos / Calculadora',
  SERVICIOS: '🔧 Tipos de Servicio',
  USUARIOS:  '👥 Usuarios',
  ROLES:     '🔑 Roles',
  PERMISOS:  '🛡️ Permisos',
  CATALOGOS: '📋 Catálogos',
}

// Orden fijo de módulos para que siempre salgan igual
const MODULO_ORDER = ['CUENTA','CLIENTES','CITAS','VENTAS','PEDIDOS','PAGOS','MARCOS','SERVICIOS','USUARIOS','ROLES','PERMISOS','CATALOGOS']

// "CLIENTES.VER" → "CLIENTES" | "CUENTA.VER_PERFIL" → "CUENTA"
function getModulo(nombre: string): string {
  const partes = nombre.split('.')
  return partes[0] ?? 'GENERAL'
}

// "CLIENTES.VER" → "VER" | "CUENTA.VER_PERFIL" → "VER_PERFIL"
function getAccion(nombre: string): string {
  return nombre.split('.')[1] ?? nombre
}

// ── Card de módulo ────────────────────────────────────────────────────────────
interface ModuloCardProps {
  moduloKey: string
  permisos: { id_permiso: number; nombre: string; descripcion?: string }[]
  id_rol: number
  isAdmin: boolean
  tienePermiso: (id_rol: number, id_permiso: number) => boolean
  onToggle: (id_permiso: number) => void
  onToggleAll: (ids: number[], marcar: boolean) => void
}

function ModuloCard({ moduloKey, permisos, id_rol, isAdmin, tienePermiso, onToggle, onToggleAll }: ModuloCardProps) {
  const [open, setOpen] = useState(false)

  const activos   = permisos.filter(p => tienePermiso(id_rol, p.id_permiso)).length
  const total     = permisos.length
  const todosOn   = activos === total
  const algunoOn  = activos > 0 && activos < total

  const handleToggleAll = () => {
    if (isAdmin) return
    const ids = permisos.map(p => p.id_permiso)
    onToggleAll(ids, !todosOn)
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header del módulo */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-accent/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">
            {MODULO_LABELS[moduloKey] ?? `⚙️ ${moduloKey}`}
          </span>
          <Badge
            variant="secondary"
            className={activos === total ? 'bg-primary/15 text-primary' : activos > 0 ? 'bg-amber-100 text-amber-800' : ''}
          >
            {activos}/{total}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Checkbox "seleccionar todo el módulo" */}
          {!isAdmin && (
            <div
              role="checkbox"
              tabIndex={0}
              aria-checked={todosOn ? true : algunoOn ? 'mixed' : false}
              onClick={e => { e.stopPropagation(); handleToggleAll() }}
              onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.stopPropagation(); handleToggleAll() } }}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={todosOn ? 'Desmarcar todos' : 'Marcar todos'}
            >
              {todosOn
                ? <CheckSquare className="h-4 w-4 text-primary" />
                : algunoOn
                  ? <CheckSquare className="h-4 w-4 text-amber-500" />
                  : <Square className="h-4 w-4" />
              }
              <span className="hidden sm:inline">{todosOn ? 'Todos' : 'Marcar todos'}</span>
            </div>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Grid de permisos del módulo */}
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2.5 border-t border-border bg-background/40">
          {permisos.map(permiso => {
            const asignado = tienePermiso(id_rol, permiso.id_permiso)
            // Extraer la acción: "CLIENTES.VER" → "VER" | "CUENTA.VER_PERFIL" → "VER PERFIL"
            const accionLabel = getAccion(permiso.nombre).replace(/_/g, ' ')
            return (
              <label
                key={permiso.id_permiso}
                htmlFor={`perm-${permiso.id_permiso}`}
                title={isAdmin ? 'El Admin siempre tiene todos los permisos' : undefined}
                className={[
                  'flex items-center gap-2 rounded-md border px-2.5 py-1.5 cursor-pointer select-none transition-colors',
                  isAdmin
                    ? 'cursor-default opacity-75 border-border bg-muted/50'
                    : asignado
                      ? 'border-primary/40 bg-primary/5 hover:bg-primary/10'
                      : 'border-border hover:bg-accent/50',
                ].join(' ')}
              >
                <Checkbox
                  id={`perm-${permiso.id_permiso}`}
                  checked={asignado}
                  onCheckedChange={() => !isAdmin && onToggle(permiso.id_permiso)}
                  disabled={isAdmin}
                  className="shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    {accionLabel}
                  </span>
                  {permiso.descripcion && (
                    <span className="text-[10px] text-muted-foreground truncate">{permiso.descripcion}</span>
                  )}
                </div>
                {asignado
                  ? <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 ml-auto" />
                  : <ShieldOff className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto" />
                }
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page principal ────────────────────────────────────────────────────────────
export function PermisosPage() {
  const { permisos, roles, isLoading, error, tienePermiso, onTogglePermiso } = usePermisos()
  const [selectedRol, setSelectedRol] = useState<string>('')
  const [actionError, setActionError] = useState<string | null>(null)

  const selectedRolId = selectedRol ? Number(selectedRol) : null
  const isAdmin = selectedRolId === ADMIN_ROL_ID

  // Agrupar permisos por módulo
  const modulosAgrupados = useMemo(() => {
    const grupos = new Map<string, typeof permisos>()
    for (const p of permisos) {
      const modulo = getModulo(p.nombre)
      if (!grupos.has(modulo)) grupos.set(modulo, [])
      grupos.get(modulo)!.push(p)
    }
    // Ordenar módulos según orden fijo
    return Array.from(grupos.entries()).sort(([a], [b]) => {
      const ai = MODULO_ORDER.indexOf(a)
      const bi = MODULO_ORDER.indexOf(b)
      const av = ai === -1 ? 999 : ai
      const bv = bi === -1 ? 999 : bi
      return av - bv
    })
  }, [permisos])

  const totalActivos = useMemo(() => {
    if (!selectedRolId) return 0
    return permisos.filter(p => tienePermiso(selectedRolId, p.id_permiso)).length
  }, [permisos, selectedRolId, tienePermiso])

  const handleToggle = async (id_permiso: number) => {
    if (!selectedRolId || isAdmin) return
    setActionError(null)
    const err = await onTogglePermiso(selectedRolId, id_permiso)
    if (err) setActionError(err)
  }

  // Marcar/desmarcar todos los permisos de un módulo de golpe
  const handleToggleAll = async (ids: number[], marcar: boolean) => {
    if (!selectedRolId || isAdmin) return
    setActionError(null)
    for (const id_permiso of ids) {
      const actual = tienePermiso(selectedRolId, id_permiso)
      if (marcar && !actual) await onTogglePermiso(selectedRolId, id_permiso)
      if (!marcar && actual) await onTogglePermiso(selectedRolId, id_permiso)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl text-secondary">Permisos por Rol</h1>
        <p className="text-muted-foreground">Selecciona un rol para gestionar sus permisos por módulo</p>
      </div>

      {/* Selector de Rol + resumen */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2 min-w-[200px]">
          <Label htmlFor="perm-rol" className="text-foreground">Rol</Label>
          {isLoading ? <Skeleton className="h-10 w-48 rounded-md" /> : (
            <Select value={selectedRol} onValueChange={v => { setSelectedRol(v); setActionError(null) }}>
              <SelectTrigger id="perm-rol" className="bg-card text-foreground border-border">
                <SelectValue placeholder="Seleccionar rol..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map(r => (
                  <SelectItem key={r.id_rol} value={String(r.id_rol)}>{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedRolId && !isLoading && (
          <div className="flex items-center gap-2 pb-0.5">
            <Badge variant="secondary" className="text-sm">
              {totalActivos}/{permisos.length} permisos activos
            </Badge>
            {isAdmin && (
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 gap-1">
                <Lock className="h-3 w-3" /> Solo lectura
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Aviso Admin */}
      {isAdmin && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-800">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <strong>Admin</strong> tiene todos los permisos del sistema y no puede modificarse por seguridad.
          </AlertDescription>
        </Alert>
      )}

      {/* Error de acción */}
      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Contenido */}
      {!selectedRolId ? (
        <EmptyState title="Selecciona un rol" description="Elige un rol para ver y gestionar sus permisos agrupados por módulo." />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : permisos.length === 0 ? (
        <EmptyState title="Sin permisos" description="No hay permisos registrados en el sistema." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
          {modulosAgrupados.map(([moduloKey, permisosModulo]) => (
            <ModuloCard
              key={moduloKey}
              moduloKey={moduloKey}
              permisos={permisosModulo}
              id_rol={selectedRolId}
              isAdmin={isAdmin}
              tienePermiso={tienePermiso}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
            />
          ))}
        </div>
      )}
    </div>
  )
}