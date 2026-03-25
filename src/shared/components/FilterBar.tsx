// src/shared/components/FilterBar.tsx
// Barra de filtros reutilizable — aparece debajo del SearchInput
// Soporta tipo 'select' (dropdown) y 'chips' (opciones como píldoras)
import { cn } from '@/src/shared/lib/utils'
import { X, SlidersHorizontal } from 'lucide-react'

type FilterOption = { value: string; label: string }

type FilterConfig = {
  key:      string
  label:    string
  type:     'select' | 'chips'
  value:    string
  onChange: (val: string) => void
  options:  FilterOption[]
}

interface FilterBarProps {
  filters:  FilterConfig[]
  onClear:  () => void
  className?: string
}

export function FilterBar({ filters, onClear, className }: FilterBarProps) {
  const activeCount = filters.filter(f => f.value !== '').length

  return (
    <div className={cn('flex flex-wrap items-start gap-3', className)}>
      {/* Ícono + label */}
      <div className="flex items-center gap-1.5 pt-1.5">
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Filtrar por</span>
      </div>

      {/* Filtros */}
      {filters.map(f => (
        <div key={f.key} className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide px-0.5">{f.label}</span>

          {f.type === 'select' ? (
            /* ── Dropdown ── */
            <select
              value={f.value}
              onChange={e => f.onChange(e.target.value)}
              className={cn(
                'h-7 rounded-md border px-2 text-xs text-foreground bg-card',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                'transition-colors',
                f.value !== '' ? 'border-primary text-primary' : 'border-border'
              )}
            >
              <option value="">Todos</option>
              {f.options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            /* ── Chips ── */
            <div className="flex gap-1">
              {f.options.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => f.onChange(f.value === o.value ? '' : o.value)}
                  className={cn(
                    'h-7 rounded-full border px-3 text-xs font-medium transition-all',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    f.value === o.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Limpiar filtros */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 h-7 mt-5 rounded-full border border-destructive/40 bg-destructive/5
                     px-3 text-xs text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="h-3 w-3" />
          Limpiar ({activeCount})
        </button>
      )}
    </div>
  )
}