// src/shared/components/AdminSidebar.tsx
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { clearAuth } from '@/src/features/auth/hooks/useLogin'
import { useState } from 'react'
import {
  Users, Shield, Wrench, Calendar, UserCircle, CreditCard,
  Calculator, ShoppingBag, ClipboardList, ShieldCheck,
  ChevronLeft, ChevronRight, ChevronDown, LayoutDashboard, LogOut,
} from 'lucide-react'
import { cn } from '@/src/shared/lib/utils'

interface NavItem {
  label: string
  href:  string
  icon:  React.ComponentType<{ className?: string }>
}

// Grupos según el flujo real del negocio
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'General',
    items: [
      { label: 'Dashboard',   href: '/admin/dashboard',   icon: LayoutDashboard },
    ],
  },
  {
    label: 'Flujo de venta',
    items: [
      { label: 'Clientes',    href: '/admin/clientes',    icon: UserCircle },
      { label: 'Citas',       href: '/admin/citas',       icon: Calendar },
      { label: 'Ventas',      href: '/admin/ventas',      icon: ShoppingBag },
      { label: 'Servicios',     href: '/admin/pedidos',     icon: ClipboardList },
      { label: 'Pagos',       href: '/admin/pagos',       icon: CreditCard },
    ],
  },
  {
    label: 'Configuración',
    items: [
      { label: 'Tipos de Servicio',   href: '/admin/servicios',   icon: Wrench },
      { label: 'Calculadora', href: '/admin/calculadora', icon: Calculator },
      { label: 'Usuarios',    href: '/admin/usuarios',    icon: Users },
      { label: 'Roles',       href: '/admin/roles',       icon: Shield },
      { label: 'Permisos',    href: '/admin/permisos',    icon: ShieldCheck },
    ],
  },
]

interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(NAV_GROUPS.map(g => [g.label, true]))
  )

  const toggleGroup = (label: string) =>
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }))

  const handleLogout = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={cn(
      'group flex flex-col bg-sidebar border-r border-sidebar-border',
      'h-full min-h-0 shrink-0 transition-all duration-300 ease-in-out',
      collapsed ? 'w-[56px]' : 'w-64',
      className
    )}>

      {/* Header */}
      <div className={cn(
        'shrink-0 flex items-center border-b border-sidebar-border h-14 px-3 gap-2',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <h2 className="text-base font-bold text-sidebar-foreground truncate">
            SoftwArt Panel
          </h2>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="shrink-0 rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft  className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav por grupos */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-2 px-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex flex-col gap-0.5">
          {NAV_GROUPS.map((group, gi) => (
            <li key={group.label}>
              {/* Separador / cabecera de grupo */}
              {collapsed ? (
                gi > 0 && <div className="my-1 border-t border-sidebar-border mx-1" />
              ) : (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-2 py-1 rounded-md',
                    'text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40',
                    'hover:text-sidebar-foreground/70 transition-colors',
                    gi > 0 ? 'mt-3' : 'mt-1'
                  )}
                >
                  <span>{group.label}</span>
                  <ChevronDown className={cn(
                    'h-3 w-3 shrink-0 transition-transform duration-200',
                    openGroups[group.label] ? '' : '-rotate-90'
                  )} />
                </button>
              )}

              {/* Items del grupo — colapsables en sidebar expandido */}
              {(collapsed || openGroups[group.label]) && (
                <ul className="flex flex-col gap-0.5 mt-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    const Icon     = item.icon
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            'flex items-center gap-3 rounded-md text-sm transition-colors px-2 py-2',
                            collapsed ? 'justify-center' : '',
                            isActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer con logout */}
      <div className={cn(
        'shrink-0 border-t border-sidebar-border p-2 flex flex-col gap-1',
        collapsed ? 'items-center' : ''
      )}>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className={cn(
            'flex items-center gap-3 rounded-md text-sm transition-colors px-2 py-2 w-full',
            'text-rose-500 hover:bg-rose-500/10',
            collapsed ? 'justify-center' : ''
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">Cerrar sesión</span>}
        </button>
        {!collapsed && (
          <p className="text-[11px] text-sidebar-foreground/40 text-center truncate px-2">
            SoftwArt Admin v1.0
          </p>
        )}
      </div>
    </aside>
  )
}