// ============================================================
// src/shared/components/ViewDialog.tsx
// Modal genérico de solo lectura para ver detalles de un registro
// ============================================================
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/src/shared/components/ui/dialog'
import { Badge } from '@/src/shared/components/ui/badge'

export interface ViewField {
  label: string
  value: React.ReactNode
  fullWidth?: boolean // ocupa las 2 columnas
}

interface ViewDialogProps {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  title:         string
  description?:  string
  fields:        ViewField[]
}

export function ViewDialog({ open, onOpenChange, title, description, fields }: ViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-card-foreground border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground">{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-2">
          {fields.map((field, i) => (
            <div
              key={i}
              className={field.fullWidth ? 'col-span-2' : 'col-span-1'}
            >
              <p className="text-xs font-medium text-muted-foreground capitalize tracking-wide mb-1">
                {field.label}
              </p>
              <div className="text-sm text-foreground break-words">
                {field.value ?? <span className="text-muted-foreground italic">—</span>}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper: Badge de estado reutilizable en los ViewDialog
export function EstadoBadge({ estado }: { estado: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        estado
          ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
          : 'border-slate-300 bg-slate-100 text-slate-600'
      }
    >
      {estado ? 'Activo' : 'Inactivo'}
    </Badge>
  )
}