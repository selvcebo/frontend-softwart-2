// src/shared/hooks/useBackendWakeup.ts
// Pinga el backend al cargar para despertar el servidor (Render cold start).
// Muestra el splash al menos MIN_MS ms, máximo MAX_MS antes de rendirse.
import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const MIN_MS  = 3000   // tiempo mínimo que muestra el splash (siempre)
const MAX_MS  = 30000  // tiempo máximo de espera antes de continuar igual

export function useBackendWakeup() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const startedAt = Date.now()

    const markReady = () => {
      const elapsed  = Date.now() - startedAt
      const remaining = Math.max(0, MIN_MS - elapsed)
      setTimeout(() => setReady(true), remaining)
    }

    const controller = new AbortController()
    const giveUp = setTimeout(() => { controller.abort(); markReady() }, MAX_MS)

    fetch(`${API_URL}/api/servicios`, { signal: controller.signal })
      .then(markReady)
      .catch(markReady)
      .finally(() => clearTimeout(giveUp))

    return () => { clearTimeout(giveUp); controller.abort() }
  }, [])

  return ready
}
