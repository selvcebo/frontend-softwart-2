// src/shared/components/DatePicker.tsx
import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { format } from 'date-fns'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

interface DatePickerProps {
  value: string                     // YYYY-MM-DD
  onChange: (value: string) => void
  min?: string                      // YYYY-MM-DD — días anteriores deshabilitados
  placeholder?: string
  error?: string
  /** Sobreescribe el estilo del trigger (por defecto: underline igual al resto de inputs) */
  triggerClassName?: string
  id?: string
}

// Parseo local para evitar desfases UTC
function parseDate(str: string): Date | undefined {
  if (!str) return undefined
  const parts = str.split('-').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return undefined
  return new Date(parts[0], parts[1] - 1, parts[2])
}

export function DatePicker({
  value,
  onChange,
  min,
  placeholder = 'Selecciona una fecha',
  error,
  triggerClassName,
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const selected = parseDate(value)
  const minDate  = parseDate(min)

  const displayText = selected
    ? format(selected, "d 'de' MMMM, yyyy", { locale: es })
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={
            triggerClassName ??
            `w-full bg-muted border-0 border-b-2 transition-all px-4 py-3 rounded-t-lg
             text-left flex items-center justify-between gap-2 focus:outline-none
             ${open ? 'border-secondary' : error ? 'border-destructive' : 'border-transparent'}`
          }
        >
          <span className={`text-sm ${selected ? 'text-foreground' : 'text-muted-foreground/60'}`}>
            {displayText}
          </span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground/50 shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="p-0 border-border shadow-xl rounded-xl overflow-hidden w-auto">
        <DayPicker
          mode="single"
          locale={es}
          selected={selected}
          fixedWeeks
          onSelect={(date) => {
            if (!date) return
            onChange(format(date, 'yyyy-MM-dd'))
            setOpen(false)
          }}
          defaultMonth={selected ?? minDate ?? new Date()}
          disabled={minDate ? { before: minDate } : undefined}
          classNames={{
            root:            'p-4 bg-card select-none',
            months:          '',
            // Ancho fijo → altura siempre igual junto con fixedWeeks
            month:           'w-[272px]',
            // px-10 reserva espacio para las flechas; los botones usan absolute
            month_caption:   'relative flex items-center justify-center h-9 px-10 mb-2',
            caption_label:   'text-sm font-semibold text-secondary capitalize',
            // nav vacío: los botones se posicionan absolute respecto a month_caption
            nav:             '',
            button_previous: 'absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center text-secondary hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none',
            button_next:     'absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg flex items-center justify-center text-secondary hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none',
            // month_grid es <table> — NO usar flex en sus hijos directos
            month_grid:      'w-full',
            weekdays:        '',
            weekday:         'text-center text-[11px] font-medium text-muted-foreground/60 pb-2 w-9',
            week:            '',
            day:             'text-center p-[2px]',
            day_button:      'mx-auto h-8 w-8 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center focus-visible:outline-none',
            selected:        '!bg-primary !text-primary-foreground hover:!bg-primary/90',
            today:           'ring-1 ring-inset ring-secondary/40',
            outside:         'opacity-30',
            disabled:        'opacity-25 pointer-events-none',
            hidden:          'invisible',
          }}
          components={{
            Chevron: ({ orientation }: { orientation?: string }) =>
              orientation === 'left'
                ? <ChevronLeft className="h-4 w-4" />
                : <ChevronRight className="h-4 w-4" />,
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
