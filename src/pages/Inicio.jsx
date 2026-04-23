import { Link } from 'react-router-dom'
import { Scissors, Dumbbell, BarChart2, Users, RefreshCw, Sparkles, Star, Wine, Settings2, Flower2, Activity, GlassWater, Eye, Stethoscope, Sprout, Feather, Gem } from 'lucide-react'
import PublicNavbar from '../components/layout/PublicNavbar'
import PublicFooter from '../components/layout/PublicFooter'
import SEOHead from '../components/seo/SEOHead'
import { trackEvent } from '../lib/analytics'
import StructuredData from '../components/seo/StructuredData'

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PLANE.AR',
  url: 'https://plane.ar',
  logo: 'https://plane.ar/og-image.png',
  description: 'Gestión de membresías para pequeños negocios. Administrá clientes, pagos y renovaciones desde el celular.',
  foundingLocation: { '@type': 'Place', addressCountry: 'AR' },
  sameAs: [],
}

const SOFTWARE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PLANE.AR',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://plane.ar',
  description: 'Administrá las membresías de tu negocio desde el celular. Controlá pagos, usos y vencimientos de cada cliente.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'ARS',
    description: 'Plan gratuito disponible. Planes de pago disponibles.',
  },
}

// ─── Mock card de suscriptor ────────────────────────────────────────────────
function MockSubscriberCard() {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-5 w-full max-w-xs border border-stone-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-stone-800 text-base">María García</p>
          <p className="text-xs text-stone-400 font-medium mt-0.5">Plan mensual 8 clases</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">Activa</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[{ label: 'Usos rest.', value: '5' }, { label: 'Vence', value: '18/05' }, { label: 'Plan', value: '$5.000' }].map(({ label, value }) => (
          <div key={label} className="rounded-2xl p-2.5 text-center" style={{ backgroundColor: '#f0f7fb' }}>
            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide">{label}</p>
            <p className="font-extrabold text-stone-800 text-sm mt-0.5">{value}</p>
          </div>
        ))}
      </div>
      <button className="w-full py-2.5 rounded-full text-sm font-bold text-white" style={{ backgroundColor: '#2785aa' }}>
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

