import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useNavigate, useOutletContext, Link } from 'react-router-dom'
import { BarChart2 } from 'lucide-react'
import { useIsAdmin } from '../hooks/useIsAdmin'
import { usePlans } from '../hooks/usePlans'
import { useSubscribers } from '../hooks/useSubscribers'
import { useStats } from '../hooks/useStats'
import { useSubscription } from '../hooks/useSubscription'
import Button from '../components/ui/Button'

const PLAN_COLORS = ['#c96b61', '#507758', '#6357aa', '#d4956a', '#4a90b8', '#8b6bb1', '#5a9e6f']

function StatCard({ label, value, textColor }) {
  return (
    <div className="bg-surface rounded-2xl shadow-card px-4 py-4 text-center">
      <p className={`text-2xl font-extrabold ${textColor}`}>{value}</p>
      <p className="text-xs text-stone-400 mt-0.5 leading-tight">{label}</p>
    </div>
  )
}

function UsageTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div className="bg-white rounded-xl shadow-lg px-3 py-2 text-xs border border-stone-100">
      <p className="text-stone-500 mb-0.5">Semana del {label}</p>
      <p className="font-bold text-stone-800">{v} uso{v !== 1 ? 's' : ''}</p>
    </div>
  )
}

function PctTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg px-3 py-2 text-xs border border-stone-100">
      <p className="font-bold text-stone-800">{payload[0].value}% consumido</p>
    </div>
  )
}

export default function Stats() {
  const navigate = useNavigate()
  const { business } = useOutletContext()
  const { plans } = usePlans(business?.id)
  const { subscribers, loading } = useSubscribers(business?.id)
  const { usageByWeek, totalRevenue, recentRevenue, loading: statsLoading } = useStats(business?.id)
  const { canStats } = useSubscription(business)
  const isSuperuser = useIsAdmin()

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-9 w-40 rounded-full" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
        <div className="skeleton h-72 rounded-3xl" />
        <div className="skeleton h-52 rounded-3xl" />
        <div className="skeleton h-44 rounded-3xl" />
      </div>
    )
  }

  if (!canStats && !isSuperuser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-4">
          <BarChart2 size={28} />
        </div>
        <h2 className="font-extrabold text-xl text-stone-900 mb-2">Estadísticas en Plan Pro</h2>
        <p className="text-sm text-stone-500 mb-6 max-w-xs">
          Accedé a distribución por plan, consumo promedio, actividad semanal e ingresos con el plan Pro.
        </p>
        <Button onClick={() => navigate('/precios')}>Ver planes</Button>
      </div>
    )
  }

  const total = subscribers.length
  const active = subscribers.filter(s => s.status === 'active').length
  const expiringSoon = subscribers.filter(s => s.status === 'expiring_soon').length
  const alerts = subscribers.filter(s => s.status === 'expired' || s.status === 'no_uses').length

  const planDistribution = plans
    .map(p => ({
      name: p.name,
      value: subscribers.filter(s => s.plan_id === p.id).length,
    }))
    .filter(p => p.value > 0)

  const planUsageData = plans
    .map(p => {
      const planSubs = subscribers.filter(s => s.plan_id === p.id)
      if (planSubs.length === 0 || !p.total_uses) return null
      const avgPct =
        planSubs.reduce((sum, s) => {
          const consumed = p.total_uses - s.uses_remaining
          return sum + (consumed / p.total_uses) * 100
        }, 0) / planSubs.length
      return { name: p.name, promedio: Math.round(avgPct) }
    })
    .filter(Boolean)

  return (
    <div className="space-y-5">
      <h1 className="font-extrabold text-3xl text-stone-900">Estadísticas</h1>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total clientes" value={total} textColor="text-stone-800" />
        <StatCard label="Activos" value={active} textColor="text-green-600" />
        <StatCard label="Por vencer" value={expiringSoon} textColor="text-amber-500" />
        <StatCard label="Vencidos / sin usos" value={alerts} textColor="text-red-500" />
      </div>

      {/* Plan distribution */}
      <div className="bg-surface rounded-3xl shadow-card p-5">
        <h2 className="font-semibold text-stone-800 mb-4">Distribución por plan</h2>
        {planDistribution.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-8">
            No hay clientes asignados a planes aún
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {planDistribution.map((_, i) => (
                    <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [`${v} cliente${v !== 1 ? 's' : ''}`, name]}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-1">
              {planDistribution.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length] }}
                    />
                    <span className="text-sm text-stone-700 truncate">{p.name}</span>
                  </div>
                  <span className="text-sm font-bold text-stone-800 shrink-0">{p.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Consumo promedio por plan */}
      {planUsageData.length > 0 && (
        <div className="bg-surface rounded-3xl shadow-card p-5">
          <h2 className="font-semibold text-stone-800 mb-1">Consumo promedio por plan</h2>
          <p className="text-xs text-stone-400 mb-4">% de usos consumidos en promedio</p>
          <ResponsiveContainer width="100%" height={Math.max(100, planUsageData.length * 44)}>
            <BarChart
              data={planUsageData}
              layout="vertical"
              margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={115}
                tick={{ fontSize: 11, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="promedio" fill="var(--brand-600)" radius={[0, 4, 4, 0]} />
              <Tooltip content={<PctTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Actividad reciente */}
      <div className="bg-surface rounded-3xl shadow-card p-5">
        <h2 className="font-semibold text-stone-800 mb-1">Actividad reciente</h2>
        <p className="text-xs text-stone-400 mb-4">Usos registrados por semana (últimas 8 semanas)</p>
        {statsLoading ? (
          <div className="skeleton h-40 rounded-2xl" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={usageByWeek} margin={{ left: -20, right: 0, top: 4, bottom: 0 }}>
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: '#a8a29e' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#a8a29e' }}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="count" fill="var(--brand-600)" radius={[4, 4, 0, 0]} />
              <Tooltip content={<UsageTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Ingresos */}
      <div className="bg-surface rounded-3xl shadow-card p-5">
        <h2 className="font-semibold text-stone-800 mb-4">Ingresos</h2>
        {!statsLoading && totalRevenue === 0 ? (
          <p className="text-sm text-stone-400 text-center py-4">
            No hay pagos registrados aún.
            <br />
            <span className="text-xs">Registrá pagos desde la ficha de cada cliente.</span>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-tint rounded-2xl px-4 py-3">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">
                Total acumulado
              </p>
              {statsLoading ? (
                <div className="skeleton h-7 w-24 rounded-full" />
              ) : (
                <p className="font-extrabold text-xl text-stone-800">
                  ${totalRevenue.toLocaleString('es-AR')}
                </p>
              )}
            </div>
            <div className="bg-surface-tint rounded-2xl px-4 py-3">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">
                Últimos 30 días
              </p>
              {statsLoading ? (
                <div className="skeleton h-7 w-24 rounded-full" />
              ) : (
                <p className="font-extrabold text-xl text-stone-800">
                  ${recentRevenue.toLocaleString('es-AR')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias */}
      <div className="bg-surface rounded-3xl shadow-card p-5 text-center">
        <p className="text-sm text-stone-500 mb-2">¿No encontrás lo que buscás?</p>
        <Link to="/ayuda" className="text-sm font-semibold text-brand-600 hover:underline">
          Compartilo con nosotros →
        </Link>
      </div>
    </div>
  )
}
