// src/shared/components/TimePicker.tsx
// Grilla de slots 1:00 PM – 5:00 PM (1h cada uno)
// Verde = disponible | Rojo = ocupado (popover con nombre del cliente)
import { useState } from 'react'
import { cn } from '@/src/shared/lib/utils'
import { Clock, User, CheckCircle2, XCircle } from 'lucide-react'

const SLOTS = ['13:00', '14:00', '15:00', '16:00', '17:00']

function to12h(time: string) {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'p.m.' : 'a.m.'
  const h12    = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

function normalizeHour(t: string) {
  return t.slice(0, 5)
}

export type BookedSlot = {
  hora:           string   // "14:00" o "14:00:00"
  clienteNombre?: string
  id_cita?:       number
}

const EMPTY_BOOKED_SLOTS: BookedSlot[] = []

interface TimePickerProps {
  value:        string
  onChange:     (val: string) => void
  bookedSlots?: BookedSlot[]
  error?:       string
  label?:       string
  disabled?:    boolean
}

export function TimePicker({
  value,
  onChange,
  bookedSlots = EMPTY_BOOKED_SLOTS,
  error,
  label = 'Hora',
  disabled = false,
}: TimePickerProps) {
  const [popover, setPopover] = useState<string | null>(null)

  // Mapa hora → info de reserva
  const bookedMap = new Map(
    bookedSlots.map(s => [normalizeHour(s.hora), s])
  )

  const available = SLOTS.length - bookedMap.size

  return (
    <div className="flex flex-col gap-2.5">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {available} disponible{available !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-rose-500" />
            {bookedMap.size} ocupado{bookedMap.size !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grilla */}
      <div className="grid grid-cols-5 gap-2">
        {SLOTS.map(slot => {
          const booking    = bookedMap.get(slot)
          const isBooked   = !!booking
          const isSelected = value === slot
          const isOpen     = popover === slot

          return (
            <div key={slot} className="relative">
              <button
                type="button"
                disabled={disabled || (isBooked && !isSelected)}
                onClick={() => {
                  if (isBooked) {
                    setPopover(isOpen ? null : slot)
                  } else {
                    setPopover(null)
                    onChange(slot)
                  }
                }}
                onBlur={() => setTimeout(() => setPopover(null), 150)}
                className={cn(
                  'w-full flex flex-col items-center justify-center rounded-lg border py-3 px-1 gap-0.5',
                  'text-xs font-medium transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  // Disponible — verde
                  !isBooked && !isSelected && [
                    'border-emerald-300 bg-emerald-50 text-emerald-800',
                    'hover:border-emerald-500 hover:bg-emerald-100',
                    'dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
                  ],
                  // Seleccionado
                  isSelected && [
                    'border-emerald-600 bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-400',
                  ],
                  // Ocupado — rojo
                  isBooked && [
                    'border-rose-300 bg-rose-50 text-rose-700 cursor-pointer',
                    'hover:border-rose-500 hover:bg-rose-100',
                    'dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
                  ],
                )}
              >
                <span className="leading-tight font-semibold">{to12h(slot).split(' ')[0]}</span>
                <span className="text-[10px] opacity-80 leading-none">{to12h(slot).split(' ')[1]}</span>

                {/* Indicador de estado */}
                {isBooked
                  ? <XCircle className="h-3 w-3 mt-0.5 text-rose-400" />
                  : isSelected
                    ? <CheckCircle2 className="h-3 w-3 mt-0.5 text-white" />
                    : <CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-400" />
                }
              </button>

              {/* Popover de cita ocupada */}
              {isBooked && isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48
                                rounded-lg border border-rose-200 bg-white shadow-lg p-3
                                dark:bg-card dark:border-rose-900">
                  {/* Puntero */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2
                                  border-4 border-transparent border-t-rose-200
                                  dark:border-t-rose-900" />
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-6 w-6 rounded-full bg-rose-100 flex items-center
                                    justify-center shrink-0 dark:bg-rose-950">
                      <User className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight truncate">
                        {booking.clienteNombre ?? 'Cliente'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Cita #{booking.id_cita} · {to12h(slot)}
                      </p>
                      <span className="mt-1 inline-block text-[10px] font-medium px-1.5 py-0.5
                                       rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                        Horario ocupado
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}