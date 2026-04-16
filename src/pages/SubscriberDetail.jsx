import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChevronLeft, Phone, CreditCard, Package, FileText,
  Calendar, Pencil, Trash2, Check, RefreshCw, AlertTriangle, DollarSign,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePlans } from '../hooks/usePlans'
import { useSubscribers } from '../hooks/useSubscribers'
import { useToast } from '../context/ToastContext'
import { computeStatus } from '../utils/status'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Textarea, Select } from '../components/ui/Input'
import { StatusBadge } from '../components/ui/StatusBadge'

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-stone-300 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm text-stone-700 font-medium truncate">{value ?? <span className="text-stone-300 font-normal">—</span>}</p>
      </div>
    </div>
  )
}

export default function SubscriberDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { business } = useOutletContext()
  const { plans } = usePlans(business?.id)
  const { subscribers, loading: pageLoading, updateSubscriber, deleteSubscriber, registerUse, renewSubscriber } = useSubscribers(business?.id)
  const { showToast } = useToast()

  const [usageLogs, setUsageLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)

  const [renewModal, setRenewModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [useModal, setUseModal] = useState(false)
  const [useNotes, setUseNotes] = useState('')

  const [renewAmount, setRenewAmount] = useState('')
  const [renewPlanId, setRenewPlanId] = useState('')
  const [saving, setSaving] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [deleteLogConfirm, setDeleteLogConfirm] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [startDateConfirm, setStartDateConfirm] = useState(false)
  const [error, setError] = useState('')

  const subscriber = subscribers.find(s => s.id === id)

  useEffect(() => {
    if (!id) return
    fetchLogs()
  }, [id, subscriber?.uses_remaining])

  useEffect(() => {
    if (!id) return
    fetchPayments()
  }, [id, subscriber?.start_date])

  async function fetchLogs() {
    if (!business?.id) return
    setLogsLoading(true)
    const { data } = await supabase
      .from('usage_logs').select('*').eq('subscriber_id', id).eq('business_id', business.id).order('used_at', { ascending: false })
    setUsageLogs(data ?? [])
    setLogsLoading(false)
  }

  async function fetchPayments() {
    if (!business?.id) return
    setPaymentsLoading(true)
    const { data } = await supabase
      .from('payments').select('*').eq('subscriber_id', id).order('paid_at', { ascending: false })
    setPayments(data ?? [])
    setPaymentsLoading(false)
  }

  if (pageLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-5 w-20 rounded-full" />
        {/* Header card */}
        <div className="bg-brand-50 rounded-3xl shadow-card p-5">
          <div className="flex items-start justify-between mb-5">
            <div className="space-y-2">
              <div className="skeleton h-7 w-40 rounded-full" />
              <div className="skeleton h-4 w-24 rounded-full" />
            </div>
            <div className="flex gap-1">
              <div className="skeleton w-8 h-8 rounded-full" />
              <div className="skeleton w-8 h-8 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          </div>
          <div className="skeleton h-11 rounded-full" />
        </div>
        {/* Info card */}
        <div className="bg-surface rounded-3xl shadow-card p-5 space-y-4">
          <div className="skeleton h-5 w-36 rounded-full" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="skeleton h-3 w-16 rounded-full" />
              <div className="skeleton h-4 w-48 rounded-full" />
            </div>
          ))}
        </div>
        {/* Usage history */}
        <div className="bg-surface rounded-3xl shadow-card p-5 space-y-3">
          <div className="skeleton h-5 w-36 rounded-full" />
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-4 w-56 rounded-full" />)}
        </div>
      </div>
    )
  }

  if (!subscriber) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-400">Cliente no encontrado</p>
        <button onClick={() => navigate('/suscriptores')} className="text-brand-600 text-sm mt-2">← Volver</button>
      </div>
    )
  }

  const statusInfo = computeStatus(subscriber.end_date, subscriber.uses_remaining)
  const canRegisterUse = subscriber.uses_remaining > 0 && statusInfo.status !== 'expired'
  const selectedPlanForRenew = plans.find(p => p.id === renewPlanId) ?? subscriber.plans
  const renewalEndDate = selectedPlanForRenew
    ? format(addDays(new Date(), selectedPlanForRenew.duration_days), 'dd/MM/yyyy') : '—'

  async function handleRegisterUse() {
    setRegistering(true)
    const { error: err } = await registerUse(subscriber, useNotes)
    setRegistering(false)
    setUseModal(false)
    setUseNotes('')
    if (err) showToast('Error al registrar el uso', 'error')
    else showToast('Uso registrado')
  }

  async function handleRenew() {
    setSaving(true)
    const newPlan = plans.find(p => p.id === renewPlanId) ?? null
    const { error: err } = await renewSubscriber(subscriber, renewAmount, newPlan)
    setSaving(false)
    setRenewModal(false)
    setRenewAmount('')
    if (err) showToast('Error al renovar', 'error')
    else showToast('Suscripción renovada')
  }

  async function handleDeleteLog(logId) {
    await supabase.from('usage_logs').delete().eq('id', logId)
    const newUses = subscriber.uses_remaining + 1
    const { status } = computeStatus(subscriber.end_date, newUses)
    await updateSubscriber(id, { uses_remaining: newUses, status })
    setDeleteLogConfirm(null)
    fetchLogs()
  }

  function openEdit() {
    setEditForm({ name: subscriber.name, phone: subscriber.phone ?? '', dni: subscriber.dni ?? '', plan_id: subscriber.plan_id ?? '', notes: subscriber.notes ?? '', start_date: subscriber.start_date })
    setStartDateConfirm(false); setError(''); setEditModal(true)
  }

  async function handleEditSave(e) {
    e?.preventDefault(); setError('')
    const startDateChanged = editForm.start_date !== subscriber.start_date
    if (startDateChanged && !startDateConfirm) { setStartDateConfirm(true); return }
    if (!editForm.name.trim()) { setError('El nombre es obligatorio.'); return }
    if (!editForm.plan_id) { setError('Seleccioná un plan.'); return }
    setSaving(true)
    let updateData = { name: editForm.name.trim(), phone: editForm.phone || null, dni: editForm.dni || null, plan_id: editForm.plan_id, notes: editForm.notes || null, start_date: editForm.start_date }
    if (startDateChanged || editForm.plan_id !== subscriber.plan_id) {
      const plan = plans.find(p => p.id === editForm.plan_id)
      if (plan) {
        const newEnd = format(addDays(new Date(editForm.start_date + 'T00:00:00'), plan.duration_days), 'yyyy-MM-dd')
        const { status } = computeStatus(newEnd, subscriber.uses_remaining)
        updateData = { ...updateData, end_date: newEnd, status }
      }
    }
    const { error: err } = await updateSubscriber(id, updateData)
    setSaving(false)
    if (err) { setError('Error al guardar.'); return }
    setEditModal(false); setStartDateConfirm(false)
    showToast('Cambios guardados')
  }

  async function handleDelete() {
    await deleteSubscriber(id)
    navigate('/suscriptores')
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/suscriptores')} className="text-stone-400 hover:text-stone-600 text-sm font-medium flex items-center gap-1">
        <ChevronLeft size={16} /> Clientes
      </button>

      {/* Header card */}
      <div className="bg-brand-50 rounded-3xl shadow-card p-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-extrabold text-2xl text-stone-900">{subscriber.name}</h1>
              <StatusBadge status={statusInfo.status} />
            </div>
            <p className="text-sm text-stone-500 mt-0.5 flex items-center gap-1.5">
              <Package size={13} /> {subscriber.plans?.name ?? 'Sin plan'}
            </p>
          </div>
          <div className="flex gap-1">
            <button onClick={openEdit} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-100 text-brand-400 hover:text-brand-600 transition-colors"><Pencil size={14} /></button>
            <button onClick={() => setDeleteConfirm(true)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-surface rounded-2xl p-3 text-center shadow-sm">
            <p className="font-extrabold text-2xl sm:text-3xl text-brand-700">{subscriber.uses_remaining}</p>
            <p className="text-[10px] text-stone-500 mt-0.5 font-semibold uppercase tracking-wide">usos</p>
          </div>
          <div className="bg-surface rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xs sm:text-sm font-bold text-stone-800">{format(new Date(subscriber.start_date + 'T00:00:00'), 'dd/MM/yy')}</p>
            <p className="text-[10px] text-stone-500 mt-0.5 font-semibold uppercase tracking-wide">inicio</p>
          </div>
          <div className="bg-surface rounded-2xl p-3 text-center shadow-sm">
            <p className="text-xs sm:text-sm font-bold text-stone-800">{format(new Date(subscriber.end_date + 'T00:00:00'), 'dd/MM/yy')}</p>
            <p className="text-[10px] text-stone-500 mt-0.5 font-semibold uppercase tracking-wide">
              {(subscriber.status === 'expired' || subscriber.status === 'no_uses') ? 'venció' : 'vence'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setUseModal(true)} disabled={!canRegisterUse} className="flex-1">
            <Check size={15} className="mr-1.5" /> Registrar uso
          </Button>
          <Button variant="secondary" onClick={() => { setRenewPlanId(subscriber.plan_id ?? ''); setRenewAmount(subscriber.plans?.price ? String(subscriber.plans.price) : ''); setRenewModal(true) }} className="flex-1">
            <RefreshCw size={15} className="mr-1.5" /> Renovar
          </Button>
        </div>
      </div>

      {/* Client info card */}
      <div className="bg-surface rounded-3xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-800">Información del cliente</h2>
          <button onClick={openEdit} className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
            <Pencil size={12} /> Editar
          </button>
        </div>
        <div className="space-y-2.5">
          <InfoRow icon={<Phone size={13} />} label="Teléfono" value={subscriber.phone} />
          <InfoRow icon={<CreditCard size={13} />} label="DNI" value={subscriber.dni} />
          <InfoRow
            icon={<Package size={13} />}
            label="Plan"
            value={subscriber.plans
              ? `${subscriber.plans.name} · ${subscriber.plans.total_uses} usos · ${subscriber.plans.duration_days} días · $${Number(subscriber.plans.price).toLocaleString('es-AR')}`
              : null}
          />
          {subscriber.plans?.items?.length > 0 && (
            <ul className="pl-8 space-y-0.5 -mt-1">
              {subscriber.plans.items.map((item, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-stone-400">
                  <span className="w-1 h-1 rounded-full bg-stone-300 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          {subscriber.notes && (
            <div className="flex items-start gap-2.5 pt-1">
              <span className="text-stone-300 mt-0.5 shrink-0"><FileText size={13} /></span>
              <div>
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-0.5">Notas</p>
                <p className="text-sm text-stone-600 leading-relaxed">{subscriber.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage history */}
      <div className="bg-surface rounded-3xl shadow-card p-5">
        <h2 className="font-semibold text-stone-800 mb-4">Historial de usos</h2>
        {logsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 pl-7">
                <div className="skeleton h-4 w-48 rounded-full" />
              </div>
            ))}
          </div>
        ) : usageLogs.length === 0 ? (
          <p className="text-sm text-stone-400">Sin usos registrados todavía</p>
        ) : (
          <div className="relative">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-stone-100" />
            {usageLogs.map(log => (
              <div key={log.id} className="relative flex items-center gap-3 py-2.5 pl-7 group">
                <div className="absolute left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-300 border-[1.5px] border-white shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-700 font-medium">
                    {format(new Date(log.used_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                  {log.notes && <p className="text-xs text-stone-400 mt-0.5">{log.notes}</p>}
                </div>
                <button
                  onClick={() => setDeleteLogConfirm(log)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-stone-300 hover:text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment history */}
      <div className="bg-surface rounded-3xl shadow-card p-5">
        <h2 className="font-semibold text-stone-800 mb-4">Historial de pagos</h2>
        {paymentsLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="skeleton h-4 w-32 rounded-full" />
                <div className="skeleton h-4 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-stone-400">Sin pagos registrados. Los pagos se agregan al renovar una suscripción.</p>
        ) : (
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                <p className="text-sm text-stone-600">
                  {format(new Date(p.paid_at), "dd/MM/yyyy", { locale: es })}
                </p>
                <p className="text-sm font-bold text-brand-700 flex items-center gap-1">
                  <DollarSign size={13} />
                  {Number(p.amount).toLocaleString('es-AR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register use modal */}
      <Modal open={useModal} onClose={() => { setUseModal(false); setUseNotes('') }} title="Registrar uso">
        <div className="space-y-4">
          <Textarea
            label="Nota (opcional)"
            value={useNotes}
            onChange={e => setUseNotes(e.target.value)}
            placeholder="Ej: clase de lunes, corte + barba..."
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setUseModal(false); setUseNotes('') }} className="flex-1">Cancelar</Button>
            <Button onClick={handleRegisterUse} loading={registering} className="flex-1">
              <Check size={15} className="mr-1.5" /> Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Renew modal */}
      <Modal open={renewModal} onClose={() => setRenewModal(false)} title="Renovar suscripción">
        <div className="space-y-4">
          <Select label="Plan" value={renewPlanId} onChange={e => {
            const p = plans.find(pl => pl.id === e.target.value)
            setRenewPlanId(e.target.value)
            if (p) setRenewAmount(String(p.price))
          }}>
            {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div className="bg-brand-50 rounded-2xl p-4 text-sm space-y-1.5">
            <p className="font-semibold text-brand-800 mb-2">Nuevo período</p>
            <p className="flex items-center gap-2 text-brand-700"><Calendar size={13} /> Inicio: hoy</p>
            <p className="flex items-center gap-2 text-brand-700"><Calendar size={13} /> Vencimiento: {renewalEndDate}</p>
            <p className="flex items-center gap-2 text-brand-700"><RefreshCw size={13} /> Usos: {selectedPlanForRenew?.total_uses ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">
              Monto cobrado (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm pointer-events-none">$</span>
              <input
                type="number"
                min="0"
                value={renewAmount}
                onChange={e => setRenewAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-surface-tint border-0 border-b-2 border-stone-200 focus:border-brand-600 rounded-t-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-0 transition-colors placeholder:text-stone-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRenewModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleRenew} loading={saving} className="flex-1">Renovar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={editModal} onClose={() => { setEditModal(false); setStartDateConfirm(false) }} title="Editar cliente">
        {editForm && (
          <form onSubmit={handleEditSave} className="space-y-4">
            <Input label="Nombre completo" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Teléfono (opcional)" type="tel" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              <Input label="DNI (opcional)" value={editForm.dni} onChange={e => setEditForm(p => ({ ...p, dni: e.target.value }))} />
            </div>
            <Select label="Plan" value={editForm.plan_id} onChange={e => setEditForm(p => ({ ...p, plan_id: e.target.value }))}>
              <option value="">Seleccioná un plan</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Input label="Fecha de inicio del plan" type="date" value={editForm.start_date} onChange={e => setEditForm(p => ({ ...p, start_date: e.target.value }))} />
            {editForm.start_date !== subscriber.start_date && !startDateConfirm && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                Cambiaste la fecha de inicio. Se recalculará la fecha de vencimiento al guardar.
              </div>
            )}
            {startDateConfirm && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                <p className="text-sm font-semibold text-amber-800 mb-1">¿Confirmar cambio de fecha?</p>
                <p className="text-xs text-amber-700 mb-3">La fecha de vencimiento se recalculará desde {editForm.start_date}.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setStartDateConfirm(false)} className="flex-1">Cancelar</Button>
                  <Button size="sm" loading={saving} onClick={handleEditSave} className="flex-1">Confirmar</Button>
                </div>
              </div>
            )}
            <Textarea label="Notas (opcional)" value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-2.5">{error}</p>}
            {!startDateConfirm && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditModal(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" loading={saving} className="flex-1">Guardar</Button>
              </div>
            )}
          </form>
        )}
      </Modal>

      {/* Delete log confirm */}
      <Modal open={!!deleteLogConfirm} onClose={() => setDeleteLogConfirm(null)} title="Eliminar uso">
        <p className="text-sm text-stone-600 mb-1">
          ¿Eliminar el uso del{' '}
          <strong>{deleteLogConfirm ? format(new Date(deleteLogConfirm.used_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es }) : ''}</strong>?
        </p>
        <p className="text-xs text-stone-400 mb-4">Se devolverá un uso al cliente.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDeleteLogConfirm(null)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={() => handleDeleteLog(deleteLogConfirm.id)} className="flex-1">Eliminar uso</Button>
        </div>
      </Modal>

      {/* Delete subscriber confirm */}
      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Eliminar cliente">
        <p className="text-sm text-stone-600 mb-4">¿Seguro que querés eliminar a <strong>{subscriber.name}</strong>? Se eliminará todo su historial.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDeleteConfirm(false)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}
