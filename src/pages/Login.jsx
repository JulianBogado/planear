import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SEOHead from '../components/seo/SEOHead'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  if (!authLoading && user) return <Navigate to="/dashboard" replace />
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Email o contraseña incorrectos.')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div data-theme="celeste" className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)' }}>
      <SEOHead
        title="Iniciar sesión — PLANE.AR"
        description="Accedé a tu cuenta de PLANE.AR."
        canonical="https://plane.ar/login"
        noIndex={true}
      />
      {/* Left brand panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] p-14"
        style={{ background: 'linear-gradient(145deg, #2785aa 0%, #007a8e 60%, #006d67 100%)' }}>
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
            La herramienta que te ayuda a gestionar tus suscripciones.
          </p>
        </div>

        <div className="relative h-48 opacity-20">
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute bottom-8 left-20 w-20 h-20 rounded-full border-2 border-white" />
          <div className="absolute bottom-0 left-36 w-12 h-12 rounded-full bg-white/30" />
        </div>

        <p className="text-white/50 text-sm font-medium">Gestioná suscripciones con estilo.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="font-extrabold text-4xl tracking-tight" style={{ color: '#006d67' }}>PLANE.AR</h1>
            <p className="text-stone-500 mt-2 text-sm font-medium">Ingresá a tu cuenta</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="font-extrabold text-3xl text-stone-900">Bienvenido</h2>
            <p className="text-stone-500 mt-1 text-sm">Ingresá a tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-surface-tint border-0 border-b-2 border-stone-200 focus:border-brand-600 rounded-t-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-0 transition-colors placeholder:text-stone-400"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-tint border-0 border-b-2 border-stone-200 focus:border-brand-600 rounded-t-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-0 transition-colors placeholder:text-stone-400"
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
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500 mt-6 font-medium">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-brand-600 font-bold hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
