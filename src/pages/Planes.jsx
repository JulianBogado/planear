import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import PublicNavbar from '../components/layout/PublicNavbar'
import PublicFooter from '../components/layout/PublicFooter'
import { TIER_INFO } from '../constants/tiers'
import SEOHead from '../components/seo/SEOHead'
import StructuredData from '../components/seo/StructuredData'

// ─── Feature comparison table ─────────────────────────────────────────────
const FEATURES = [
  { label: 'Clientes',              free: 'Hasta 5', starter: 'Hasta 50', pro: 'Ilimitados' },
  { label: 'Planes / paquetes',     free: 'Hasta 2', starter: 'Hasta 3',  pro: 'Ilimitados' },
  { label: 'Registro de usos',      free: true, starter: true, pro: true },
  { label: 'Historial de pagos',    free: true, starter: true, pro: true },
  { label: 'Soporte incluido',      free: true, starter: true, pro: true },
  { label: 'Impresión de carteles', free: false, starter: true, pro: true },
  { label: 'Estadísticas',          free: false, starter: false, pro: true },
  { label: 'Agenda y reservas online', free: false, starter: false, pro: true },
]

function FeatureCell({ value }) {
  if (value === true)  return <span className="flex justify-center"><Check size={16} style={{ color: '#2785aa' }} /></span>
  if (value === false) return <span className="flex justify-center"><X size={14} className="text-stone-300" /></span>
  return <span className="text-xs font-semibold text-stone-600">{value}</span>
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: '¿PLANE.AR es gratis?',
    a: 'Sí. Existe un plan gratuito permanente con hasta 5 clientes y 2 planes activos. Además, al registrarte accedés a 7 días con todas las funciones Pro sin necesidad de tarjeta de crédito.',
  },
  {
    q: '¿Necesito tarjeta de crédito para empezar?',
    a: 'No. El plan Free no requiere ningún dato de pago. Podés usar PLANE.AR de forma gratuita indefinidamente con hasta 5 clientes y 2 planes.',
  },
  {
    q: '¿Para qué tipo de negocios sirve PLANE.AR?',
    a: 'Para cualquier negocio que venda servicios por membresía o paquete: barberías, peluquerías, centros de estética, masajistas, entrenadores personales, estudios de yoga y pilates, vinotecas, viveros, bares con cuota, y más.',
  },
  {
    q: '¿Puedo cancelar cuando quiero?',
    a: 'Sí, en cualquier momento. No hay contratos ni permanencia mínima. Cancelás desde la configuración de tu cuenta.',
  },
  {
    q: '¿PLANE.AR funciona en el celular?',
    a: 'Sí. La plataforma es mobile-first: funciona en cualquier navegador del celular sin necesidad de descargar ninguna app.',
  },
  {
    q: '¿Los precios tienen IVA?',
    a: 'Los precios mostrados no incluyen IVA. El IVA se aplica según corresponda en el momento del pago.',
  },
]

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-stone-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-stone-50 transition-colors"
      >
        <span className="font-semibold text-stone-800 text-sm pr-4">{q}</span>
        {open ? <ChevronUp size={16} className="shrink-0 text-stone-400" /> : <ChevronDown size={16} className="shrink-0 text-stone-400" />}
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm text-stone-500 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

