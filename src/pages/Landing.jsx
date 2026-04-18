import { Link } from 'react-router-dom'
import { Check, X, ClipboardList, Users, Zap } from 'lucide-react'
import PublicNavbar from '../components/layout/PublicNavbar'
import { TIER_INFO } from '../constants/tiers'

// ─── Logo ──────────────────────────────────────────────────────────────────
function PlanearLogo({ size = 40 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <path
        d="M 28 88 V 30 A 12 12 0 0 1 40 18 H 72 A 12 12 0 0 1 84 30 V 46 A 12 12 0 0 1 72 58 H 28"
        fill="none" stroke="#2785aa" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"
      />
      <rect x="42" y="26" width="14" height="10" rx="4" fill="#C0A1C3" />
      <g fill="#2785aa" opacity="0.5">
        <circle cx="46" cy="48" r="3" />
        <circle cx="54" cy="48" r="3" />
        <circle cx="62" cy="48" r="3" />
        <circle cx="70" cy="48" r="3" />
      </g>
    </svg>
  )
}

// ─── Mock subscriber card (hero illustration) ─────────────────────────────
function MockCard() {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-5 w-72 border border-stone-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-stone-800 text-base">María García</p>
          <p className="text-xs text-stone-400 font-medium mt-0.5">Plan mensual 8 clases</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#e6f4f1', color: '#006d67' }}>
          Activa
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Usos rest.', value: '5' },
          { label: 'Vence', value: '18/05' },
          { label: 'Plan', value: '$5.000' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl p-2.5 text-center" style={{ backgroundColor: '#f0f7fb' }}>
            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide">{label}</p>
            <p className="font-extrabold text-stone-800 text-sm mt-0.5">{value}</p>
          </div>
        ))}
      </div>
      <button
        className="w-full py-2.5 rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: '#2785aa' }}
      >
        Registrar uso
      </button>
      <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5">
        {['12 abr — Clase registrada', '10 abr — Clase registrada', '08 abr — Clase registrada'].map(log => (
          <p key={log} className="text-xs text-stone-400">{log}</p>
        ))}
      </div>
    </div>
  )
}

