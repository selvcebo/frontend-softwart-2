# SoftwArt — Frontend

> 🇨🇴 También disponible en [español](./README.es.md)

Admin panel and client portal for **Arte Café**, a framing and marquetry shop in Medellín, Colombia. Digitizes the full business workflow: appointment scheduling, sales with flexible installment plans, order tracking, payment management, and a self-service client portal.

🌐 **Live:** [softwart.online](https://softwart.online)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion (landing + auth pages) |
| Charts | Recharts (dashboard KPIs) |
| Icons | lucide-react |
| Notifications | Sonner |
| Deploy | Vercel |

---

## Architecture — feature-based

Each domain is a self-contained folder under `src/features/`:

```
src/
├── features/
│   ├── auth/          — Login, Register, Recovery, ResetPassword
│   ├── dashboard/     — KPI cards, Recharts graphs
│   ├── clients/       — Client management
│   ├── appointments/  — Scheduling + TimePicker
│   ├── sales/         — Sales + SaleInstallmentModal
│   ├── orders/        — Order tracking
│   ├── payments/      — Payment management
│   ├── services/      — Service catalog
│   ├── users/         — User management
│   ├── roles/         — Role management
│   ├── permissions/   — Permission management
│   ├── calculator/    — Frame price calculator
│   └── account/       — Client self-service portal
└── shared/
    ├── components/    — AdminSidebar, TimePicker, SearchInput, Pagination...
    ├── hooks/         — usePagination, useOptions
    └── lib/           — apiClient, formatters, withToast, checkAuth
```

**Pattern**: the component only renders — the hook owns all state and API calls.

```tsx
const { items, isLoading, onCreate, onEdit, onDelete } = useModulo()
```

---

## Key features

### Admin panel (`/admin/*`)
- Dashboard with live KPIs (monthly sales, today's appointments, pending orders/payments)
- Operational alert chips: clickable popovers listing items (unpaid sales, appointments without sale, delayed orders) with per-item ignore and one-click redirect to the relevant section with search pre-filled
- Full CRUD for all business entities
- Appointment scheduling with real-time slot availability
- Sales with configurable installment plans and live payment preview
- Sidebar collapsible between 56px (icon-only) and 256px (expanded), user dropdown in topbar (email, role, logout)
- Orders table shows client name with sale reference below; client name searchable

### Client portal (`/my-account`)
- Sticky topbar with avatar (client name initial), client name, and logout dropdown — no separate navbar
- Summary chips below greeting: next upcoming appointment (date + time) or "Sin citas próximas"; active service count — both clickable to open their dropdown
- Two-row grid: appointments + services (top, `items-start`, collapsible dropdowns) / profile + password (bottom, stretch for equal height)
- All cards with left accent border (`border-l-4 border-l-primary`)
- Book new appointments via modal with real-time slot availability (`GET /api/account/availability`)
- View and cancel own appointments; list sorted by date ascending (soonest first); mobile-friendly row layout; AlertDialog confirmation with date and time shown
- Track active services with live status (Sin empezar / En preparación / Finalizado)
- Update profile and change password (both forms with labeled fields, no placeholder-only inputs)
- Delete account with AlertDialog confirmation

### Public landing (`/`)
- Service gallery (only active service types shown, filtered via `?activos=true`)
- Hero section fitted to viewport height (`h-dvh`), responsive typography up to 2xl
- Appointment booking CTA (modal for guests, `/my-account?nueva-cita=true` for logged-in clients)
- Full SEO: keyword-first title, OG tags, Twitter Card, JSON-LD LocalBusiness schema, sitemap.xml, geo tags

---

## Notable components

| Component | Description |
|---|---|
| `TimePicker` | 1-hour slots (13:00–17:00), green/red, popover shows booked client |
| `SaleInstallmentModal` | Two tabs: register payment + configure plan with live preview |
| `AdminSidebar` | Collapsible sidebar (56px/256px), grouped by business flow |
| `withToast(promise, msg)` | Wraps any async op with automatic success/error toast |

---

## Design decisions

**Client-side pagination**: hooks fetch with `?limit=500` and paginate in memory via `usePagination`. Appropriate for a PYME's data volume — avoids backend pagination complexity.

**Auth storage + remember me**: token goes to `localStorage` ("remember me") or `sessionStorage` (session only). `clearAuth()` clears both. `checkAuthValidity()` decodes JWT locally and checks `exp` — no backend round-trip needed. When "remember me" is checked, email and password (btoa-encoded) are also saved under `saved_creds` so the login form auto-fills on the next visit.

**Hook/component separation**: components are pure JSX + local UI state (open/close toggles). All server state, API calls, form state, submit handlers, validation, and derived values live in the feature hook. Pure helper functions (formatters, badge class resolvers) live in a co-located `utils.ts`. Destructive actions use `AlertDialog` (shadcn/ui) instead of `window.confirm()`.

**Backend wakeup**: the mobile companion app pings `/api/dashboard` on launch to pre-warm the Render free-tier server before the user authenticates.

---

## Routes

```
/                    → LandingPage (public)
/login               → LoginPage
/register            → RegisterPage
/recover             → RecoveryPage
/reset               → ResetPasswordPage
/my-account          → MyAccountPage (RequireCliente guard)
/admin/*             → Admin panel (RequireAuth guard — Admin/Empleado only)
*                    → NotFoundPage
```

Registration with redirect flow:
```
/register?redirect=appointment → /login?redirect=appointment → /my-account?new-appointment=true
```

---

## Running locally

```bash
git clone https://github.com/SoftwArt/frontend-softwart-2
cd frontend-softwart-2
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:3001
npm run dev            # → http://localhost:3000
```

**Environment variable (Vercel):** `VITE_API_URL=https://softwart-backend.onrender.com`

---

## Related repositories

- [softwart-backend](https://github.com/SoftwArt/softwart-backend) — Node.js + Express + TypeScript + PostgreSQL
- [mobile-softwart](https://github.com/SoftwArt/mobile-softwart) — Flutter + Clean Architecture
- [softwart-docs](https://github.com/SoftwArt/softwart-docs) — API docs (Redoc), C4 diagrams, MHU, SCRUM documentation

---

## Academic context

Capstone project — Technology in Software Analysis and Development, SENA (Medellín, Colombia).
Built by **Sergio E. León V.**

---

Built with AI-assisted development using [Claude](https://claude.ai) and [Claude Code](https://claude.ai/code) by Anthropic.
