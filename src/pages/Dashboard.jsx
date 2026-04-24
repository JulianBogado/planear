import { useNavigate, useOutletContext } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Users, CalendarDays } from 'lucide-react'
import { useSubscribers } from '../hooks/useSubscribers'
import { useWeekAppointments } from '../hooks/useAppointments'
import { useSubscription } from '../hooks/useSubscription'
import { useIsAdmin } from '../hooks/useIsAdmin'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { StatsSkeleton, SubscriberCardSkeleton } from '../components/ui/Skeleton'
import { StatusBadge } from '../components/ui/StatusBadge'

export default function Dashboard() {
  const navigate = useNavigate()
  const { business } = useOutletContext()
  const { showToast } = useToast()
  const { subscribers, loading } = useSubscribers(business?.id)
  const isSuperuser = useIsAdmin()
  const { canReserve, effectiveTier } = useSubscription(business)
  const showAgenda = (canReserve || isSuperuser) && business?.agenda_enabled !== false
  const [verifyingSubscription, setVerifyingSubscription] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')
  const [verificationError, setVerificationError] = useState('')

  useEffect(() => {
    const message = sessionStorage.getItem('post_downgrade_notice')
    if (!message) return

    showToast(message)
    sessionStorage.removeItem('post_downgrade_notice')
  }, [showToast])

  useEffect(() => {
    async function verifySubscription() {
      if (!business?.id || effectiveTier === 'pro' || verifyingSubscription) return

      const pendingCheckout = sessionStorage.getItem('mp_checkout_pending') === 'true'
      if (pendingCheckout) {
        setVerificationMessage('Estamos verificando tu pago. Esto puede tardar hasta un minuto.')
        setVerificationError('')
        sessionStorage.removeItem('mp_checkout_pending')
      }

      setVerifyingSubscription(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const attempts = pendingCheckout ? 8 : 1
        let synced = false

        for (let attempt = 0; attempt < attempts; attempt += 1) {
          const { data, error } = await supabase.functions.invoke('verify-subscription', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })

          if (!error && data?.business?.tier && data.business.tier !== business.tier) {
            synced = true
            window.location.reload()
            return
          }

          if (attempt < attempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 5000))
          }
        }

        if (pendingCheckout && !synced) {
          setVerificationMessage('')
          setVerificationError('Recibimos tu pago, pero la activacion esta demorando mas de lo normal. Actualiza en un minuto o entra a Configuracion.')
        }
      } finally {
        setVerifyingSubscription(false)
      }
    }

    verifySubscription()
  }, [business?.id, business?.tier, effectiveTier, verifyingSubscription])

  const todayDate = new Date()
  const todayStr    = format(todayDate, 'yyyy-MM-dd')
  const tomorrowStr = format(new Date(todayDate.getTime() + 86400000), 'yyyy-MM-dd')
  const weekStartStr = format(todayDate, 'yyyy-MM-dd')
  const { byDay } = useWeekAppointments(showAgenda ? business?.id : null, weekStartStr)

  const todayAppts    = byDay.find(d => d.dateStr === todayStr)?.appts.filter(a => a.status !== 'cancelled') ?? []
  const tomorrowAppts = byDay.find(d => d.dateStr === tomorrowStr)?.appts.filter(a => a.status !== 'cancelled') ?? []
  const weekRestDays  = byDay.filter(d => d.dateStr !== todayStr && d.dateStr !== tomorrowStr && d.appts.some(a => a.status !== 'cancelled'))

  const activos   = subscribers.filter(s => s.status === 'active').length
  const porVencer = subscribers.filter(s => s.status === 'expiring_soon').length
  const alertas   = subscribers.filter(s => s.status === 'expired' || s.status === 'no_uses').length

  if (loading) return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-10 w-16 rounded-full" />
        <div className="skeleton h-4 w-36 rounded-full" />
      </div>
      <StatsSkeleton />
      <div className="space-y-2.5">
        {[...Array(5)].map((_, i) => <SubscriberCardSkeleton key={i} />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-extrabold text-4xl text-stone-900 leading-tight">Hola</h1>
        {business && (
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-brand-600 font-semibold text-base">{business.name}</p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              effectiveTier === 'pro'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : effectiveTier === 'starter'
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'bg-stone-100 text-stone-600 border border-stone-200'
            }`}>
              {effectiveTier}
            </span>
          </div>
        )}
        {verificationMessage && (
          <div className="mt-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 max-w-xl">
            {verificationMessage}
          </div>
        )}
        {verificationError && (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 max-w-xl">
            {verificationError}
          </div>
        )}
      </div>

      {/* Stats — editorial */}
      <div className="bg-surface rounded-3xl shadow-card p-1 grid grid-cols-3 divide-x divide-stone-100">
        <StatCell label="Activos"    value={activos}   valueColor="text-emerald-600" onClick={() => navigate('/suscriptores', { state: { filter: 'active' } })} />
        <StatCell label="Por vencer" value={porVencer} valueColor="text-amber-500"   onClick={() => navigate('/suscriptores', { state: { filter: 'expiring_soon' } })} />
        <StatCell label="Alertas"    value={alertas}   valueColor="text-red-500"     onClick={() => navigate('/suscriptores', { state: { filter: 'expired' } })} />
      </div>

      {/* Upcoming appointments */}
      {showAgenda && (
        <button
          onClick={() => navigate('/agenda')}
          className="w-full bg-surface rounded-3xl shadow-card p-5 text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-brand-600" />
              <h2 className="font-semibold text-stone-800">Turnos próximos</h2>
            </div>
            <span className="text-xs text-brand-600 font-semibold">Ver agenda →</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ApptMiniList label="Hoy" appts={todayAppts} />
            <ApptMiniList label="Mañana" appts={tomorrowAppts} />
          </div>
          {weekRestDays.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Esta semana</p>
              {weekRestDays.map(({ dateStr: ds, date: d, appts }) => {
                const active = appts.filter(a => a.status !== 'cancelled')
                return (
                  <div key={ds} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-500 w-24 shrink-0 capitalize">
                      {format(d, 'EEEE d/MM', { locale: es })}
                    </span>
                    <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                      {active.slice(0, 4).map(a => (
                        <span key={a.id} className="text-xs text-stone-600 bg-surface-tint rounded-full px-2 py-0.5">
                          {format(new Date(a.slot_start), 'HH:mm')} {a.client_name}
                        </span>
                      ))}
                      {active.length > 4 && (
                        <span className="text-xs text-stone-400">+{active.length - 4} más</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </button>
      )}

      {/* Subscriber list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-stone-800 text-base">Todos los clientes</h2>
          <button onClick={() => navigate('/suscriptores')} className="text-sm text-brand-600 hover:text-brand-700 font-semibold">
            Ver todos →
          </button>
        </div>

        {subscribers.length === 0 ? (
          <EmptyState
            icon={<Users size={40} className="text-stone-300" />}
            title="No hay clientes aún"
            description="Empezá agregando tu primer cliente"
            action={<Button onClick={() => navigate('/suscriptores')}>Agregar cliente</Button>}
          />
        ) : (
          <div className="space-y-2.5">
            {subscribers.slice(0, 20).map(sub => (
              <button
                key={sub.id}
                onClick={() => navigate(`/suscriptores/${sub.id}`)}
                className="w-full bg-surface rounded-2xl shadow-card hover:shadow-hover transition-shadow px-4 py-3.5 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-stone-900 text-[15px] truncate">{sub.name}</p>
                      <StatusBadge status={sub.status} />
                    </div>
                    <p className="text-xs text-stone-400 mt-1 truncate font-medium">{sub.plans?.name ?? 'Sin plan'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {sub.plans?.price != null && (
                      <p className="font-extrabold text-xl text-stone-800">
                        ${Number(sub.plans.price).toLocaleString('es-AR')}
                      </p>
                    )}
                    <p className="text-[10px] text-stone-400 -mt-0.5">
                      {sub.uses_remaining} usos · {format(new Date(sub.end_date + 'T00:00:00'), 'dd/MM/yy')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            {subscribers.length > 20 && (
              <button onClick={() => navigate('/suscriptores')} className="w-full text-center text-sm text-brand-600 py-2 hover:underline font-semibold">
                Ver los {subscribers.length - 20} restantes →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ApptMiniList({ label, appts }) {
  return (
    <div className="bg-surface-tint rounded-2xl px-3 py-3">
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">{label}</p>
      {appts.length === 0 ? (
        <p className="text-xs text-stone-400">Sin turnos</p>
      ) : (
        <div className="space-y-1.5">
          {appts.slice(0, 4).map(a => (
            <div key={a.id} className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-brand-700 shrink-0 w-10">
                {format(new Date(a.slot_start), 'HH:mm')}
              </span>
              <span className="text-xs text-stone-700 truncate">{a.client_name}</span>
              {a.status === 'confirmed' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              )}
            </div>
          ))}
          {appts.length > 4 && (
            <p className="text-[10px] text-stone-400">+{appts.length - 4} más</p>
          )}
        </div>
      )}
    </div>
  )
}

function StatCell({ label, value, valueColor, onClick }) {
  return (
    <button onClick={onClick} className="text-center py-5 px-2 rounded-3xl hover:bg-stone-50 transition-colors w-full">
      <p className={`font-extrabold text-5xl leading-none ${valueColor}`}>{value}</p>
      <p className="text-xs text-stone-500 mt-2 font-semibold uppercase tracking-wide">{label}</p>
    </button>
  )
}