// ─── Mock dashboard ──────────────────────────────────────────────────────────
function MockDashboard() {
  const clients = [
    { name: 'María García', plan: '8 clases', uses: 5, status: 'active' },
    { name: 'Carlos López', plan: '4 cortes', uses: 1, status: 'expiring' },
    { name: 'Ana Rodríguez', plan: '12 clases', uses: 0, status: 'no_uses' },
    { name: 'Julián Torres', plan: 'Mensual', uses: 3, status: 'active' },
  ]
  const statusStyle = {
    active:   { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Activa' },
    expiring: { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Por vencer' },
    no_uses:  { bg: 'bg-red-50',     text: 'text-red-700',     label: 'Sin usos' },
  }
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden w-full max-w-md">
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Resumen</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Activos', value: '18', color: '#2785aa' },
            { label: 'Por vencer', value: '4', color: '#f59e0b' },
            { label: 'Alertas', value: '2', color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-3 text-center bg-stone-50">
              <p className="font-extrabold text-xl" style={{ color }}>{value}</p>
              <p className="text-[10px] text-stone-400 font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Clientes</p>
      </div>
      <div className="divide-y divide-stone-50">
        {clients.map(({ name, plan, uses, status }) => {
          const s = statusStyle[status]
          return (
            <div key={name} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-semibold text-stone-800 text-sm">{name}</p>
                <p className="text-xs text-stone-400">{plan} · {uses} usos rest.</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Mock agenda ─────────────────────────────────────────────────────────────
function MockAgenda() {
  const slots = [
    { time: '09:00', name: 'María García', status: 'confirmed' },
    { time: '10:00', name: 'Carlos López', status: 'pending' },
    { time: '11:00', name: 'Ana Rodríguez', status: 'confirmed' },
    { time: '12:00', name: '—', status: 'free' },
  ]
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden w-full max-w-xs">
      <div className="px-5 py-4 border-b border-stone-50">
        <p className="font-bold text-stone-800 text-sm">Hoy · Lunes 14 de abril</p>
        <p className="text-xs text-stone-400 mt-0.5">4 turnos configurados</p>
      </div>
      <div className="divide-y divide-stone-50">
        {slots.map(({ time, name, status }) => (
          <div key={time} className="flex items-center gap-3 px-5 py-3">
            <span className="text-xs font-bold text-stone-400 w-10">{time}</span>
            {status === 'free' ? (
              <span className="text-xs text-stone-300 italic">Disponible</span>
            ) : (
              <>
                <span className="text-sm font-semibold text-stone-700 flex-1">{name}</span>
                <span className={`w-2 h-2 rounded-full ${status === 'confirmed' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </>
            )}
          </div>
        ))}
      </div>
      <div className="px-5 py-3 bg-stone-50">
        <p className="text-xs text-stone-400 text-center">URL pública activa · reserva con DNI</p>
      </div>
    </div>
  )
}

// ─── Rubros ──────────────────────────────────────────────────────────────────
const RUBROS = [
  { Icon: Scissors,    label: 'Peluquerías y barberías',   color: '#007a8e', bg: '#f0f8f9' },
  { Icon: Sparkles,    label: 'Manicura',                  color: '#c0609a', bg: '#fdf0f7' },
  { Icon: Gem,         label: 'Centro de estética',        color: '#9b96c3', bg: '#f5f4fb' },
  { Icon: Eye,         label: 'Lashistas',                 color: '#a07ac8', bg: '#f7f2fd' },
  { Icon: Feather,     label: 'Masajistas',                color: '#C0A1C3', bg: '#faf5fb' },
  { Icon: Stethoscope, label: 'Dermatólogas',              color: '#4e87c0', bg: '#f0f5fb' },
  { Icon: Dumbbell,    label: 'Entrenadores',              color: '#2785aa', bg: '#f0f7fb' },
  { Icon: Activity,    label: 'Yoga',                      color: '#5c9eaa', bg: '#f0f8f9' },
  { Icon: Flower2,     label: 'Florerías',                 color: '#d4789e', bg: '#fdf2f6' },
  { Icon: Sprout,      label: 'Viveros',                   color: '#5c8a3c', bg: '#f2f8ef' },
  { Icon: Wine,        label: 'Vinotecas',                 color: '#6a8ebc', bg: '#f0f4fb' },
  { Icon: GlassWater,  label: 'Bares y cervecerías',       color: '#8c6030', bg: '#faf5ef' },
  { Icon: Settings2,   label: '¿No encontrás tu negocio? Crealo', color: '#C0A1C3', bg: '#faf5fb', italic: true },
]

// ─── Testimoniales ───────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { initial: 'L', name: 'Lauti Mendez', role: 'Barbería, Rosario', quote: 'Antes tenía todo en papel, un lío. Los chicos de Plane.ar me vinieron con una solución práctica. El equipo lo considera escencial para organizar el día a día.', color: '#2785aa' },
  { initial: 'M', name: 'Marcos Villarino', role: 'Vivero, Sarandí', quote: 'La agenda es lo que más uso. Me sirve para predecir el stock y saber que tengo que comprar cada mes.', color: '#007a8e' },
  { initial: 'R', name: 'Ricky Muñiz', role: 'Vinoteca, Quilmes', quote: 'La gente elige su paquete de vinos a través de un link, Plane.ar me dice cuando lo pasan a buscar, lo armo y listo. Todo muy aceitado.', color: '#C0A1C3' },
]

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Inicio() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="PLANE.AR — Gestión de membresías para pequeños negocios"
        description="Administrá las membresías de tu negocio desde el celular. Controlá pagos, usos y vencimientos de cada cliente. Empezá gratis, sin tarjeta de crédito."
        canonical="https://plane.ar"
      />
      <StructuredData schema={ORGANIZATION_SCHEMA} />
      <StructuredData schema={SOFTWARE_SCHEMA} />
      <PublicNavbar />

      {/* ── Hero ── */}
      <section className="pt-28 pb-20 px-4" style={{ background: 'linear-gradient(160deg, #f0f8fc 0%, #faf5fb 50%, #f0f4f8 100%)' }}>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-14">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block text-xs font-bold px-4 py-1.5 rounded-full mb-6" style={{ backgroundColor: 'rgba(192,161,195,0.2)', color: '#2785aa' }}>
              El gestor de suscripciones que necesitabas
            </span>
            <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-6xl text-stone-900 leading-tight mb-5">
              Tu cuaderno<br />de clientes,{' '}
              <span style={{ color: '#2785aa' }}>sin papel.</span>
            </h1>
            <p className="text-lg text-stone-500 font-medium leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              ¿Ofrecés membresías, suscripciones o paquetes en tu negocio? ¿Se te está complicando administrarlas? PLANE.AR tiene todo lo que necesitás para organizar tus clientes, registrar sus pagos y renovaciones, agendar citas y más. Descubrilo
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <Link to="/register" onClick={() => trackEvent('cta_click', { page: 'inicio', label: 'hero' })} className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold text-white shadow-md transition-all hover:opacity-90" style={{ backgroundColor: '#2785aa' }}>
                Empezá gratis →
              </Link>
              <Link to="/como-funciona" className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold border-2 text-center transition-all hover:bg-stone-50" style={{ borderColor: '#2785aa', color: '#2785aa' }}>
                Ver cómo funciona
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative">
              <MockSubscriberCard />
              <div className="absolute -top-4 -left-8 bg-white rounded-2xl shadow-md px-3 py-2 text-xs font-bold text-stone-700 hidden sm:block">
                ✓ 3 renovaciones este mes
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-md px-3 py-2 text-xs font-bold text-stone-700 hidden sm:block">
                📋 12 clientes activos
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── A quién está orientado ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-extrabold text-3xl sm:text-4xl text-stone-900 mb-4">
              Pensado para cualquier negocio que administre membresías.
            </h2>
            <p className="text-stone-400 text-lg font-medium max-w-xl mx-auto">
              Si tenés clientes que pagan una suscripción por un servicio o productos que ofreces, PLANE.AR es para vos.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {RUBROS.map(({ Icon, label, color, bg, italic }) => (
              <div key={label} className="flex flex-col items-center gap-3 p-6 rounded-3xl border border-stone-100 hover:shadow-md transition-all text-center" style={{ backgroundColor: bg }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <p className={`font-bold text-stone-700 text-sm ${italic ? 'italic text-stone-400' : ''}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vista previa — Dashboard ── */}
      <section className="py-24 px-4" style={{ backgroundColor: '#f8fafb' }}>
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 order-2 lg:order-1 flex justify-center">
            <MockDashboard />
          </div>
          <div className="flex-1 order-1 lg:order-2 text-center lg:text-left">
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: 'rgba(39,133,170,0.1)', color: '#2785aa' }}>
              Dashboard
            </span>
            <h2 className="font-extrabold text-3xl sm:text-4xl text-stone-900 mb-4">
              Todo tu negocio en una pantalla
            </h2>
            <p className="text-stone-500 leading-relaxed mb-6">
              Mirás el dashboard y en segundos sabés cuántos clientes están activos, quiénes están por vencer y a quién tenés que llamar.
            </p>
            <ul className="space-y-3 text-left max-w-sm mx-auto lg:mx-0">
              {[
                { icon: Users, text: 'Listado de clientes con estado en tiempo real' },
                { icon: BarChart2, text: 'Estadísticas de usos' },
                { icon: RefreshCw, text: 'Renovación con un click' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#e8f4f8' }}>
                    <Icon size={15} style={{ color: '#2785aa' }} />
                  </div>
                  <span className="text-sm text-stone-600 font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Vista previa — Agenda ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: 'rgba(192,161,195,0.2)', color: '#9b96c3' }}>
              Agenda — Función Pro
            </span>
            <h2 className="font-extrabold text-3xl sm:text-4xl text-stone-900 mb-4">
              Tu agenda online,<br />sin apps extra
            </h2>
            <p className="text-stone-500 leading-relaxed mb-6">
              Activá la agenda para que tus clientes puedan reservar su turno desde su celular o usalo para organizar tus citas.
            </p>
            <ul className="space-y-3 text-left max-w-sm mx-auto lg:mx-0">
              {[
                'URL pública personalizada para tu negocio',
                'Slots automáticos según tu disponibilidad',
                'El turno confirmado descuenta un uso de la suscripción',
                'Sin registros molestos para el cliente',
              ].map(text => (
                <li key={text} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#C0A1C3' }} />
                  <span className="text-sm text-stone-600">{text}</span>
                </li>
              ))}
            </ul>
            <Link to="/planes" className="inline-block mt-8 px-6 py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90" style={{ backgroundColor: '#2785aa' }}>
              Ver planes disponibles
            </Link>
          </div>
          <div className="flex-1 flex justify-center lg:justify-end">
            <MockAgenda />
          </div>
        </div>
      </section>

      {/* ── Métricas ── */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #2785aa 0%, #007a8e 100%)' }}>
        <div className="max-w-4xl mx-auto">

        </div>
      </section>

      {/* ── Testimoniales ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-extrabold text-3xl sm:text-4xl text-stone-900 mb-4">
              Nuestros usuarios hablan por nosotros
            </h2>
            <p className="text-stone-400 text-lg font-medium">Negocios reales, resultados reales.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ initial, name, role, quote, color }) => (
              <div key={name} className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm" style={{ backgroundColor: color }}>
                    {initial}
                  </div>
                  <div>
                    <p className="font-bold text-stone-800 text-sm">{name}</p>
                    <p className="text-xs text-stone-400">{role}</p>
                  </div>
                </div>
                <p className="text-stone-600 text-sm leading-relaxed italic">"{quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-24 px-4" style={{ background: 'linear-gradient(135deg, #C0A1C3 0%, #9b96c3 40%, #2785aa 100%)' }}>
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="font-extrabold text-3xl sm:text-4xl mb-4">¿Listo para ordenar tu negocio?</h2>
          <p className="text-white/70 text-lg font-medium mb-8">
            Empezá gratis hoy. Sin tarjeta de crédito, sin límite de tiempo para el plan gratuito.
          </p>
          <Link to="/register" onClick={() => trackEvent('cta_click', { page: 'inicio', label: 'bottom_cta' })} className="inline-block px-10 py-4 rounded-full text-base font-bold bg-white transition-all hover:bg-white/90" style={{ color: '#2785aa' }}>
            Empezá gratis →
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
