import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Users, MoreHorizontal, Check, RefreshCw, ChevronRight, Search, IdCard, Phone, CalendarCheck, Copy, Trash2, AlertTriangle, CheckSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePlans } from '../hooks/usePlans'
import { useSubscribers } from '../hooks/useSubscribers'
import { useToast } from '../context/ToastContext'
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

const EMPTY_FORM_BASE = { name: '', phone: '', dni: '', email: '', plan_id: '', notes: '', amount: '' }
function freshForm() { return { ...EMPTY_FORM_BASE, start_date: format(new Date(), 'yyyy-MM-dd') } }

export default function Subscribers() {
  const navigate = useNavigate()
  const { business } = useOutletContext()
  const { plans } = usePlans(business?.id)
  const { subscribers, loading, createSubscriber, registerUse, renewSubscriber, deleteSubscriber } = useSubscribers(business?.id)
  const { canAddSubscriber } = useSubscription(business)
  const { showToast } = useToast()

  const location = useLocation()
  const [filter, setFilter] = useState(location.state?.filter ?? 'all')
  const [expiredSubFilter, setExpiredSubFilter] = useState(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState(null)
  const [form, setForm] = useState(freshForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Bulk selection
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkAction, setBulkAction] = useState(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)

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
    if (!form.name.trim())  { setError('El nombre es obligatorio.'); return }
    if (!form.phone.trim()) { setError('El teléfono es obligatorio.'); return }
    if (!form.dni.trim())   { setError('El DNI es obligatorio.'); return }
    if (!form.email.trim()) { setError('El email es obligatorio.'); return }
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

  function toggleSelectionMode() {
    setSelectionMode(v => !v)
    setSelectedIds(new Set())
  }

  function toggleSelectId(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedSubscribers = subscribers.filter(s => selectedIds.has(s.id))

  async function handleBulkRegister() {
    setBulkLoading(true)
    const eligible = selectedSubscribers.filter(s => s.uses_remaining > 0 && s.status !== 'expired')
    await Promise.all(eligible.map(s => registerUse(s)))
    setBulkLoading(false)
    setBulkAction(null)
    setSelectedIds(new Set())
    setSelectionMode(false)
    showToast(`Uso registrado para ${eligible.length} cliente${eligible.length !== 1 ? 's' : ''}`)
  }

  async function handleBulkRenew() {
    setBulkLoading(true)
    await Promise.all(selectedSubscribers.map(s => renewSubscriber(s, '', null)))
    setBulkLoading(false)
    setBulkAction(null)
    setSelectedIds(new Set())
    setSelectionMode(false)
    showToast(`${selectedSubscribers.length} suscripción${selectedSubscribers.length !== 1 ? 'es' : ''} renovada${selectedSubscribers.length !== 1 ? 's' : ''}`)
  }

  async function handleBulkDelete() {
    if (deleteConfirmText !== 'ELIMINAR') return
    setBulkLoading(true)
    await Promise.all(selectedSubscribers.map(s => deleteSubscriber(s.id)))
    setBulkLoading(false)
    setBulkAction(null)
    setDeleteConfirmText('')
    setSelectedIds(new Set())
    setSelectionMode(false)
    showToast(`${selectedSubscribers.length} cliente${selectedSubscribers.length !== 1 ? 's' : ''} eliminado${selectedSubscribers.length !== 1 ? 's' : ''}`)
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
    <div className={selectionMode ? 'pb-28' : ''}>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-extrabold text-3xl text-stone-900">Clientes</h1>
        <div className="flex gap-2">
          {!selectionMode && (
            <Button size="sm" variant="outline" onClick={toggleSelectionMode}>
              <CheckSquare size={14} className="mr-1" /> Seleccionar
            </Button>
          )}
          {selectionMode ? (
            <Button size="sm" variant="outline" onClick={toggleSelectionMode}>Cancelar</Button>
          ) : (
            <Button size="sm" onClick={() => {
              if (!canAddSubscriber(subscribers.length)) { setUpgradeFeature('subscribers'); return }
              setError(''); setForm(freshForm()); setModalOpen(true)
            }}>
              + Nuevo
            </Button>
          )}
        </div>
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
              plans={plans}
              onNavigate={() => navigate(`/suscriptores/${sub.id}`)}
              onRegisterUse={() => registerUse(sub)}
              onRenew={() => navigate(`/suscriptores/${sub.id}`)}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(sub.id)}
              onToggleSelect={() => toggleSelectId(sub.id)}
            />
          ))}
        </div>
      )}

      {/* Nuevo cliente modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo cliente">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre completo" name="name" value={form.name} onChange={handleChange} placeholder="Ej: María García" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="11 2345-6789" required />
            <Input label="DNI" name="dni" value={form.dni} onChange={handleChange} placeholder="12.345.678" required />
          </div>
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="cliente@email.com" required />
          <Select label="Plan" name="plan_id" value={form.plan_id} onChange={handleChange} required>
            <option value="">Seleccioná un plan</option>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ${Number(p.price).toLocaleString('es-AR')}</option>)}
          </Select>
          <Input label="Fecha de inicio" name="start_date" type="date" value={form.start_date} onChange={handleChange} />
          <Input label="Monto pagado (opcional)" name="amount" type="number" min="0" value={form.amount} onChange={handleChange} placeholder="Ej: 15000" />
          <Textarea label="Notas (opcional)" name="notes" value={form.notes} onChange={handleChange} placeholder="Alguna información adicional..." />
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-2.5">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">Agregar</Button>
          </div>
        </form>
      </Modal>

      {/* Bulk: Renovar */}
      <Modal open={bulkAction === 'renew'} onClose={() => setBulkAction(null)} title="Renovar suscripciones">
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Se van a renovar <span className="font-bold text-stone-900">{selectedIds.size} cliente{selectedIds.size !== 1 ? 's' : ''}</span> con el mismo plan que tienen actualmente. ¿Confirmás?
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkAction(null)} className="flex-1">Cancelar</Button>
            <Button onClick={handleBulkRenew} loading={bulkLoading} className="flex-1">
              <RefreshCw size={14} className="mr-1.5" /> Renovar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk: Registrar uso */}
      <Modal open={bulkAction === 'register'} onClose={() => setBulkAction(null)} title="Registrar uso masivo">
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Se va a registrar un uso para <span className="font-bold text-stone-900">{selectedIds.size} cliente{selectedIds.size !== 1 ? 's' : ''}</span>. ¿Confirmás?
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkAction(null)} className="flex-1">Cancelar</Button>
            <Button onClick={handleBulkRegister} loading={bulkLoading} className="flex-1">
              <Check size={14} className="mr-1.5" /> Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk: Eliminar */}
      <Modal open={bulkAction === 'delete'} onClose={() => { setBulkAction(null); setDeleteConfirmText('') }} title="Eliminar clientes">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium leading-relaxed">
              Estás a punto de eliminar <span className="font-bold">{selectedIds.size} cliente{selectedIds.size !== 1 ? 's' : ''}</span> de manera masiva. Esta acción no se puede deshacer.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-widest block mb-2">
              Para confirmar, escribí ELIMINAR
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full bg-surface border border-stone-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-stone-300"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setBulkAction(null); setDeleteConfirmText('') }} className="flex-1">Cancelar</Button>
            <button
              onClick={handleBulkDelete}
              disabled={deleteConfirmText !== 'ELIMINAR' || bulkLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-full py-2.5 text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {bulkLoading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Trash2 size={14} /> Eliminar</>
              }
            </button>
          </div>
        </div>
      </Modal>

      <UpgradeModal
        open={!!upgradeFeature}
        onClose={() => setUpgradeFeature(null)}
        feature={upgradeFeature}
      />

      {/* Bulk action bar */}
      {selectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 shadow-modal px-4 py-3 pb-safe flex items-center gap-3">
          <p className="text-xs font-semibold text-stone-600 shrink-0">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2 ml-auto flex-wrap justify-end">
            <button
              onClick={() => setBulkAction('renew')}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 hover:bg-amber-100 transition-colors"
            >
              <RefreshCw size={12} /> Renovar
            </button>
            <button
              onClick={() => setBulkAction('register')}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-full px-3 py-1.5 hover:bg-brand-100 transition-colors"
            >
              <Check size={12} /> Registrar uso
            </button>
            <button
              onClick={() => setBulkAction('delete')}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={12} /> Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SubscriberCard({ subscriber: sub, plans, onNavigate, onRegisterUse, onRenew, selectionMode, isSelected, onToggleSelect }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [usesAnimating, setUsesAnimating] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [todayUsage, setTodayUsage] = useState(null)
  const menuRef = useRef(null)
  const prevUsesRef = useRef(sub.uses_remaining)
  const { showToast } = useToast()

  useEffect(() => {
    if (prevUsesRef.current !== sub.uses_remaining) {
      prevUsesRef.current = sub.uses_remaining
      setUsesAnimating(true)
      const t = setTimeout(() => setUsesAnimating(false), 500)
      return () => clearTimeout(t)
    }
  }, [sub.uses_remaining])

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

  async function startConfirming() {
    setTodayUsage(null)
    setConfirming(true)
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('usage_logs')
      .select('used_at')
      .eq('subscriber_id', sub.id)
      .eq('business_id', sub.business_id)
      .is('deleted_at', null)
      .gte('used_at', `${today}T00:00:00`)
      .lt('used_at', `${today}T23:59:59.999`)
      .order('used_at', { ascending: false })
      .limit(1)
    setTodayUsage(data?.[0] ?? undefined)
  }

  async function handleRegister() {
    setConfirming(false); setMenuOpen(false); setRegistering(true); setTodayUsage(null)
    const result = await onRegisterUse()
    setRegistering(false)
    if (result?.error) {
      showToast('Error al registrar el uso', 'error')
    } else {
      setRegistered(true)
      setTimeout(() => setRegistered(false), 1800)
    }
  }

  function copyPhone(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(sub.phone)
    showToast('Teléfono copiado')
  }

  function statusDateText() {
    if (sub.status === 'no_uses') {
      return sub.last_used_at
        ? `Sin usos desde ${format(new Date(sub.last_used_at), 'dd/MM/yy')}`
        : 'Sin usos disponibles'
    }
    const label = sub.status === 'expired' ? 'Vencido el' : 'Vence el'
    return `${label} ${format(new Date(sub.end_date + 'T00:00:00'), 'dd/MM/yy')}`
  }

  if (selectionMode) {
    return (
      <div
        onClick={onToggleSelect}
        className={`bg-surface rounded-2xl shadow-card cursor-pointer transition-all select-none ${isSelected ? 'ring-2 ring-brand-400' : 'hover:ring-1 hover:ring-stone-200'}`}
      >
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-stone-300 bg-white'}`}>
              {isSelected && <Check size={12} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-stone-900 text-[15px] truncate">{sub.name}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <p className="text-xs text-stone-400 truncate">{sub.plans?.name ?? plans?.find(p => p.id === sub.plan_id)?.name ?? 'Sin plan'}</p>
                <StatusBadge status={sub.status} />
              </div>
            </div>
            <div className="text-right shrink-0">
              {price != null && (
                <p className="font-extrabold text-xl text-stone-800">${Number(price).toLocaleString('es-AR')}</p>
              )}
              <p className="text-xs text-stone-400 mt-0.5">{sub.uses_remaining} usos restantes</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-2xl shadow-card">
      {/* Área principal clickeable */}
      <button onClick={onNavigate} className="w-full px-4 pt-4 pb-3 text-left hover:bg-stone-50/50 transition-colors rounded-t-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-stone-900 text-[15px] truncate">{sub.name}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <p className="text-xs text-stone-400 truncate">{sub.plans?.name ?? plans?.find(p => p.id === sub.plan_id)?.name ?? 'Sin plan'}</p>
              <StatusBadge status={sub.status} />
            </div>
          </div>
          <div className="text-right shrink-0">
            {price != null && (
              <p className="font-extrabold text-xl text-stone-800">${Number(price).toLocaleString('es-AR')}</p>
            )}
            <p className="text-xs text-stone-400 mt-0.5">
              <span className={usesAnimating ? 'animate-uses-pop text-brand-600 font-semibold' : ''}>
                {sub.uses_remaining}
              </span>
              {' '}usos restantes
            </p>
            <p className="text-xs text-stone-400">{statusDateText()}</p>
          </div>
        </div>
      </button>

      {/* Franja de info */}
      <div className="px-4 pb-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-stone-100 pt-2.5">
        {sub.dni && (
          <span className="flex items-center gap-1 text-[10px] text-stone-400">
            <IdCard size={10} className="shrink-0" /> {sub.dni}
          </span>
        )}
        {sub.phone && (
          <button
            onClick={copyPhone}
            className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-brand-600 transition-colors group"
            title="Copiar teléfono"
          >
            <Phone size={10} className="shrink-0" />
            {sub.phone}
            <Copy size={9} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
          </button>
        )}
        <span className="flex items-center gap-1 text-[10px] text-stone-400">
          <CalendarCheck size={10} className="shrink-0" />
          Activo desde {format(new Date(sub.start_date + 'T00:00:00'), 'dd/MM/yy')}
        </span>
      </div>

      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex gap-3">
          {canRegister && (
            <button
              onClick={e => { e.stopPropagation(); startConfirming() }}
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
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); startConfirming() }}
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
          <div className={`border rounded-2xl p-3 ${todayUsage ? 'bg-amber-50 border-amber-200' : 'bg-brand-50 border-brand-200'}`}>
            {todayUsage ? (
              <p className="text-xs font-medium text-amber-800 mb-2.5">
                Este cliente registró un uso el día{' '}
                {format(new Date(todayUsage.used_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}.
                {' '}¿Confirmás otro uso?
              </p>
            ) : (
              <p className="text-xs font-medium text-brand-800 mb-2.5">¿Confirmás el registro de uso?</p>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setConfirming(false); setTodayUsage(null) }} className="text-xs text-stone-500 hover:text-stone-700 font-medium">Cancelar</button>
              <button onClick={handleRegister} className={`text-xs text-white px-3 py-1 rounded-full font-semibold ${todayUsage ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-600 hover:bg-brand-700'}`}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {registered && (
        <div className="px-4 pb-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-2">
            <Check size={14} className="text-green-600 shrink-0" />
            <p className="text-xs font-medium text-green-800">Uso registrado</p>
          </div>
        </div>
      )}
    </div>
  )
}
