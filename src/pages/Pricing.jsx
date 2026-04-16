import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Check, X, Zap, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBusiness } from '../hooks/useBusiness'
import { supabase } from '../lib/supabase'
import { TIER_INFO } from '../constants/tiers'
import Button from '../components/ui/Button'

const TIERS_ORDER = ['free', 'starter', 'pro']

export default function Pricing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { business } = useBusiness(user?.id)
  const currentTier = business?.tier ?? 'free'

  const [loadingTier, setLoadingTier] = useState(null)
  const [selectedTier, setSelectedTier] = useState('pro')

  async function handleSubscribe(tier) {
    if (!user) {
      navigate('/register')
      return
    }
    if (tier === 'free') return
    if (tier === currentTier) return

    setLoadingTier(tier)
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { tier },
      })
      if (error || !data?.init_point) {
        alert('No se pudo iniciar el pago. Intentá de nuevo.')
        return
      }
      window.location.href = data.init_point
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link to={user ? '/dashboard' : '/login'} className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600 text-sm font-medium transition-colors">
          <ArrowLeft size={15} /> {user ? 'Volver al inicio' : 'Iniciar sesión'}
        </Link>
        <span className="font-extrabold text-xl text-brand-700">SubsManager</span>
        {!user && (
          <Link to="/register" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Crear cuenta
          </Link>
        )}
      </header>

      {/* Hero */}
      <div className="text-center px-6 pt-10 pb-12 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
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

            let ctaLabel = 'Suscribirse'
            let ctaVariant = isPro ? 'primary' : 'outline'
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
                className={`relative rounded-3xl p-6 flex flex-col cursor-pointer transition-all ring-2 ${
                  isPro
                    ? `bg-brand-700 text-white shadow-xl ${selectedTier === 'pro' ? 'ring-white' : 'ring-brand-400'}`
                    : `bg-surface shadow-card ${selectedTier === tierKey ? 'ring-brand-500' : 'ring-transparent'}`
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Más popular
                  </div>
                )}

                <div className="mb-5">
                  <h2 className={`font-extrabold text-xl mb-0.5 ${isPro ? 'text-white' : 'text-stone-900'}`}>
                    {info.label}
                  </h2>
                  <p className={`text-xs mb-4 ${isPro ? 'text-brand-200' : 'text-stone-400'}`}>
                    {info.description}
                  </p>
                  <p className={`font-extrabold text-3xl ${isPro ? 'text-white' : 'text-stone-900'}`}>
                    {info.priceLabel}
                  </p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {info.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={15} className={`mt-0.5 shrink-0 ${isPro ? 'text-brand-200' : 'text-green-500'}`} />
                      <span className={isPro ? 'text-brand-100' : 'text-stone-700'}>{f}</span>
                    </li>
                  ))}
                  {info.locked.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm opacity-40">
                      <X size={15} className="mt-0.5 shrink-0 text-stone-400" />
                      <span className={isPro ? 'text-brand-200' : 'text-stone-500'}>{f}</span>
                    </li>
                  ))}
                </ul>

                {tierKey === 'free' && !user ? (
                  <Link
                    to="/register"
                    onClick={e => e.stopPropagation()}
                    className="block text-center py-2.5 rounded-full border-2 border-brand-600 text-brand-600 font-semibold text-sm hover:bg-brand-50 transition-colors"
                  >
                    Empezar gratis
                  </Link>
                ) : isPro && !ctaDisabled ? (
                  <button
                    onClick={e => { e.stopPropagation(); handleSubscribe(tierKey) }}
                    disabled={loadingTier === tierKey}
                    className="w-full py-2.5 rounded-full bg-white text-brand-700 font-semibold text-sm hover:bg-brand-50 transition-colors disabled:opacity-50"
                  >
                    {loadingTier === tierKey ? '...' : ctaLabel}
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    disabled={ctaDisabled}
                    loading={loadingTier === tierKey}
                    onClick={e => { e.stopPropagation(); handleSubscribe(tierKey) }}
                    className="w-full"
                  >
                    {ctaLabel}
                  </Button>
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
