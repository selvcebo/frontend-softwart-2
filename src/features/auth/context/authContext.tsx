// ============================================================
// src/features/auth/context/AuthContext.tsx
//
// FIX 1: useEffect eliminado — no se usaba.
// FIX 2: inicialización de `user` leía localStorage.getItem('user')
//         pero useLogin nunca guarda esa key. Se corrigió para leer
//         las claves individuales que sí guarda useLogin.
// ============================================================
import { createContext, useState, ReactNode } from 'react'

interface AuthUser {
  id_usuario: number
  correo: string
  rol: string            // 'Admin' | 'Empleado' | 'Cliente'
  id_cliente: number | null
  nombre: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
  isAdmin: boolean
  isEmpleado: boolean
  isCliente: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Lee las claves individuales que guarda useLogin
function readUserFromStorage(): AuthUser | null {
  const token = localStorage.getItem('token')
  if (!token) return null
  const id_usuario = Number(localStorage.getItem('id_usuario'))
  const rol = localStorage.getItem('rol')
  const nombre = localStorage.getItem('nombre')
  const id_cliente = localStorage.getItem('id_cliente')
  if (!id_usuario || !rol) return null
  return {
    id_usuario,
    correo: '',               // el correo no se guarda en localStorage — viene del perfil
    rol,
    nombre: nombre || null,
    id_cliente: id_cliente ? Number(id_cliente) : null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser]   = useState<AuthUser | null>(readUserFromStorage)

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('token',      newToken)
    localStorage.setItem('rol',        newUser.rol)
    localStorage.setItem('nombre',     newUser.nombre ?? '')
    localStorage.setItem('id_usuario', String(newUser.id_usuario))
    localStorage.setItem('id_cliente', String(newUser.id_cliente ?? ''))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('rol')
    localStorage.removeItem('nombre')
    localStorage.removeItem('id_usuario')
    localStorage.removeItem('id_cliente')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAdmin:    user?.rol === 'Admin',
        isEmpleado: user?.rol === 'Empleado',
        isCliente:  user?.rol === 'Cliente',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

