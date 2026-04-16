import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom'
import { format } from 'date-fns'
import { Users, MoreHorizontal, Check, RefreshCw, ChevronRight, Search } from 'lucide-react'
import { usePlans } from '../hooks/usePlans'
import { useSubscribers } from '../hooks/useSubscribers'
import { StatusBadge } from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Textarea, Select } from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { SubscriberCardSkeleton } from '../components/ui/Skeleton'
import UpgradeModal from '../components/ui/UpgradeModal'
import { useSubscription } from '../hooks/useSubscription'

const STATUS_FILTERS = [
  { value: 'all',           label: 'Todos' },
  { value: 'active',        label: 'Activos' },
  { value: 'expiring_soon', label: 'Por vencer' },
  { value: 'expired',       label: 'Vencidos' },
]

const EMPTY_FORM_BASE = { name: '', phone: '', dni: '', plan_id: '', notes: '' }
function freshForm() { return { ...EMPTY_FORM_BASE, start_date: format(new Date(), 'yyyy-MM-dd') } }

export default function Subscribers() {
  const navigate = useNavigate()
  const { business } = useOutletContext()
  const { plans } = usePlans(business?.id)
  const { subscribers, loading, createSubscriber, registerUse } = useSubscribers(business?.id)
  const { canAddSubscriber } = useSubscription(business)

  const location = useLocation()
  const [filter, setFilter] = useState(location.state?.filter ?? 'all')
  const [expiredSubFilter, setExpiredSubFilter] = useState(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState(null)
  const [form, setForm] = useState(freshForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filtered = subscribers.filter(s => {
    const matchFilter =
      filter === 'all' ? true :
      filter === 'expired' ? (
        expiredSubFilter === 'date' ? s.status === 'expired' :
        expiredSubFilter === 'uses' ? s.status === 'no_uses' :
        (s.status === 'expired' || s.status === 'no_uses')
      ) :
      s.status === filter
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.dni && s.dni.replace(/\D/g, '').includes(search.replace(/\D/g, '')))
    return matchFilter && matchSearch
  })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleCreate(e) {
    e.preventDefault(); setError('')
    if (!form.plan_id) { setError('Seleccioná un plan.'); return }
    const plan = plans.find(p => p.id === form.plan_id)
    if (!plan) { setError('Plan no encontrado.'); return }
    setSaving(true)
    const { error: err } = await createSubscriber({ ...form, _plan: plan })
    setSaving(false)
    if (err) { setError('Error al guardar. Intentá de nuevo.'); return }
    setModalOpen(false)
    setForm(freshForm())
  }

  if (loading) return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="skeleton h-9 w-28 rounded-full" />
        <div className="skeleton h-8 w-20 rounded-full" />
      </div>
      <div className="skeleton h-10 w-full rounded-2xl mb-4" />
      <div className="flex gap-1.5 mb-5">
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-8 w-16 rounded-full" />)}
      </div>
      <div className="space-y-2.5">
        {[...Array(6)].map((_, i) => <SubscriberCardSkeleton key={i} />)}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-extrabold text-3xl text-stone-900">Clientes</h1>
        <Button size="sm" onClick={() => {
          if (!canAddSubscriber(subscribers.length)) { setUpgradeFeature('subscribers'); return }
          setError(''); setForm(freshForm()); setModalOpen(true)
        }}>
          + Nuevo
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar por nombre o DNI..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-surface border-0 shadow-card rounded-2xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder:text-stone-400 transition-all"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-1">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setExpiredSubFilter(null) }}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f.value
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-surface shadow-card text-stone-600 hover:text-stone-800'
            }`}
          >{f.label}</button>
        ))}
      </div>

      {/* Sub-filtro vencidos */}
      {filter === 'expired' && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 pl-1">
          {[
            { value: null,   label: 'Todos' },
            { value: 'date', label: 'Por fecha' },
            { value: 'uses', label: 'Por usos' },
          ].map(sf => (
            <button
              key={String(sf.value)}
              onClick={() => setExpiredSubFilter(sf.value)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                expiredSubFilter === sf.value
                  ? 'bg-stone-700 text-white'
                  : 'bg-surface-tint text-stone-500 hover:text-stone-700'
              }`}
            >{sf.label}</button>
          ))}
        </div>
      )}
      {filter !== 'expired' && <div className="mb-4" />}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={40} className="text-stone-300" />}
          title={search ? 'Sin resultados' : {
            all:           'No hay clientes aún',
            active:        'No hay clientes activos',
            expiring_soon: 'No hay clientes por vencer',
            expired:       'No hay clientes vencidos',
          }[filter]}
          description={search ? 'Probá con otro nombre o DNI' : {
            all:           'Agregá tu primer cliente para empezar',
            active:        'Todos tus clientes están vencidos o sin usos',
            expiring_soon: 'Ninguno vence en los próximos 7 días',
            expired:       'Todos los clientes están al día',
          }[filter]}
          action={!search && filter === 'all' && <Button onClick={() => setModalOpen(true)}>Agregar cliente</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map(sub => (
            <SubscriberCard
              key={sub.id}
              subscriber={sub}
              onNavigate={() => navigate(`/suscriptores/${sub.id}`)}
              onRegisterUse={() => registerUse(sub)}
              onRenew={() => navigate(`/suscriptores/${sub.id}`)}
            />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo cliente">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre completo" name="name" value={form.name} onChange={handleChange} placeholder="Ej: María García" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono (opcional)" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="11 2345-6789" />
            <Input label="DNI (opcional)" name="dni" value={form.dni} onChange={handleChange} placeholder="12.345.678" />
          </div>
          <Select label="Plan" name="plan_id" value={form.plan_id} onChange={handleChange} required>
            <option value="">Seleccioná un plan</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Input label="Fecha de inicio" name="start_date" type="date" value={form.start_date} onChange={handleChange} />
          <Textarea label="Notas (opcional)" name="notes" value={form.notes} onChange={handleChange} placeholder="Alguna información adicional..." />
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-2.5">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">Agregar</Button>
          </div>
        </form>
      </Modal>

      <UpgradeModal
        open={!!upgradeFeature}
        onClose={() => setUpgradeFeature(null)}
        feature={upgradeFeature}
      />
    </div>
  )
}

function SubscriberCard({ subscriber: sub, onNavigate, onRegisterUse, onRenew }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [registering, setRegistering] = useState(false)
  const menuRef = useRef(null)

  const canRegister = sub.uses_remaining > 0 && sub.status !== 'expired'
  const canRenew = sub.status === 'expired' || sub.status === 'expiring_soon' || sub.status === 'no_uses'
  const price = sub.plans?.price

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  async function handleRegister() {
    setConfirming(false); setMenuOpen(false); setRegistering(true)
    await onRegisterUse()
    setRegistering(false)
  }

  return (
    <div className="bg-surface rounded-2xl shadow-card">
      <button onClick={onNavigate} className="w-full px-4 pt-4 pb-3 text-left hover:bg-stone-50/50 transition-colors rounded-t-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-stone-900 text-[15px] truncate">{sub.name}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <p className="text-xs text-stone-400 truncate">{sub.plans?.name ?? 'Sin plan'}</p>
              <StatusBadge status={sub.status} />
            </div>
          </div>
          <div className="text-right shrink-0">
            {price != null && (
              <p className="font-extrabold text-xl text-stone-800">${Number(price).toLocaleString('es-AR')}</p>
            )}
            <p className="text-xs text-stone-400 mt-0.5">{sub.uses_remaining} usos restantes</p>
            <p className="text-xs text-stone-400">
              {(sub.status === 'expired' || sub.status === 'no_uses') ? 'Vencido el' : 'Vence el'}{' '}
              {format(new Date(sub.end_date + 'T00:00:00'), 'dd/MM/yy')}
            </p>
          </div>
        </div>
      </button>

      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex gap-3">
          {canRegister && (
            <button
              onClick={e => { e.stopPropagation(); setConfirming(true) }}
              disabled={registering}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50 flex items-center gap-1"
            >
              {registering
                ? <span className="w-3 h-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                : <Check size={12} />
              }
              Registrar uso
            </button>
          )}
          {canRenew && (
            <button
              onClick={e => { e.stopPropagation(); onRenew() }}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <RefreshCw size={12} /> Renovar
            </button>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 bottom-9 bg-surface rounded-2xl shadow-modal border border-stone-100 w-44 z-20 overflow-hidden">
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(false); onNavigate() }}
                className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 font-medium flex items-center gap-2"
              >
                <ChevronRight size={14} /> Ver detalle
              </button>
              {canRegister && (
                <button
                  onClick={e => { e.stopPropagation(); setConfirming(true); setMenuOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50 font-medium flex items-center gap-2"
                >
                  <Check size={14} /> Registrar uso
                </button>
              )}
              {canRenew && (
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onRenew() }}
                  className="w-full text-left px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 font-medium flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Renovar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {confirming && (
        <div className="px-4 pb-4">
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-3 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-brand-800">¿Confirmás el registro de uso?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className="text-xs text-stone-500 hover:text-stone-700 font-medium">Cancelar</button>
              <button onClick={handleRegister} className="text-xs bg-brand-600 text-white px-3 py-1 rounded-full font-semibold hover:bg-brand-700">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

