// src/shared/components/ToggleSwitch.tsx
import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/src/shared/lib/utils'

export interface ToggleOption<T extends string | number = string> {
  value:        T
  label:        string
  icon?:        React.ComponentType<{ className?: string }>
  indicatorCls?: string  // bg del indicador cuando esta opción está activa
  textActiveCls?: string  // color del texto cuando está activa
}

interface ToggleSwitchProps<T extends string | number> {
  value:    T
  onChange: (v: T) => void
  options:  ToggleOption<T>[]
  disabled?: boolean
  // Clases por defecto si la opción no define las suyas
  defaultIndicatorCls?: string
  defaultTextActiveCls?: string
}

export function ToggleSwitch<T extends string | number>({
  value,
  onChange,
  options,
  disabled,
  defaultIndicatorCls  = 'bg-secondary',
  defaultTextActiveCls = 'text-secondary-foreground',
}: ToggleSwitchProps<T>) {
  const uid = useId()

  return (
    <div className={cn(
      'inline-flex items-center h-8 rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5',
      disabled && 'opacity-50 pointer-events-none',
    )}>
      {options.map(opt => {
        const isActive      = opt.value === value
        const indicatorCls  = opt.indicatorCls  ?? defaultIndicatorCls
        const textActiveCls = opt.textActiveCls ?? defaultTextActiveCls

        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => !isActive && onChange(opt.value)}
            className={cn(
              'relative flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
              isActive
                ? textActiveCls
                : 'text-muted-foreground hover:text-foreground cursor-pointer',
            )}
          >
            {/* Indicador deslizante — siempre tiene el tamaño exacto del botón activo */}
            {isActive && (
              <motion.div
                layoutId={`${uid}-sw`}
                className={cn('absolute inset-0 rounded-md shadow-sm', indicatorCls)}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {opt.icon && <opt.icon className="h-3.5 w-3.5 shrink-0" />}
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
