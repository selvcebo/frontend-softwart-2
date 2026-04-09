// src/shared/lib/formatDate.ts
// Convierte "2025-03-15" o Date a "15 mar 2025"
// Uso: formatDate(venta.fecha) → "15 mar 2025"
//      formatDate(cita.fecha, 'long') → "sábado, 15 de marzo de 2025"

export function formatDate(
  fecha: string | Date | null | undefined,
  style: 'short' | 'long' = 'short'
): string {
  if (!fecha) return '—'
  const d = typeof fecha === 'string' ? new Date(fecha + 'T00:00:00') : fecha
  if (isNaN(d.getTime())) return String(fecha)

  if (style === 'long') {
    return d.toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  // "15 mar 2025"
  const day   = d.getDate()
  const month = d.toLocaleDateString('es-CO', { month: 'short' })
    .replace('.', '')           // quitar punto si lo hay
  const year  = d.getFullYear()
  return `${day} ${month} ${year}`
}

// Para horas: "14:00:00" → "2:00 PM"
export function formatTime(hora: string | null | undefined): string {
  if (!hora) return '—'
  const [h, m] = hora.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12    = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}