# SoftwArt — Frontend

> 🌐 Also available in [English](./README.md)

Panel de administración web y portal de clientes para **Arte Café**, una marquetería PYME en Medellín, Colombia. Los clientes tenían que ir presencialmente para agendar o ver cómo podría quedar su trabajo, y la dueña no contaba con un registro estructurado — lo que generaba conflictos frecuentes por pagos mal manejados y pedidos sin seguimiento.

SoftwArt lleva toda la operación a digital: panel admin completo con dashboard, agendamiento de citas con disponibilidad en tiempo real, ventas por abonos, seguimiento de pedidos, y una landing pública que expande el alcance del negocio más allá de los clientes que ya conocen el local.

🌐 **En producción:** [softwart.online](https://softwart.online)

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Estilos | Tailwind CSS + shadcn/ui |
| Animaciones | Framer Motion |
| Gráficos | Recharts |
| Iconos | Lucide React |
| Notificaciones | Sonner |
| Deploy | Vercel |

---

## Arquitectura — Feature-based

Cada funcionalidad vive completamente encapsulada en su carpeta:

```
src/
├── features/
│   ├── auth/          — login, registro, recuperación, reset
│   ├── dashboard/     — KPIs + landing pública
│   ├── clientes/
│   ├── citas/
│   ├── ventas/        — incluye modal de abonos
│   ├── pedidos/
│   ├── payments/
│   ├── permisos/
│   ├── roles/
│   ├── services/
│   └── users/
└── shared/
    ├── components/    — UI reutilizable (TimePicker, Pagination, FilterBar...)
    ├── hooks/         — usePagination, useOptions, useBackendWakeup
    └── lib/           — apiClient, formatters, withToast, checkAuth
```

Cada feature sigue el patrón `Page + Hook`: el componente solo renderiza, el hook maneja todo el estado y las llamadas a la API.

---

## Decisiones de diseño

### Paginación client-side
Los hooks fetchean con `?limit=500` y paginan en memoria con `usePagination`. Decisión consciente para una PYME con volumen de datos acotado — evita complejidad de paginación server-side y permite búsqueda y filtrado instantáneo sin requests adicionales.

### Auth dual (localStorage vs sessionStorage)
"Recordarme" → `localStorage`. Sin checkbox → `sessionStorage`. `checkAuthValidity()` decodifica el JWT y verifica `exp` antes de cada render protegido, sin hacer requests al backend.

### Sistema de abonos con preview en tiempo real
`VentaAbonoModal` calcula el plan de pagos localmente antes de confirmar — el usuario ve exactamente cuánto va a quedar en cada abono mientras ajusta los parámetros.

### Backend wakeup
`useBackendWakeup` hace un ping silencioso al iniciar la app para despertar el servidor de Render (el free tier hiberna tras inactividad), mejorando el tiempo de primera respuesta real antes de que el usuario llegue al login.

---

## Módulos del sistema

### Panel admin / empleado (`/admin/*`)
- **Dashboard** — ventas del mes, citas de hoy, servicios pendientes, pagos pendientes
- **Clientes** — CRUD completo con búsqueda y filtros
- **Citas** — agenda con TimePicker por slots de 1h (verde/rojo según disponibilidad)
- **Ventas** — creación desde cita, indicador visual de estado de pago (filas verdes = pagadas)
- **Pedidos** — seguimiento de estado por servicio (`Sin empezar` / `En preparación` / `Finalizado`)
- **Pagos** — historial con plan de abonos configurable
- **Configuración** — Servicios, Calculadora, Usuarios, Roles, Permisos

### Portal cliente (`/mi-cuenta`)
- Ver y cancelar citas propias
- Agendar nueva cita con disponibilidad en tiempo real
- Actualizar perfil y cambiar contraseña
- Eliminar cuenta

### Landing pública (`/`)
- Presenta los servicios de Arte Café con galería visual
- CTA de agendamiento directo
- SEO con meta tags, Open Graph, Twitter Card y JSON-LD
- Dominio verificado en Google Search Console

---

## Guards de ruta

```
RequireAuth    → Admin o Empleado → /admin/*
RequireCliente → Cliente          → /mi-cuenta
*              → /login (fallback)
```

---

## Componentes compartidos destacados

| Componente | Descripción |
|---|---|
| `TimePicker` | Slots de 1h con estado visual y popover con info del cliente cuando está ocupado |
| `VentaAbonoModal` | Dos tabs: registrar abono + configurar plan con preview en tiempo real |
| `AdminSidebar` | Colapsable (56px / 256px), agrupado por flujo de negocio |
| `FilterBar` + `SearchInput` | Búsqueda y filtros consistentes en todos los módulos |
| `Pagination` | Paginación con selector de tamaño de página |
| `withToast` | Envuelve cualquier Promise con feedback visual automático |

---

## Sistema de diseño

```
primary:   #805533  — sienna
secondary: #002926  — dark teal
accent:    #D4B896  — warm tan
```

Las páginas de auth tienen un sistema visual propio: fondo `#002926`, card blanca con sombra pronunciada, tipografía serif itálica en headings, botones sienna.

---

## Correr localmente

```bash
# 1. Clonar e instalar
git clone https://github.com/selvcebo/softwart-frontend
cd softwart-frontend
npm install

# 2. Configurar variable de entorno
echo "VITE_API_URL=http://localhost:3001" > .env

# 3. Correr en desarrollo
npm run dev
# → http://localhost:3000
```

> El backend debe estar corriendo en `:3001`. Ver [softwart-backend](https://github.com/selvcebo/softwart-backend).

---

## Repositorios relacionados

- [softwart-backend](https://github.com/selvcebo/softwart-backend) — Node.js + Express + TypeScript + PostgreSQL
- [softwart-mobile](https://github.com/selvcebo/softwart-mobile) — Flutter + Clean Architecture

---

## Contexto académico

Proyecto de grado — Tecnología en Análisis y Desarrollo de Software, SENA (Medellín, Colombia).
Desarrollado por **Sergio E. León V.**
