// src/shared/hooks/useBackendWakeup.ts
// Pinga el backend al cargar para despertar el servidor (Render cold start).
// Solo muestra el splash si el backend no responde en SHOW_AFTER_MS.
// Si el backend ya está caliente (responde rápido), la app carga sin interrupciones.
import { useEffect, useState } from 'react'

const API_URL      = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const SHOW_AFTER_MS = 800    // solo muestra splash si el backend tarda más de esto
const MAX_MS        = 30000  // tiempo máximo de espera antes de continuar igual

export function useBackendWakeup() {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    const controller  = new AbortController()
    const splashTimer = setTimeout(() => setShowSplash(true), SHOW_AFTER_MS)
    const giveUp      = setTimeout(() => { controller.abort(); setShowSplash(false) }, MAX_MS)

    const dismiss = () => { clearTimeout(splashTimer); setShowSplash(false) }

    fetch(`${API_URL}/api/services`, { signal: controller.signal })
      .then(dismiss)
      .catch(dismiss)
      .finally(() => clearTimeout(giveUp))

    return () => { clearTimeout(splashTimer); clearTimeout(giveUp); controller.abort() }
  }, [])

  return showSplash
}
