import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Users, Zap, RefreshCw, CalendarDays, CheckCircle2, Wine, Leaf, Dumbbell, Sparkles, Scissors } from 'lucide-react'
import PublicNavbar from '../components/layout/PublicNavbar'
import PublicFooter from '../components/layout/PublicFooter'
import SEOHead from '../components/seo/SEOHead'

const STEPS = [
  {
    Icon: ClipboardList,
    step: '01',
    title: 'Creá tus planes',
    desc: 'Definí los servicios que ofrecés como paquetes. Cada plan tiene nombre, precio, cantidad de usos incluidos y duración en días.',
    details: [
      'Editá el precio y los usos en cualquier momento',
      'Plantillas pre-armadas por rubro (peluquería, yoga, entrenamiento…)',
      'Podés tener múltiples planes activos al mismo tiempo',
      'El plan se asigna cuando registrás un cliente',
    ],
    color: '#C0A1C3',
    bg: '#faf5fb',
  },
  {
    Icon: Users,
    step: '02',
    title: 'Registrá tus clientes',
    desc: 'Asociá cada cliente a un plan. La app calcula automáticamente la fecha de vencimiento y los usos disponibles desde el día de inicio.',
    details: [
      'Nombre, teléfono, DNI y notas opcionales',
      'Fecha de inicio personalizable',
      'El estado (activo, por vencer, vencido) se actualiza solo',
      'Historial completo de pagos por cliente',
    ],
    color: '#6a8ebc',
    bg: '#f0f4fb',
  },
  {
    Icon: Zap,
    step: '03',
    title: 'Registrá cada visita',
    desc: 'Cuando el cliente llega, buscalo en la app y tocá "Registrar uso". Se descuenta un uso del conteo y queda guardado con fecha y hora.',
    details: [
      'Un click, desde cualquier lugar, sin pasos extra',
      'Historial completo de usos por cliente',
      'Alerta automática cuando las suscripciones se quedan sin usos',
      'Registro de notas para cada tipo de usos',
    ],
    color: '#2785aa',
    bg: '#f0f7fb',
  },
]

function RenovacionMockup() {
  const [phase, setPhase] = useState('idle') // 'idle' | 'loading' | 'done'

  const newExpiry = new Date()
  newExpiry.setDate(newExpiry.getDate() + 30)
  const expiryStr = newExpiry.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  function handleClick() {
    setPhase('loading')
    setTimeout(() => setPhase('done'), 750)
  }

  const done = phase === 'done'

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 w-full max-w-xs" style={{ height: '344px', position: 'relative', overflow: 'hidden' }}>
      {/* ── Idle / Loading ── */}
      <div
        className="absolute inset-0 p-6 flex flex-col transition-all duration-500"
        style={{ opacity: done ? 0 : 1, transform: done ? 'scale(0.95)' : 'scale(1)', pointerEvents: done ? 'none' : 'auto' }}
      >
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Renovar suscripción</p>
        <div className="space-y-3 mb-5">
          <div className="bg-stone-50 rounded-2xl p-3">
            <p className="text-xs text-stone-400">Cliente</p>
            <p className="font-semibold text-stone-800 text-sm">Carlos López</p>
          </div>
          <div className="bg-stone-50 rounded-2xl p-3">
            <p className="text-xs text-stone-400">Plan</p>
            <p className="font-semibold text-stone-800 text-sm">Plan mensual 4 cortes — $40.500</p>
          </div>
          <div className="bg-stone-50 rounded-2xl p-3">
            <p className="text-xs text-stone-400">Monto cobrado</p>
            <p className="font-semibold text-stone-800 text-sm">$40.500</p>
          </div>
        </div>
        <button
          onClick={handleClick}
          disabled={phase === 'loading'}
          className="w-full py-3 rounded-full text-sm font-bold text-white flex items-center justify-center gap-2 transition-all mt-auto"
          style={{ backgroundColor: '#2785aa', opacity: phase === 'loading' ? 0.85 : 1 }}
        >
          {phase === 'loading' ? (
            <><RefreshCw size={14} className="animate-spin" /> Renovando...</>
          ) : 'Confirmar renovación'}
        </button>
      </div>

      {/* ── Success ── */}
      <div
        className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center gap-4 transition-all duration-500"
        style={{ opacity: done ? 1 : 0, transform: done ? 'scale(1)' : 'scale(0.95)', pointerEvents: done ? 'auto' : 'none' }}
      >
        <div className="relative w-16 h-16">
          <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-25 animate-ping" />
          <div className="relative w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
        </div>
        <div>
          <p className="font-extrabold text-stone-900 text-xl">¡Renovado!</p>
          <p className="text-sm text-stone-400 mt-0.5">Carlos López</p>
        </div>
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between bg-emerald-50 rounded-2xl px-4 py-2.5">
            <span className="text-xs text-stone-500">Usos disponibles</span>
            <span className="text-sm font-bold text-emerald-700">4 de 4</span>
          </div>
          <div className="flex items-center justify-between bg-stone-50 rounded-2xl px-4 py-2.5">
            <span className="text-xs text-stone-500">Nuevo vencimiento</span>
            <span className="text-sm font-bold text-stone-700">{expiryStr}</span>
          </div>
        </div>
        <button
          onClick={() => setPhase('idle')}
          className="text-xs text-stone-400 hover:text-stone-500 transition-colors underline underline-offset-2"
        >
          Reiniciar demo
        </button>
      </div>
    </div>
  )
}

