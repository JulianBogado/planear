import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Check, X, Zap, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../hooks/useBusiness'
import { supabase } from '../lib/supabase'
import { TIER_INFO } from '../constants/tiers'
import SEOHead from '../components/seo/SEOHead'

const TIERS_ORDER = ['free', 'starter', 'pro']

export default function Pricing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { business } = useBusiness(user?.id)
  const currentTier = business?.tier ?? 'free'

  const [loadingTier, setLoadingTier] = useState(null)
  const [selectedTier, setSelectedTier] = useState('pro')

  async function handleSubscribe(tier) {
    if (!user) { navigate('/register'); return }
    if (tier === 'free' || tier === currentTier) return

    setLoadingTier(tier)
    try {
      // getUser() validates server-side and refreshes the token if expired
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) { navigate('/login'); return }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { tier },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (error || !data?.init_point) {
        alert('No se pudo iniciar el pago. Intentá de nuevo.')
        return
      }
      const url = data.init_point
      if (
        !url.startsWith('https://www.mercadopago.com.ar/') &&
        !url.startsWith('https://sandbox.mercadopago.com.ar/')
      ) {
        alert('Error: URL de pago inválida.')
        return
      }
      window.location.href = url
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <div data-theme="celeste" className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <SEOHead
        title="Precios de PLANE.AR | Planes para gestionar suscripciones"
        description="Conocé los precios de PLANE.AR y compará los planes disponibles para administrar suscripciones, pagos, renovaciones y turnos de tu negocio."
        canonical="https://plane.ar/precios"
      />
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <span className="font-extrabold text-xl tracking-tight" style={{ color: '#2785aa' }}>PLANE.AR</span>
        <Link
          to={user ? '/dashboard' : '/login'}
          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={15} /> {user ? 'Volver al dashboard' : 'Iniciar sesión'}
        </Link>
      </header>

      {/* Hero */}
      <div className="text-center px-6 pt-10 pb-12 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
          style={{ backgroundColor: 'rgba(39,133,170,0.1)', color: '#2785aa' }}>
          <Zap size={12} /> Servicios y precios
        </div>
        <h1 className="font-extrabold text-4xl text-stone-900 mb-3">
          Elegí el plan que<br />se adapta a tu negocio
        </h1>
        <p className="text-stone-500 text-lg">
          Empezá gratis, crecé cuando lo necesites.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="px-4 pb-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TIERS_ORDER.map(tierKey => {
            const info = TIER_INFO[tierKey]
            const isCurrentPlan = currentTier === tierKey
            const isPro = tierKey === 'pro'
            const isActive = selectedTier === tierKey

            let ctaLabel = 'Suscribirse'
            let ctaDisabled = false

            if (tierKey === 'free') {
              ctaLabel = user ? 'Plan actual' : 'Empezar gratis'
              ctaDisabled = !!user && isCurrentPlan
            } else if (isCurrentPlan) {
              ctaLabel = 'Plan actual'
              ctaDisabled = true
            } else if (user && TIERS_ORDER.indexOf(tierKey) < TIERS_ORDER.indexOf(currentTier)) {
              ctaLabel = 'Bajar de plan'
            }

            return (
              <div
                key={tierKey}
                onClick={() => setSelectedTier(tierKey)}
                className={`relative rounded-3xl p-6 flex flex-col cursor-pointer transition-all ${
                  isActive
                    ? 'text-white shadow-xl'
                    : 'bg-white border border-stone-100 shadow-sm hover:shadow-md'
                }`}
                style={isActive ? { background: 'linear-gradient(145deg, #2785aa 0%, #007a8e 60%, #007a8e 100%)' } : {}}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#C0A1C3' }}>
                    Más popular
                  </div>
                )}

                <div className="mb-5">
                  <h2 className={`font-extrabold text-xl mb-0.5 ${isActive ? 'text-white' : 'text-stone-900'}`}>
                    {info.label}
                  </h2>
                  <p className={`text-xs mb-4 ${isActive ? 'text-white/70' : 'text-stone-400'}`}>
                    {info.description}
                  </p>
                  <p className={`font-extrabold text-3xl ${isActive ? 'text-white' : 'text-stone-900'}`}>
                    {info.priceLabel}
                  </p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {info.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={15} className="mt-0.5 shrink-0"
                        style={isActive ? { color: 'rgba(255,255,255,0.8)' } : { color: '#2785aa' }} />
                      <span className={isActive ? 'text-white/90' : 'text-stone-700'}>{f}</span>
                    </li>
                  ))}
                  {info.locked.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm opacity-40">
                      <X size={15} className={`mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                      <span className={`line-through ${isActive ? 'text-white' : 'text-stone-500'}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                {tierKey === 'free' && !user ? (
                  <Link
                    to="/register"
                    onClick={e => e.stopPropagation()}
                    className="block text-center py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-90"
                    style={{ backgroundColor: '#2785aa', color: 'white' }}
                  >
                    Empezar gratis
                  </Link>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); handleSubscribe(tierKey) }}
                    disabled={ctaDisabled || loadingTier === tierKey}
                    className={`w-full py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 ${
                      isActive ? 'bg-white' : 'text-white'
                    }`}
                    style={isActive ? { color: '#2785aa' } : { backgroundColor: '#2785aa' }}
                  >
                    {loadingTier === tierKey ? '...' : ctaLabel}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-stone-400 mt-8">
          Los pagos se procesan de forma segura a través de MercadoPago.
          Podés cancelar en cualquier momento desde Configuración.
        </p>
      </div>
    </div>
  )
}