// ─── Pricing card ─────────────────────────────────────────────────────────
function PricingCard({ tier }) {
  const info = TIER_INFO[tier]
  const isFree = tier === 'free'
  const isPro  = tier === 'pro'

  return (
    <div
      className={`rounded-3xl p-7 flex flex-col relative ${
        isPro ? 'text-white shadow-xl' : 'bg-white border border-stone-100 shadow-sm'
      }`}
      style={isPro ? { background: 'linear-gradient(145deg, #2785aa 0%, #007a8e 60%, #007a8e 100%)' } : {}}
    >
      {isPro && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap"
          style={{ backgroundColor: '#C0A1C3', color: 'white' }}>
          Más popular
        </span>
      )}

      {isFree && (
        <div className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-start gap-2">
          <span className="text-base">🎁</span>
          <p className="text-xs font-semibold text-amber-700 leading-snug">
            Incluye 7 días con acceso a todas las funciones Pro
          </p>
        </div>
      )}

      <p className={`font-extrabold text-lg ${isPro ? 'text-white' : 'text-stone-800'}`}>{info.label}</p>
      <p className={`text-sm mt-1 mb-4 ${isPro ? 'text-white/70' : 'text-stone-400'}`}>{info.description}</p>
      <p className={`font-extrabold text-3xl mb-6 ${isPro ? 'text-white' : 'text-stone-900'}`}>
        {info.priceLabel}
      </p>

      <ul className="space-y-2.5 flex-1 mb-6">
        {info.features.map(f => (
          <li key={f} className="flex items-center gap-2.5">
            <Check size={14} style={isPro ? { color: 'rgba(255,255,255,0.8)' } : { color: '#2785aa' }} />
            <span className={`text-sm ${isPro ? 'text-white/90' : 'text-stone-600'}`}>{f}</span>
          </li>
        ))}
        {info.locked.map(f => (
          <li key={f} className="flex items-center gap-2.5 opacity-40">
            <X size={14} className="text-stone-400" />
            <span className="text-sm text-stone-500 line-through">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/register"
        className={`block text-center py-3 rounded-full text-sm font-bold transition-all hover:opacity-90 ${
          isPro ? 'bg-white text-[#2785aa]' : 'text-white'
        }`}
        style={!isPro ? { backgroundColor: '#2785aa' } : {}}
      >
        {isFree ? 'Empezar gratis' : isPro ? 'Suscribirse al Pro' : 'Suscribirse al Starter'}
      </Link>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function Planes() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Planes y precios — PLANE.AR"
        description="Empezá con el plan gratuito y accedé a todas las funciones Pro durante 7 días. Sin tarjeta de crédito. Cambiá de plan cuando quieras."
        canonical="https://plane.ar/planes"
      />
      <StructuredData schema={FAQ_SCHEMA} />
      <PublicNavbar />

      {/* ── Header ── */}
      <section className="pt-28 pb-16 px-4 text-center" style={{ background: 'linear-gradient(160deg, #f0f7fb 0%, #faf5fb 100%)' }}>
        <div className="max-w-xl mx-auto">
          <span className="inline-block text-xs font-bold px-4 py-1.5 rounded-full mb-6" style={{ backgroundColor: 'rgba(39,133,170,0.1)', color: '#2785aa' }}>
            Planes y precios
          </span>
          <h1 className="font-extrabold text-4xl sm:text-5xl text-stone-900 leading-tight mb-4">
            Elegí el plan que crece con vos
          </h1>
          <p className="text-lg text-stone-500 font-medium">
            Empezá gratis. Sin tarjeta de crédito. Cambiá de plan cuando quieras.
          </p>
        </div>
      </section>

      {/* ── Cards ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Orden: Free → Starter → Pro */}
            <PricingCard tier="free" />
            <PricingCard tier="starter" />
            <div className="relative mt-3">
              <PricingCard tier="pro" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparativa ── */}
      <section className="py-20 px-4" style={{ backgroundColor: '#f8fafb' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="font-extrabold text-2xl sm:text-3xl text-stone-900 mb-10 text-center">
            Comparativa de funciones
          </h2>
          <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-4 gap-0 border-b border-stone-100">
              <div className="p-5 col-span-1" />
              {['Free', 'Starter', 'Pro'].map((label, i) => (
                <div key={label} className={`p-5 text-center border-l border-stone-100 ${i === 2 ? 'bg-[#2785aa]/5' : ''}`}>
                  <p className={`font-extrabold text-sm ${i === 2 ? 'text-[#2785aa]' : 'text-stone-700'}`}>{label}</p>
                </div>
              ))}
            </div>
            {/* Rows */}
            {FEATURES.map(({ label, free, starter, pro }, idx) => (
              <div key={label} className={`grid grid-cols-4 gap-0 border-b border-stone-50 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}`}>
                <div className="p-4 pl-5 flex items-center">
                  <span className="text-sm font-medium text-stone-600">{label}</span>
                </div>
                {[free, starter, pro].map((v, i) => (
                  <div key={i} className={`p-4 flex items-center justify-center border-l border-stone-100 ${i === 2 ? 'bg-[#2785aa]/5' : ''}`}>
                    <FeatureCell value={v} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-extrabold text-2xl sm:text-3xl text-stone-900 mb-10 text-center">
            Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {FAQS.map(faq => <FaqItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #C0A1C3 0%, #9b96c3 40%, #2785aa 100%)' }}>
        <div className="max-w-xl mx-auto text-center text-white">
          <h2 className="font-extrabold text-3xl mb-4">Empezá con el plan Free</h2>
          <p className="text-white/70 mb-8 font-medium">
            Sin tarjeta, sin compromiso. Si te gusta, pasás a Pro con un click.
          </p>
          <Link to="/register" className="inline-block px-10 py-4 rounded-full text-base font-bold bg-white hover:bg-white/90 transition-all" style={{ color: '#2785aa' }}>
            Crear cuenta gratis →
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
