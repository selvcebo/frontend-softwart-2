// ============================================================
// src/shared/components/Combobox.tsx
// Searchable select usando Command + Popover de shadcn/ui
// ============================================================
import { useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/src/shared/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/src/shared/components/ui/popover'
import { cn } from '@/src/shared/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
  sublabel?: string // texto secundario (ej: correo, documento)
}

interface ComboboxProps {
  options:           ComboboxOption[]
  value:             string
  onValueChange:     (value: string) => void
  placeholder?:      string
  searchPlaceholder?: string
  emptyText?:        string
  disabled?:         boolean
  className?:        string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder      = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyText        = 'Sin resultados',
  disabled         = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)

  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full bg-muted border-0 border-b-2 rounded-t-lg px-4 py-3 text-sm text-left flex items-center justify-between gap-2 focus:outline-none transition-all',
            open ? 'border-secondary' : 'border-transparent',
            selected ? 'text-foreground' : 'text-muted-foreground/60',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-card border-border" align="start">
        <Command className="bg-card">
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandInput
              placeholder={searchPlaceholder}
              className="h-9 bg-transparent text-foreground placeholder:text-muted-foreground border-0 focus:ring-0"
            />
          </div>
          <CommandList>
            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.sublabel ?? ''}`}
                  onSelect={() => {
                    onValueChange(option.value === value ? '' : option.value)
                    setOpen(false)
                  }}
                  className="cursor-pointer text-foreground aria-selected:bg-primary/10"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 text-primary',
                      value === option.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.sublabel && (
                      <span className="text-xs text-muted-foreground">{option.sublabel}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}