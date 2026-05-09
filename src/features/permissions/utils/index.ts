export const ADMIN_ROL_ID = 1

export const MODULO_LABELS: Record<string, string> = {
  CUENTA:    '👤 Mi Cuenta (Cliente)',
  CLIENTES:  '🧑‍💼 Clientes',
  CITAS:     '📅 Citas',
  VENTAS:    '💰 Ventas',
  PEDIDOS:   '📦 Pedidos',
  PAGOS:     '💳 Pagos',
  MARCOS:    '🖼️ Marcos / Calculadora',
  SERVICIOS: '🔧 Tipos de Servicio',
  USUARIOS:  '👥 Usuarios',
  ROLES:     '🔑 Roles',
  PERMISOS:  '🛡️ Permisos',
}

export const MODULO_ORDER = [
  'CUENTA', 'CLIENTES', 'CITAS', 'VENTAS', 'PEDIDOS',
  'PAGOS', 'MARCOS', 'SERVICIOS', 'USUARIOS', 'ROLES', 'PERMISOS',
]

export function getModulo(nombre: string): string {
  return nombre.split('.')[0] ?? 'GENERAL'
}

export function getAccion(nombre: string): string {
  return nombre.split('.')[1] ?? nombre
}
