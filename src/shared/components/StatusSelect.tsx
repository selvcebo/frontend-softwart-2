// src/shared/components/StatusSelect.tsx
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem } from './ui/select'
import { Badge } from './ui/badge'
import { cn } from '@/src/shared/lib/utils'

export interface StatusOption {
  value:    string
  label:    string
  badgeCls?: string
}

interface StatusSelectProps {
  value:          string
  onValueChange:  (v: string) => void
  options:        StatusOption[]
  disabled?:      boolean
}

export function StatusSelect({ value, onValueChange, options, disabled }: StatusSelectProps) {
  const current = options.find(o => o.value === value)

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          'group flex items-center gap-1.5 h-8 rounded-md px-1.5',
          'border-0 bg-transparent outline-none focus:ring-0 focus:ring-offset-0',
          'hover:bg-accent transition-colors cursor-pointer',
          'disabled:cursor-not-allowed disabled:opacity-50 data-[disabled]:opacity-50',
        )}
      >
        {current && (
          <Badge variant="outline" className={cn('pointer-events-none text-[11px] font-semibold', current.badgeCls)}>
            {current.label}
          </Badge>
        )}
        <ChevronDown className={cn(
          'h-3.5 w-3.5 text-muted-foreground shrink-0',
          'transition-transform duration-200',
          '-rotate-90 group-data-[state=open]:rotate-0',
        )} />
      </SelectPrimitive.Trigger>
      <SelectContent side="bottom" align="start">
        {options.map(o => (
          <SelectItem key={o.value} value={o.value}>
            <Badge variant="outline" className={cn('pointer-events-none text-[11px] font-semibold', o.badgeCls)}>
              {o.label}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