const STATUS_BADGES = [
  { label: 'Activa', desc: 'El cliente tiene usos disponibles y está dentro de la fecha de vigencia.', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  { label: 'Por vencer', desc: 'Quedan menos de 7 días para que venza la suscripción.', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  { label: 'Vencida', desc: 'La fecha de vigencia ya pasó. Es momento de renovar.', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  { label: 'Sin usos', desc: 'El cliente usó todos los usos del plan antes de que venza.', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
]

export default function ComoFunciona() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Cómo funciona PLANE.AR — Tres pasos para gestionar tus membresías"
        description="Creá tus planes, registrá tus clientes y llevá el control de cada visita. PLANE.AR es tan simple que lo configurás en menos de 5 minutos."
        canonical="https://plane.ar/como-funciona"
      />
      <PublicNavbar />

      {/* ── Hero ── */}
      <section className="pt-28 pb-16 px-4 text-center" style={{ background: 'linear-gradient(160deg, #f0f7fb 0%, #faf5fb 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <span className="inline-block text-xs font-bold px-4 py-1.5 rounded-full mb-6" style={{ backgroundColor: 'rgba(39,133,170,0.1)', color: '#2785aa' }}>
            Cómo funciona
          </span>
          <h1 className="font-extrabold text-4xl sm:text-5xl text-stone-900 leading-tight mb-5">
            Simple de arrancar,<br />poderoso para crecer
          </h1>
          <p className="text-lg text-stone-500 font-medium leading-relaxed mb-8">
            Tres pasos y ya estás gestionando tus membresías. Sin configuraciones complicadas, sin manuales.
          </p>
          <Link to="/register" className="inline-block px-8 py-3.5 rounded-full text-sm font-bold text-white shadow-md hover:opacity-90 transition-all" style={{ backgroundColor: '#2785aa' }}>
            Empezar gratis →
          </Link>
        </div>
      </section>

      {/* ── Los 3 pasos ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto space-y-8">
          {STEPS.map(({ Icon, step, title, desc, details, color, bg }) => (
            <div key={step} className="flex flex-col md:flex-row gap-8 p-8 rounded-3xl border border-stone-100 hover:shadow-md transition-all" style={{ backgroundColor: bg }}>
              <div className="flex items-start gap-5 md:w-1/2">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                  <Icon size={26} style={{ color }} />
                </div>
                <div>
                  <span className="text-xs font-bold" style={{ color }}>{step}</span>
                  <h3 className="font-extrabold text-xl text-stone-800 mt-1 mb-2">{title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
              <div className="md:w-1/2 flex items-center">
                <ul className="space-y-2.5 w-full">
                  {details.map(d => (
                    <li key={d} className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color }} />
                      <span className="text-sm text-stone-600">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Estados ── */}
      <section className="py-24 px-4" style={{ backgroundColor: '#f8fafb' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-extrabold text-3xl sm:text-4xl text-stone-900 mb-4">
              Siempre sabés quién está al día
            </h2>
            <p className="text-stone-400 text-lg font-medium">
              Cada cliente tiene un estado que se calcula automáticamente.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STATUS_BADGES.map(({ label, desc, bg, text, dot }) => (
              <div key={label} className="bg-white rounded-3xl border border-stone-100 p-6 flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${dot}`} />
                <div>
                  <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${bg} ${text}`}>{label}</span>
                  <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Renovaciones ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto md:mx-0" style={{ backgroundColor: '#e8f4f8' }}>
              <RefreshCw size={26} style={{ color: '#2785aa' }} />
            </div>
            <h2 className="font-extrabold text-3xl sm:text-4xl text-stone-900 mb-4">Renová los planes en un toque</h2>
            <p className="text-stone-500 leading-relaxed mb-5">
              Cuando una suscripción vence o se queda sin usos, podés "Renovar" desde la ficha del cliente. La app automáticamente extiende la fecha de vencimiento según la duración del plan, y resetea los usos disponibles. Si el cliente quiere cambiar de plan, solo tenés que asignarle uno nuevo.
            </p>

          </div>
          {/* Mockup renovación */}
          <div className="flex-1 flex justify-center">
            <RenovacionMockup />
          </div>
        </div>
      </section>

      {/* ── Agenda ── */}
      <section className="py-24 px-4" style={{ background: 'linear-gradient(160deg, #f0f7fb 0%, #faf5fb 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto" style={{ backgroundColor: 'rgba(192,161,195,0.2)' }}>
            <CalendarDays size={26} style={{ color: '#9b96c3' }} />
          </div>
          <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: 'rgba(192,161,195,0.2)', color: '#9b96c3' }}>
            Función Pro
          </span>
          <h2 className="font-extrabold text-3xl sm:text-4xl text-stone-900 mb-4">
            ¿Querés administrar tu agenda?
          </h2>
          <p className="text-stone-500 leading-relaxed mb-6 max-w-xl mx-auto">
            Activala la opción, definí tu disponibilidad (días, horarios, duración de cada turno) y compartí tu URL pública. Tus clientes ingresan a tu URL pública, eligen día, horario y listo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left max-w-2xl mx-auto">
            {[
              { title: 'Ofrecé un servicio diferencial', desc: 'Tus clientes pueden reservar su turno desde su celular.' },
              { title: 'Disponibilidad automática', desc: 'PLANE.AR sincroniza tu disponibilidad en tiempo real.' },
              { title: 'Llevá el control', desc: 'Mantené un registro detallado de tus clientes.' },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-4 border border-stone-100">
                <p className="font-bold text-stone-800 text-sm mb-1">{title}</p>
                <p className="text-xs text-stone-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <Link to="/planes" className="inline-block px-8 py-3.5 rounded-full text-sm font-bold text-white hover:opacity-90 transition-all" style={{ backgroundColor: '#2785aa' }}>
            Ver planes y activar agenda
          </Link>
        </div>
      </section>

      {/* ── Casos de uso ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-extrabold text-2xl sm:text-3xl text-stone-900 mb-4">
              ¿En qué otros negocios funciona?
            </h2>
            <p className="text-stone-400 text-lg font-medium max-w-xl mx-auto">
              Cualquier negocio con clientes recurrentes puede aprovechar PLANE.AR.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { Icon: Wine,     title: 'Vinotecas',            desc: 'Membresías de degustación mensual con paquetes personalizados.',    color: '#6a8ebc', bg: '#f0f4fb' },
              { Icon: Leaf,     title: 'Viveros',              desc: 'Suscripciones de riego, armado floral o delivery de plantas.',      color: '#007a8e', bg: '#f0f8f9' },
              { Icon: Dumbbell, title: 'Boxes y entrenadores', desc: 'Clases por paquete o mensuales con registro exacto de asistencia.', color: '#2785aa', bg: '#f0f7fb' },
              { Icon: Sparkles, title: 'Centros de estética',  desc: 'Sesiones de tratamiento en paquetes o abonos mensuales.',          color: '#9b96c3', bg: '#f5f4fb' },
              { Icon: Scissors, title: 'Barberías',            desc: 'Abonos mensuales de cortes con control de frecuencia.',            color: '#C0A1C3', bg: '#faf5fb' },
              { Icon: Users,    title: 'Clubes y espacios',    desc: 'Cuotas de membresía, acceso y reservas en un solo lugar.',         color: '#2785aa', bg: '#f0f7fb' },
            ].map(({ Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-3xl border border-stone-100 p-5 shadow-sm hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}18` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="font-bold text-stone-800 text-sm mb-1">{title}</p>
                <p className="text-xs text-stone-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-extrabold text-3xl text-stone-900 mb-4">¿Listo para probarlo?</h2>
          <p className="text-stone-500 mb-8">Empezá gratis, sin tarjeta de crédito. Configurás tu primer plan en menos de 5 minutos.</p>
          <Link to="/register" className="inline-block px-10 py-4 rounded-full text-base font-bold text-white hover:opacity-90 transition-all" style={{ backgroundColor: '#2785aa' }}>
            Empezar gratis →
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
