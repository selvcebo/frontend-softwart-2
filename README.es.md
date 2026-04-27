# SoftwArt — Frontend

> 🌐 Also available in [English](./README.md)

Panel de administración y portal de clientes para **Arte Café**, una marquetería PYME en Medellín, Colombia. Digitaliza el flujo completo del negocio: agendamiento de citas, ventas con planes de abono flexibles, seguimiento de pedidos, gestión de pagos y un portal de autoservicio para clientes.

🌐 **En producción:** [softwart.online](https://softwart.online)

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Estilos | Tailwind CSS + shadcn/ui |
| Animaciones | Framer Motion (landing + páginas auth) |
| Gráficos | Recharts (KPIs del dashboard) |
| Iconos | lucide-react |
| Notificaciones | Sonner |
| Deploy | Vercel |

---

## Arquitectura — Feature-based

Cada dominio es una carpeta completamente autocontenida bajo `src/features/`:

```
src/
├── features/
│   ├── auth/          — Login, Register, Recovery, ResetPassword
│   ├── dashboard/     — KPI cards, gráficos Recharts
│   ├── clients/       — Gestión de clientes
│   ├── appointments/  — Agendamiento + TimePicker
│   ├── sales/         — Ventas + SaleInstallmentModal
│   ├── orders/        — Seguimiento de pedidos
│   ├── payments/      — Gestión de pagos
│   ├── services/      — Catálogo de servicios
│   ├── users/         — Gestión de usuarios
│   ├── roles/         — Gestión de roles
│   ├── permissions/   — Gestión de permisos
│   ├── calculator/    — Calculadora de precios de marcos
│   └── account/       — Portal de autoservicio para clientes
└── shared/
    ├── components/    — AdminSidebar, TimePicker, SearchInput, Pagination...
    ├── hooks/         — usePagination, useOptions
    └── lib/           — apiClient, formatters, withToast, checkAuth
```

**Patrón**: el componente solo renderiza — el hook maneja todo el estado y las llamadas a la API.

```tsx
const { items, isLoading, onCreate, onEdit, onDelete } = useModulo()
```

---

## Funcionalidades principales

### Panel admin (`/admin/*`)
- Dashboard con KPIs en tiempo real (ventas del mes, citas de hoy, pedidos y pagos pendientes)
- Alert chips operativos: popovers clicables con lista de ítems (ventas sin pago, citas sin venta, pedidos atrasados), ignorar por ítem y redirección directa a la sección con el buscador pre-llenado
- CRUD completo para todas las entidades del negocio
- Agendamiento de citas con disponibilidad de slots en tiempo real
- Ventas con planes de abono configurables y preview de pagos en vivo
- Sidebar colapsable (56px/256px), dropdown de usuario en el topbar (correo, rol, cerrar sesión)
- Tabla de Servicios muestra nombre de cliente con referencia de venta; cliente buscable por nombre

### Portal cliente (`/my-account`)
- Topbar sticky con avatar (inicial del nombre), nombre del cliente y dropdown de sesión — sin navbar separada
- Chips de resumen bajo el saludo: próxima cita pendiente (fecha + hora) o "Sin citas próximas"; conteo de servicios activos — ambos clickeables para abrir el dropdown correspondiente
- Grid en dos filas: citas + servicios (arriba, `items-start`, dropdowns colapsables) / datos + contraseña (abajo, stretch para igualar alto)
- Todas las cards con borde izquierdo de acento (`border-l-4 border-l-primary`)
- Agendar citas mediante modal con verificación de slots en tiempo real (`GET /api/account/availability`)
- Ver y cancelar citas propias; lista ordenada por fecha ascendente (más próxima arriba); layout responsive en mobile
- Seguimiento de servicios activos con estado en tiempo real (Sin empezar / En preparación / Finalizado)
- Actualizar perfil y cambiar contraseña (ambos formularios con labels encima de cada campo)
- Eliminar cuenta

### Landing pública (`/`)
- Galería de servicios (solo tipos activos, filtrados con `?activos=true`)
- Hero ajustado al alto del viewport (`h-dvh`), tipografía responsiva hasta 2xl
- CTA de agendamiento (modal para invitados, `/my-account?nueva-cita=true` para clientes autenticados)
- SEO completo: título keyword-first, OG tags, Twitter Card, JSON-LD schema LocalBusiness, sitemap.xml, geo tags

---

## Componentes destacados

| Componente | Descripción |
|---|---|
| `TimePicker` | Slots de 1h (13:00–17:00), verde/rojo, popover muestra el cliente agendado |
| `SaleInstallmentModal` | Dos tabs: registrar pago + configurar plan con preview en tiempo real |
| `AdminSidebar` | Sidebar colapsable (56px/256px), agrupado por flujo de negocio |
| `withToast(promise, msg)` | Envuelve cualquier operación async con toast automático de éxito/error |

---

## Decisiones de diseño

**Paginación client-side**: los hooks fetchean con `?limit=500` y paginan en memoria con `usePagination`. Apropiado para el volumen de datos de una PYME — evita la complejidad de paginación server-side.

**Almacenamiento de auth + recordarme**: el token va a `localStorage` ("recordarme") o `sessionStorage` (solo sesión). `clearAuth()` limpia ambos. `checkAuthValidity()` decodifica el JWT localmente y verifica `exp` — sin round-trip al backend. Cuando "recordarme" está marcado, correo y contraseña (codificados con btoa) se guardan en `saved_creds` para que el formulario de login se auto-llene en la próxima visita.

**Wakeup del backend**: la app móvil complementaria hace un ping a `/api/dashboard` al iniciar para pre-calentar el servidor de Render (free tier) antes de que el usuario se autentique.

---

## Rutas

```
/                    → LandingPage (pública)
/login               → LoginPage
/register            → RegisterPage
/recover             → RecoveryPage
/reset               → ResetPasswordPage
/my-account          → MyAccountPage (guard RequireCliente)
/admin/*             → Panel admin (guard RequireAuth — solo Admin/Empleado)
*                    → NotFoundPage
```

Flujo de registro con redirect:
```
/register?redirect=appointment → /login?redirect=appointment → /my-account?new-appointment=true
```

---

## Correr localmente

```bash
git clone https://github.com/SoftwArt/frontend-softwart-2
cd frontend-softwart-2
npm install
cp .env.example .env   # configurar VITE_API_URL=http://localhost:3001
npm run dev            # → http://localhost:3000
```

**Variable de entorno (Vercel):** `VITE_API_URL=https://softwart-backend.onrender.com`

---

## Repositorios relacionados

- [softwart-backend](https://github.com/SoftwArt/softwart-backend) — Node.js + Express + TypeScript + PostgreSQL
- [mobile-softwart](https://github.com/SoftwArt/mobile-softwart) — Flutter + Clean Architecture
- [softwart-docs](https://github.com/SoftwArt/softwart-docs) — Docs de API (Redoc), diagramas C4, MHU, documentación SCRUM

---

## Contexto académico

Proyecto de grado — Tecnología en Análisis y Desarrollo de Software, SENA (Medellín, Colombia).
Desarrollado por **Sergio E. León V.**

---

Desarrollado con AI-assisted development usando [Claude](https://claude.ai) y [Claude Code](https://claude.ai/code) de Anthropic.
