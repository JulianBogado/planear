import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Users, Zap, RefreshCw, CalendarDays, CheckCircle2, Wine, Leaf, Dumbbell, Sparkles, Scissors, Loader2, BarChart2 } from 'lucide-react'
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

// ─── Registro de uso mockup ────────────────────────────────────────────────
const INITIAL_LOGS = [
  '14 abr — Clase registrada',
  '12 abr — Clase registrada',
  '10 abr — Clase registrada',
]

function RegistroUsoMockup() {
  const [phase, setPhase] = useState('idle') // idle | loading | done
  const [uses, setUses] = useState(5)
  const [logs, setLogs] = useState(INITIAL_LOGS)

  function handleRegister() {
    if (phase !== 'idle' || uses === 0) return
    setPhase('loading')
    setTimeout(() => {
      setUses(u => u - 1)
      const label = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
      setLogs(l => [`${label} — Clase registrada`, ...l.slice(0, 2)])
      setPhase('done')
    }, 700)
  }

  const btnBg = uses === 0 ? '#a8a29e' : phase === 'done' ? '#10b981' : '#2785aa'

  return (
    <div className="bg-white rounded-3xl shadow-xl p-5 w-full max-w-xs border border-stone-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-stone-800 text-base">Martín García</p>
          <p className="text-xs text-stone-400 font-medium mt-0.5">Plan mensual 8 clases</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">Activa</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Usos rest.', value: String(uses) },
          { label: 'Vence', value: '18/05' },
          { label: 'Plan', value: '$8.000' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl p-2.5 text-center" style={{ backgroundColor: '#f0f7fb' }}>
            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wide">{label}</p>
            <p className="font-extrabold text-stone-800 text-sm mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleRegister}
        disabled={phase !== 'idle' || uses === 0}
        className="w-full py-2.5 rounded-full text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors"
        style={{ backgroundColor: btnBg }}
      >
        {phase === 'loading' ? (
          <><Loader2 size={14} className="animate-spin" /> Registrando...</>
        ) : phase === 'done' ? (
          <><CheckCircle2 size={14} /> ¡Uso registrado!</>
        ) : uses === 0 ? 'Sin usos disponibles' : 'Registrar uso'}
      </button>

      <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5">
        {logs.map((log, i) => (
          <p
            key={i}
            className={`text-xs transition-colors ${i === 0 && uses < 5 ? 'text-stone-600 font-semibold' : 'text-stone-400'}`}
          >
            {log}
          </p>
        ))}
      </div>

    </div>
  )
}

// ─── Renovación mockup ─────────────────────────────────────────────────────
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
      </div>
    </div>
  )
}

// ─── Agenda calendar mockup ────────────────────────────────────────────────
const AGENDA_DATA = {
  14: [
    { time: '09:00', name: 'María G.', ok: true },
    { time: '10:30', name: 'Carlos L.', ok: true },
    { time: '11:00', name: 'Ana R.', ok: false },
  ],
  15: [
    { time: '10:00', name: 'Julián T.', ok: true },
    { time: '15:00', name: 'Lucía P.', ok: false },
  ],
  16: [
    { time: '09:00', name: 'Pablo M.', ok: true },
    { time: '10:00', name: 'Sofía V.', ok: true },
    { time: '11:30', name: 'Tomás H.', ok: true },
    { time: '16:00', name: 'Valeria N.', ok: false },
  ],
  17: [
    { time: '14:00', name: 'Roberto C.', ok: true },
    { time: '16:00', name: '—', ok: null },
  ],
  18: [
    { time: '09:00', name: 'Agustina M.', ok: true },
    { time: '11:00', name: '—', ok: null },
    { time: '14:30', name: 'Diego S.', ok: true },
  ],
}

const WEEK_DAYS = [
  { n: 14, label: 'Lun' },
  { n: 15, label: 'Mar' },
  { n: 16, label: 'Mié' },
  { n: 17, label: 'Jue' },
  { n: 18, label: 'Vie' },
]

