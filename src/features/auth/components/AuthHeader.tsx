// src/features/auth/components/AuthHeader.tsx
// Barra superior compartida en todas las páginas de auth
// Muestra logo/nombre clickeable que regresa al landing
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function AuthHeader() {
  return (
    <header className="w-full h-14 px-4 flex items-center justify-between border-b border-secondary-foreground/10 bg-secondary/95">
      <Link
        to="/"
        className="flex items-center gap-1 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al inicio
      </Link>

    
   
      <div className="w-24" />
    </header>
  )
}
