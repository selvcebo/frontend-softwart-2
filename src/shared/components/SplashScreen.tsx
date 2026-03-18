// src/shared/components/SplashScreen.tsx
// Pantalla de carga mientras el backend despierta (Render cold start)
export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-sidebar flex flex-col items-center justify-center gap-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-sidebar-foreground mb-2 tracking-tight">
          SoftwArt
        </h1>
        <p className="text-sidebar-foreground/60 text-base">Tu marquetería de confianza</p>
      </div>

      {/* Spinner */}
      <div className="w-10 h-10 rounded-full border-4 border-sidebar-foreground/20 border-t-primary animate-spin" />

      <p className="text-sidebar-foreground/40 text-xs tracking-wide uppercase">Cargando</p>
    </div>
  )
}
