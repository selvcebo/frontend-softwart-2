// ============================================================
// src/shared/hooks/useOptions.ts
// Fetchers ligeros que devuelven ComboboxOption[] para los
// selects relacionales en Citas, Ventas, Pedidos y Pagos.
// ============================================================
import { useState, useEffect } from 'react'
import { apiRequest } from '@/src/shared/lib/apiClient'
import type { ComboboxOption } from '@/src/shared/components/Combobox'

type ApiResponse<T> = { success: boolean; data: T; meta?: unknown }

// ── Clientes ──────────────────────────────────────────────────
type ClienteOption = { id_cliente: number; nombre: string; documento: string }

export function useClientesOptions() {
  const [options,   setOptions]   = useState<ComboboxOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiRequest<ApiResponse<ClienteOption[]>>('/api/clientes?limit=100')
      .then((res) => {
        setOptions(
          (res.data ?? []).map((c) => ({
            value:    String(c.id_cliente),
            label:    c.nombre,
            sublabel: c.documento,
          }))
        )
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return { options, isLoading }
}

// ── Ventas ────────────────────────────────────────────────────
type VentaOption = { id_venta: number; fecha: string; total: number; num_abonos?: number; pagos?: unknown[]; cliente?: { id_cliente: number; nombre?: string } | null }

export function useVentasOptions() {
  const [options,    setOptions]    = useState<ComboboxOption[]>([])
  const [rawVentas,  setRawVentas]  = useState<VentaOption[]>([])
  const [isLoading,  setIsLoading]  = useState(true)

  useEffect(() => {
    apiRequest<ApiResponse<VentaOption[]>>('/api/ventas?limit=100')
      .then((res) => {
        const data = res.data ?? []
        setRawVentas(data)
        setOptions(
          data.map((v) => ({
            value:    String(v.id_venta),
            label:    `Venta #${v.id_venta} — ${new Date(v.fecha).toLocaleDateString('es-CO')}`,
            sublabel: v.total?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
          }))
        )
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return { options, rawVentas, isLoading }
}

// ── Citas ─────────────────────────────────────────────────────
type CitaOption = { id_cita: number; fecha: string; hora: string; cliente?: { id_cliente: number } | null }

export function useCitasOptions() {
  const [options,   setOptions]   = useState<ComboboxOption[]>([])
  const [rawCitas,  setRawCitas]  = useState<CitaOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiRequest<ApiResponse<CitaOption[]>>('/api/citas?limit=100')
      .then((res) => {
        const data = res.data ?? []
        setRawCitas(data)
        setOptions(
          data.map((c) => ({
            value:    String(c.id_cita),
            label:    `Cita #${c.id_cita} — ${new Date(c.fecha).toLocaleDateString('es-CO')}`,
            sublabel: c.hora,
          }))
        )
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return { options, rawCitas, isLoading }
}

// ── Servicios ─────────────────────────────────────────────────
type ServicioOption = { id_servicio: number; nombre: string }

export function useServiciosOptions() {
  const [options,   setOptions]   = useState<ComboboxOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiRequest<ApiResponse<ServicioOption[]>>('/api/servicios')
      .then((res) => {
        setOptions(
          (res.data ?? []).map((s) => ({
            value: String(s.id_servicio),
            label: s.nombre,
          }))
        )
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return { options, isLoading }
}

// ── Marcos ────────────────────────────────────────────────────
type MarcoOption = { id_marco: number; codigo: string; precio_ensamblado: number }

export function useMarcoOptions() {
  const [options,   setOptions]   = useState<ComboboxOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiRequest<ApiResponse<MarcoOption[]>>('/api/marcos')
      .then((res) => {
        setOptions(
          (res.data ?? []).map((m) => ({
            value:    String(m.id_marco),
            label:    m.codigo,
            sublabel: m.precio_ensamblado?.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }),
          }))
        )
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  return { options, isLoading }
}