// ─── Pricing card ─────────────────────────────────────────────────────────
function PricingCard({ tier, isPro }) {
  const info = TIER_INFO[tier]
  return (
    <div
      className={`rounded-3xl p-7 flex flex-col ${
        isPro
          ? 'text-white shadow-xl'
          : 'bg-white border border-stone-100 shadow-sm'
      }`}
      style={isPro ? { background: 'linear-gradient(145deg, #2785aa 0%, #007a8e 60%, #006d67 100%)' } : {}}
    >
      {isPro && (
        <span className="self-start text-xs font-bold px-3 py-1 rounded-full mb-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
          Más popular
        </span>
      )}
      <p className={`font-extrabold text-lg ${isPro ? 'text-white' : 'text-stone-800'}`}>{info.label}</p>
      <p className={`text-sm mt-1 mb-4 ${isPro ? 'text-white/70' : 'text-stone-400'}`}>{info.description}</p>
      <p className={`font-extrabold text-3xl mb-6 ${isPro ? 'text-white' : 'text-stone-900'}`}>
        {info.priceLabel}
      </p>
      <ul className="space-y-2.5 flex-1 mb-6">
        {info.features.map(f => (
          <li key={f} className="flex items-center gap-2.5">
            <Check size={14} className={isPro ? 'text-white/80' : ''} style={!isPro ? { color: '#2785aa' } : {}} />
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
        className={`block text-center py-3 rounded-full text-sm font-bold transition-all ${
          isPro
            ? 'bg-white text-[#2785aa] hover:bg-white/90'
            : 'text-white hover:opacity-90'
        }`}
        style={!isPro ? { backgroundColor: '#2785aa' } : {}}
      >
        {info.price === 0 ? 'Empezar gratis' : 'Suscribirse'}
      </Link>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        id="inicio"
        className="pt-28 pb-20 px-4 scroll-mt-16"
        style={{ background: 'linear-gradient(160deg, #f0f8fc 0%, #faf5fb 50%, #f0f4f8 100%)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-14">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <span
              className="inline-block text-xs font-bold px-4 py-1.5 rounded-full mb-6"
              style={{ backgroundColor: 'rgba(192,161,195,0.2)', color: '#006d67' }}
            >
              Gestión de suscripciones para negocios
            </span>
            <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-6xl text-stone-900 leading-tight mb-5">
              Tu cuaderno<br />de clientes,{' '}
              <span style={{ color: '#2785aa' }}>sin papel.</span>
            </h1>
            <p className="text-lg text-stone-500 font-medium leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Administrá suscripciones, registrá usos y renová membresías — todo desde el celular. Para peluquerías, estudios, entrenadores y más.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold text-white shadow-md transition-all hover:shadow-lg"
                style={{ backgroundColor: '#2785aa' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#007a8e'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2785aa'}
              >
                Empezá gratis →
              </Link>
              <a
                href="#como-funciona"
                onClick={e => { e.preventDefault(); document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold border-2 text-center transition-all hover:bg-stone-50"
                style={{ borderColor: '#2785aa', color: '#2785aa' }}
              >
                Ver cómo funciona
              </a>
            </div>
          </div>

          {/* Illustration */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative">
              <MockCard />
              {/* Floating mini badges */}
              <div className="absolute -top-4 -left-8 bg-white rounded-2xl shadow-md px-3 py-2 text-xs font-bold"
                style={{ color: '#006d67' }}>
                ✓ 3 renovaciones este mes
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-md px-3 py-2 text-xs font-bold text-stone-700">
                📋 12 clientes activos
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ───────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-4 scroll-mt-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-extrabold text-3xl sm:text-4xl text-stone-900 mb-4">
              Tan simple como el cuaderno,<br />mucho más poderoso
            </h2>
            <p className="text-stone-400 text-lg font-medium max-w-xl mx-auto">
              Tres pasos y ya estás gestionando tus membresías como un pro.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                Icon: ClipboardList,
                step: '01',
                title: 'Creá tus planes',
                desc: 'Definí nombre, precio, cantidad de usos y duración. Tenemos plantillas para los rubros más comunes.',
              },
              {
                Icon: Users,
                step: '02',
                title: 'Registrá tus clientes',
                desc: 'Asociá cada cliente a un plan. La app calcula automáticamente el vencimiento y los usos disponibles.',
              },
              {
                Icon: Zap,
                step: '03',
                title: 'Registrá cada visita',
                desc: 'Un tap descuenta el uso. Siempre sabés quién está al día, quién está por vencer y quién ya venció.',
              },
            ].map(({ Icon, step, title, desc }) => (
              <div key={step} className="flex flex-col items-start p-7 rounded-3xl border border-stone-100 hover:border-[#C0A1C3]/40 hover:shadow-md transition-all">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: '#e8f4f8' }}
                >
                  <Icon size={22} style={{ color: '#2785aa' }} />
                </div>
                <span className="text-xs font-bold mb-2" style={{ color: '#C0A1C3' }}>{step}</span>
                <h3 className="font-extrabold text-lg text-stone-800 mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planes ──────────────────────────────────────────────────────── */}
      <section
        id="planes"
        className="py-24 px-4 scroll-mt-20"
        style={{ backgroundColor: '#f8fafb' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-extrabold text-3xl sm:text-4xl text-stone-900 mb-4">
              Elegí el plan que crece con tu negocio
            </h2>
            <p className="text-stone-400 text-lg font-medium">
              Empezá gratis, sin tarjeta de crédito.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <PricingCard tier="free" isPro={false} />
            <PricingCard tier="pro" isPro={true} />
            <PricingCard tier="starter" isPro={false} />
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#006d67' }} className="text-white py-14 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <PlanearLogo size={32} />
              <span className="font-extrabold text-xl tracking-tight text-white">PLANE.AR</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              La herramienta que te ayuda a gestionar tus suscripciones.
            </p>
          </div>

          {/* Nav */}
          <div>
            <p className="font-bold text-white/80 text-xs uppercase tracking-widest mb-4">Navegación</p>
            <ul className="space-y-2.5">
              {[
                { label: 'Inicio', href: '#inicio' },
                { label: 'Cómo funciona', href: '#como-funciona' },
                { label: 'Planes', href: '#planes' },
              ].map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={e => { e.preventDefault(); document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' }) }}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="font-bold text-white/80 text-xs uppercase tracking-widest mb-4">Tu cuenta</p>
            <ul className="space-y-2.5">
              <li>
                <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors">
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-white/60 hover:text-white transition-colors">
                  Registrarse gratis
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-12 pt-6 border-t border-white/10">
          <p className="text-xs text-white/40 text-center">© 2025 PLANE.AR — Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
