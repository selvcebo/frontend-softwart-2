# SoftwArt — Frontend

> 🇨🇴 También disponible en [español](./README.es.md)

Web admin panel and client portal for **Arte Café**, a framing and marquetry shop in Medellín, Colombia. Customers previously had to visit in person to book an appointment or see how their piece might turn out — and the owner had no structured record system, which led to constant disputes over payments and orders.

SoftwArt brings the entire operation online: a full admin dashboard, appointment scheduling with real-time availability, flexible installment-based sales, order tracking, and a public landing page that expands the business's reach beyond walk-ins.

🌐 **Live:** [softwart.online](https://softwart.online)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | Sonner |
| Deploy | Vercel |

---

## Architecture — Feature-based

Each feature is fully self-contained in its own folder:

```
src/
├── features/
│   ├── auth/          — login, register, password recovery & reset
│   ├── dashboard/     — KPIs + public landing page
│   ├── clientes/
│   ├── citas/
│   ├── ventas/        — includes installment payment modal
│   ├── pedidos/
│   ├── payments/
│   ├── permisos/
│   ├── roles/
│   ├── services/
│   └── users/
└── shared/
    ├── components/    — reusable UI (TimePicker, Pagination, FilterBar...)
    ├── hooks/         — usePagination, useOptions, useBackendWakeup
    └── lib/           — apiClient, formatters, withToast, checkAuth
```

Every feature follows a `Page + Hook` pattern: the component only renders, the hook owns all state and API calls.

---

## Design decisions

### Client-side pagination
All hooks fetch with `?limit=500` and paginate in memory via `usePagination`. Deliberate choice for a PYME with bounded data volume — avoids server-side pagination complexity and enables instant search and filtering with no extra requests.

### Dual auth storage
"Remember me" checked → `localStorage`. Unchecked → `sessionStorage`. `checkAuthValidity()` decodes the JWT and checks `exp` before every protected render, without hitting the backend.

### Installment plan with live preview
`VentaAbonoModal` calculates the payment schedule locally before confirming — the user sees exactly how much each installment will be as they adjust the parameters in real time.

### Backend wakeup
`useBackendWakeup` sends a silent ping on app load to wake up the Render server (free tier hibernates after inactivity), improving real first-response time before the user reaches the login screen.

---

## System modules

### Admin / employee panel (`/admin/*`)
- **Dashboard** — monthly sales, today's appointments, pending orders, pending payments
- **Clients** — full CRUD with search and filters
- **Appointments** — schedule with 1h slot TimePicker (green/red availability indicator)
- **Sales** — create from appointment, visual payment status indicator (green rows = fully paid)
- **Orders** — per-service status tracking (`Sin empezar` / `En preparación` / `Finalizado`)
- **Payments** — history with configurable installment plan
- **Settings** — Services, Calculator, Users, Roles, Permissions

### Client portal (`/mi-cuenta`)
- View and cancel own appointments
- Book new appointment with real-time availability
- Update profile and change password
- Delete account

### Public landing (`/`)
- Presents Arte Café's services with visual gallery
- Direct booking CTA
- SEO: meta tags, Open Graph, Twitter Card, JSON-LD
- Domain verified in Google Search Console

---

## Route guards

```
RequireAuth    → Admin or Empleado → /admin/*
RequireCliente → Cliente           → /mi-cuenta
*              → /login (fallback)
```

---

## Shared components worth noting

| Component | Description |
|---|---|
| `TimePicker` | 1h slots with availability state and booked-slot popover showing client info |
| `VentaAbonoModal` | Two tabs: register payment + configure plan with live preview |
| `AdminSidebar` | Collapsible (56px / 256px), grouped by business flow |
| `FilterBar` + `SearchInput` | Consistent search and filtering across all modules |
| `Pagination` | Page navigation with configurable page size |
| `withToast` | Wraps any Promise with automatic visual feedback |

---

## Design system

```
primary:   #805533  — sienna
secondary: #002926  — dark teal
accent:    #D4B896  — warm tan
```

Auth pages share a distinct visual system: `#002926` background, white card with heavy shadow, serif italic headings, sienna CTA buttons.

---

## Running locally

```bash
# 1. Clone and install
git clone https://github.com/selvcebo/softwart-frontend
cd softwart-frontend
npm install

# 2. Set up environment variable
echo "VITE_API_URL=http://localhost:3001" > .env

# 3. Start dev server
npm run dev
# → http://localhost:3000
```

> The backend must be running on `:3001`. See [softwart-backend](https://github.com/selvcebo/softwart-backend).

---

## Related repositories

- [softwart-backend](https://github.com/SoftwArt/softwart-backend) — Node.js + Express + TypeScript + PostgreSQL
- [softwart-mobile](https://github.com/SoftwArt/softwart-mobile) — Flutter + Clean Architecture
- [softwart-docs](https://github.com/SoftwArt/softwart-docs) — C4 diagrams, MHU, project documentation

---

## Academic context

Capstone project — Technology in Software Analysis and Development, SENA (Medellín, Colombia).
Built by **Sergio E. León V.**

---

## Development tools

Built with AI-assisted development using [Claude](https://claude.ai) and [Claude Code](https://claude.ai/code) by Anthropic.
