/// RegisterPage.tsx

import { useRegister } from '../hooks/useRegister'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/src/shared/components/ui/button'
import { Input } from '@/src/shared/components/ui/input'
import { Label } from '@/src/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/shared/components/ui/select'

type RegisterDto = {
  tipoDocumento: string
  documento: string
  nombre: string
  correo: string
  telefono: string
  clave: string
}



const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'PP', label: 'Pasaporte (PP)' },
]

export function RegisterPage() {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') ?? undefined
  const { onSubmit, isLoading, error } = useRegister(redirect)
  const [tipoDocumento, setTipoDocumento] = useState('')
  const [documento, setDocumento] = useState('')
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [clave, setClave] = useState('')
  const [confirmarClave, setConfirmarClave] = useState('')

  const passwordsMatch = clave === confirmarClave
  const showMismatchError = confirmarClave.length > 0 && !passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordsMatch) return

    await onSubmit({
      tipoDocumento,
      documento,
      nombre,
      correo,
      telefono,
      clave,
    })
  }

  const isFormValid =
    tipoDocumento &&
    documento &&
    nombre &&
    correo &&
    telefono &&
    clave &&
    confirmarClave &&
    passwordsMatch

  return (
    <div className="w-full max-w-md flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Crear cuenta</h1>
          <p className="text-muted-foreground mt-1">Completa tus datos para registrarte</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 col-span-2">
  {/* Columna 1: Tipo de documento */}
  <div className="flex flex-col gap-2">
    <Label htmlFor="tipoDocumento" className="text-foreground">
      Tipo de documento <span className="text-red-500">*</span>
    </Label>
    <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
      <SelectTrigger className="bg-card text-foreground border-border">
        <SelectValue placeholder="Seleccionar tipo" />
      </SelectTrigger>
      <SelectContent>
        {DOCUMENT_TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* Columna 2: Número de documento */}
  <div className="flex flex-col gap-2">
    <Label htmlFor="documento" className="text-foreground">
      Número de documento <span className="text-red-500">*</span>
    </Label>
    <Input
      id="documento"
      type="text"
      value={documento}
      onChange={(e) => setDocumento(e.target.value)}
      placeholder="1234567890"
      className="bg-card text-foreground border-border"
      required
    />
  </div>
</div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre" className="text-foreground">
              Nombre completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan Pérez"
              className="bg-card text-foreground border-border"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="correo" className="text-foreground">
              Correo electrónico <span className="text-red-500">*</span>
            </Label>
            <Input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.com"
              className="bg-card text-foreground border-border"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="telefono" className="text-foreground">
              Teléfono <span className="text-red-500">*</span>
            </Label>
            <Input
              id="telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="3001234567"
              className="bg-card text-foreground border-border"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="clave" className="text-foreground">
              Contraseña <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clave"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="••••••••"
              className="bg-card text-foreground border-border"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmarClave" className="text-foreground">
              Confirmar contraseña <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmarClave"
              type="password"
              value={confirmarClave}
              onChange={(e) => setConfirmarClave(e.target.value)}
              placeholder="••••••••"
              className="bg-card text-foreground border-border"
              required
            />
            {showMismatchError && (
              <p className="text-sm text-destructive mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
          >
            {isLoading ? 'Cargando...' : 'Registrarse'}
          </Button>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
    </div>
  )
}
