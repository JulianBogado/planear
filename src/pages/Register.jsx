import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SEOHead from '../components/seo/SEOHead'
import { trackEvent } from '../lib/analytics'
import { useAuth } from '../context/AuthContext'

const INPUT_CLASS = "w-full bg-surface-tint border-0 border-b-2 border-stone-200 focus:border-brand-600 rounded-t-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-0 transition-colors placeholder:text-stone-400"
const LABEL_CLASS = "block text-[10px] font-semibold text-stone-500 uppercase tracking-widest"

export default function Register() {
  const { user, loading: authLoading } = useAuth()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  if (!authLoading && user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!nombre.trim()) { setError('Ingresá tu nombre.'); return }
    if (!apellido.trim()) { setError('Ingresá tu apellido.'); return }
    if (telefono.replace(/\D/g, '').length < 8) { setError('Ingresá un teléfono válido (mínimo 8 dígitos).'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (!/\d/.test(password)) { setError('La contraseña debe incluir al menos un número.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-confirmado`,
        data: { nombre: nombre.trim(), apellido: apellido.trim(), telefono },
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      trackEvent('sign_up', { method: 'email' })
      setRegistered(true)
    }
  }

  const brandPanel = (
    <div className="hidden lg:flex flex-col justify-between w-[42%] p-14"
      style={{ background: 'linear-gradient(145deg, #006d67 0%, #007a8e 40%, #2785aa 100%)' }}>
      <div>
        <div className="flex items-center gap-3 mb-6">
          <svg viewBox="0 0 100 100" width="44" height="44">
            <path d="M 28 88 V 30 A 12 12 0 0 1 40 18 H 72 A 12 12 0 0 1 84 30 V 46 A 12 12 0 0 1 72 58 H 28"
              fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="42" y="26" width="14" height="10" rx="4" fill="rgba(255,255,255,0.5)"/>
            <g fill="white" opacity="0.4">
              <circle cx="46" cy="48" r="3"/><circle cx="54" cy="48" r="3"/>
              <circle cx="62" cy="48" r="3"/><circle cx="70" cy="48" r="3"/>
            </g>
          </svg>
          <h1 className="font-extrabold text-4xl text-white tracking-tight">PLANE.AR</h1>
        </div>
        <p className="text-white/70 text-lg font-medium leading-relaxed">
          Empezá hoy a gestionar tu negocio con claridad.
        </p>
      </div>
      <div className="relative h-48 opacity-20">
        <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full border-4 border-white" />
        <div className="absolute bottom-0 left-24 w-16 h-16 rounded-full bg-white/40" />
        <div className="absolute bottom-12 left-40 w-8 h-8 rounded-full border-2 border-white" />
      </div>
      <p className="text-white/50 text-sm font-medium">Bienvenido a tu nueva herramienta.</p>
    </div>
  )

  if (registered) {
    return (
      <div data-theme="celeste" className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)' }}>
        <SEOHead title="Crear cuenta — PLANE.AR" canonical="https://plane.ar/register" noIndex={true} />
        {brandPanel}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-extrabold text-2xl text-stone-900 mb-3">¡Cuenta creada!</h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-8">
              Te enviamos un correo a <span className="font-semibold text-stone-700">{email}</span>. Revisá tu casilla y confirmá tu cuenta para poder iniciar sesión.
            </p>
            <Link
              to="/login"
              className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full py-3 px-8 text-sm transition-all shadow-sm"
            >
              Ir al login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div data-theme="celeste" className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)' }}>
      <SEOHead
        title="Crear cuenta — PLANE.AR"
        description="Registrate gratis en PLANE.AR y empezá a gestionar las membresías de tu negocio."
        canonical="https://plane.ar/register"
        noIndex={true}
      />
      {brandPanel}

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="font-extrabold text-4xl tracking-tight" style={{ color: '#006d67' }}>PLANE.AR</h1>
            <p className="text-stone-500 mt-2 text-sm font-medium">Creá tu cuenta gratis</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="font-extrabold text-3xl text-stone-900">Crear cuenta</h2>
            <p className="text-stone-500 mt-1 text-sm">Es gratis, sin tarjeta de crédito</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={LABEL_CLASS}>Nombre</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Juan"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="space-y-1">
                <label className={LABEL_CLASS}>Apellido</label>
                <input
                  type="text"
                  required
                  value={apellido}
                  onChange={e => setApellido(e.target.value)}
                  placeholder="García"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={LABEL_CLASS}>Teléfono</label>
              <input
                type="tel"
                required
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="11 2345 6789"
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-1">
              <label className={LABEL_CLASS}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-1">
              <label className={LABEL_CLASS}>Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-1">
              <label className={LABEL_CLASS}>Repetir contraseña</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={INPUT_CLASS}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-2.5">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-full py-3 text-sm transition-all shadow-sm mt-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500 mt-6 font-medium">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-brand-600 font-bold hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