function AgendaCalendarMockup() {
  const [selected, setSelected] = useState(16)
  const slots = AGENDA_DATA[selected] || []

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden w-full max-w-sm">
      <div className="px-5 pt-4 pb-3 border-b border-stone-100">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Semana · 14 al 18 de abril</p>
        <div className="flex gap-1">
          {WEEK_DAYS.map(({ n, label }) => {
            const count = AGENDA_DATA[n].filter(s => s.ok !== null).length
            const isSelected = selected === n
            return (
              <button
                key={n}
                onClick={() => setSelected(n)}
                className={`flex-1 flex flex-col items-center py-2 rounded-2xl cursor-pointer ${
                  isSelected ? 'text-white' : 'text-stone-400 hover:bg-stone-50'
                }`}
                style={isSelected ? { backgroundColor: '#2785aa' } : {}}
              >
                <span className="text-[10px] font-bold uppercase">{label}</span>
                <span className={`text-base font-extrabold mt-0.5 ${isSelected ? 'text-white' : 'text-stone-700'}`}>{n}</span>
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/60' : 'bg-[#2785aa]/40'}`} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="divide-y divide-stone-50 min-h-[140px]">
        {slots.map(({ time, name, ok }) => (
          <div key={time} className="flex items-center gap-3 px-5 py-3">
            <span className="text-xs font-bold text-stone-400 w-10 shrink-0">{time}</span>
            {ok === null ? (
              <span className="text-xs text-stone-300 italic">Disponible</span>
            ) : (
              <>
                <span className="text-sm font-semibold text-stone-700 flex-1">{name}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="px-5 py-3 bg-stone-50">
        <p className="text-xs text-stone-400 text-center">URL pública activa · reservas con DNI</p>
      </div>
    </div>
  )
}

// ─── Stats mockup ──────────────────────────────────────────────────────────
const MOCK_PLAN_DIST = [
  { name: 'Plan 8 clases', value: 12, color: '#2785aa' },
  { name: 'Plan 4 cortes', value: 8,  color: '#C0A1C3' },
  { name: 'Plan mensual',  value: 5,  color: '#007a8e' },
]

const MOCK_WEEKLY = [14, 18, 12, 22, 19, 25, 21, 28]
const MOCK_WEEKLY_MAX = 28

function MockEstadisticas() {
  return (
    <div className="w-full max-w-sm space-y-3">
      {/* Summary */}
      <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-5">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Resumen</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total clientes',     value: '25', color: 'text-stone-800' },
            { label: 'Activos',            value: '18', color: 'text-emerald-600' },
            { label: 'Por vencer',         value: '4',  color: 'text-amber-500' },
            { label: 'Vencidos / sin usos', value: '3', color: 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-3 text-center bg-stone-50">
              <p className={`text-xl font-extrabold ${color}`}>{value}</p>
              <p className="text-[10px] text-stone-400 font-semibold mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan distribution */}
      <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-5">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Distribución por plan</p>
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: 'conic-gradient(#2785aa 0% 48%, #C0A1C3 48% 80%, #007a8e 80% 100%)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center flex-col">
                <p className="text-sm font-extrabold text-stone-800 leading-none">25</p>
                <p className="text-[10px] text-stone-400">total</p>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {MOCK_PLAN_DIST.map(({ name, value, color }) => (
              <div key={name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-stone-600 truncate">{name}</span>
                </div>
                <span className="text-xs font-bold text-stone-800 shrink-0">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly activity */}
      <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-5">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-0.5">Actividad semanal</p>
        <p className="text-[10px] text-stone-300 mb-4">Usos registrados · últimas 8 semanas</p>
        <div className="flex items-end gap-1 h-20">
          {MOCK_WEEKLY.map((count, i) => (
            <div key={i} className="flex-1 rounded-t" style={{
              height: `${(count / MOCK_WEEKLY_MAX) * 100}%`,
              backgroundColor: '#2785aa',
              opacity: 0.3 + (i / 7) * 0.7,
            }} />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-stone-300">17/2</span>
          <span className="text-[10px] text-stone-300">7/4</span>
        </div>
      </div>
    </div>
  )
}

// ─── Status badges ─────────────────────────────────────────────────────────
const STATUS_BADGES = [
  { label: 'Activa',     desc: 'El cliente tiene usos disponibles y está dentro de la fecha de vigencia.', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  { label: 'Por vencer', desc: 'Quedan menos de 7 días para que venza la suscripción.',                    bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  { label: 'Vencida',    desc: 'La fecha de vigencia ya pasó. Es momento de renovar.',                    bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400' },
  { label: 'Sin usos',   desc: 'El cliente usó todos los usos del plan antes de que venza.',              bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400' },
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

      {/* ── Registrar uso ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex justify-center order-2 md:order-1">
            <RegistroUsoMockup />
          </div>
          <div className="flex-1 order-1 md:order-2 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto md:mx-0" style={{ backgroundColor: '#e8f4f8' }}>
              <Zap size={26} style={{ color: '#2785aa' }} />
            </div>
            <h2 className="font-extrabold text-3xl sm:text-4xl text-stone-900 mb-4">
              Un toque para registrar cada visita
            </h2>
            <p className="text-stone-500 leading-relaxed mb-6">
              Cuando el cliente llega, lo buscás, tocás <strong className="text-stone-700">Registrar uso</strong> y listo. El contador baja automáticamente, el historial se actualiza y podés agregar una nota si querés. Desde cualquier dispositivo, en segundos.
            </p>
            <ul className="space-y-2.5 text-left max-w-sm mx-auto md:mx-0">
              {[
                'Un click, sin pasos extra',
                'Historial completo con fecha y hora',
                'Alerta automática cuando se quedan sin usos',
                'Podés agregar una nota por visita',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="shrink-0" style={{ color: '#2785aa' }} />
                  <span className="text-sm text-stone-600">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Renovaciones ── */}
      <section className="py-24 px-4" style={{ backgroundColor: '#f8fafb' }}>
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
          <div className="flex-1 flex justify-center">
            <RenovacionMockup />
          </div>
        </div>
      </section>

      {/* ── Agenda ── */}
      <section className="py-24 px-4" style={{ background: 'linear-gradient(160deg, #f0f7fb 0%, #faf5fb 100%)' }}>
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto lg:mx-0" style={{ backgroundColor: 'rgba(192,161,195,0.2)' }}>
              <CalendarDays size={26} style={{ color: '#9b96c3' }} />
            </div>
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: 'rgba(192,161,195,0.2)', color: '#9b96c3' }}>
              Función Pro
            </span>
            <h2 className="font-extrabold text-3xl sm:text-4xl text-stone-900 mb-4">
              ¿Querés administrar tu agenda?
            </h2>
            <p className="text-stone-500 leading-relaxed mb-6">
              Activá la opción, definí tu disponibilidad (días, horarios, duración de cada turno) y compartí tu URL pública. Tus clientes ingresan, eligen día, horario y listo.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
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
          <div className="flex-1 flex justify-center lg:justify-end">
            <AgendaCalendarMockup />
          </div>
        </div>
      </section>

      {/* ── Estadísticas ── */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto lg:mx-0" style={{ backgroundColor: 'rgba(39,133,170,0.1)' }}>
              <BarChart2 size={26} style={{ color: '#2785aa' }} />
            </div>
            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: 'rgba(39,133,170,0.1)', color: '#2785aa' }}>
              Función Pro
            </span>
            <h2 className="font-extrabold text-3xl sm:text-4xl text-stone-900 mb-4">
              Tomá decisiones con datos
            </h2>
            <p className="text-stone-500 leading-relaxed mb-6">
              Conocé qué planes son los más populares, qué días tenés más actividad y cuánto facturaste en el mes con tus suscripciones. Todo en el panel de estadísticas.
            </p>
            <ul className="space-y-2.5 text-left max-w-sm mx-auto lg:mx-0">
              {[
                'Distribución de clientes por plan',
                'Actividad semanal de los últimos 2 meses',
                'Consumo promedio por plan',
                'Ingresos totales y de los últimos 30 días',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="shrink-0" style={{ color: '#2785aa' }} />
                  <span className="text-sm text-stone-600">{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex justify-center lg:justify-end">
            <MockEstadisticas />
          </div>
        </div>
      </section>

      {/* ── Casos de uso ── */}
      <section className="py-24 px-4" style={{ backgroundColor: '#f8fafb' }}>
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
            ].map(({ Icon, title, desc, color, bg }) => (
              <div key={title} className="rounded-3xl border border-stone-100 p-5 shadow-sm hover:shadow-md transition-all" style={{ backgroundColor: bg }}>
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
