import { useState } from 'react'
import { Pencil, Trash2, Package, Repeat, Calendar, Printer, X } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { usePlans } from '../hooks/usePlans'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Textarea } from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { PlanCardSkeleton } from '../components/ui/Skeleton'
import PrintOverlay from '../components/PrintOverlay'
import UpgradeModal from '../components/ui/UpgradeModal'
import { useSubscription } from '../hooks/useSubscription'
import { useIsAdmin } from '../hooks/useIsAdmin'

const EMPTY_FORM = { name: '', description: '', price: '', total_uses: '', duration_days: '30', items: [] }

export default function Plans() {
  const { business } = useOutletContext()
  const { plans, loading, createPlan, updatePlan, deletePlan } = usePlans(business?.id)
  const { showToast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [itemInput, setItemInput] = useState('')
  const [error, setError] = useState('')
  const [printOpen, setPrintOpen] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState(null)
  const { canAddPlan, canPrint } = useSubscription(business)
  const isSuperuser = useIsAdmin()
  function openNew() {
    if (!isSuperuser && !canAddPlan(plans.length)) { setUpgradeFeature('plans'); return }
    setEditing(null); setForm(EMPTY_FORM); setItemInput(''); setError(''); setModalOpen(true)
  }

  function openEdit(plan) {
    setEditing(plan)
    setForm({ name: plan.name, description: plan.description ?? '', price: String(plan.price), total_uses: String(plan.total_uses), duration_days: String(plan.duration_days), items: plan.items ?? [] })
    setItemInput(''); setError(''); setModalOpen(true)
  }

  function addItem() {
    const v = itemInput.trim()
    if (!v || form.items.includes(v)) return
    setForm(p => ({ ...p, items: [...p.items, v] }))
    setItemInput('')
  }

  function removeItem(idx) {
    setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault(); setError('')
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price) || 0,
      total_uses: parseInt(form.total_uses) || 1,
      duration_days: parseInt(form.duration_days) || 30,
      items: form.items,
    }
    if (!payload.name) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    const { error: err } = editing ? await updatePlan(editing.id, payload) : await createPlan(payload)
    setSaving(false)
    if (err) { setError('Error al guardar. Intentá de nuevo.'); return }
    setModalOpen(false)
    showToast(editing ? 'Servicio actualizado' : 'Servicio creado')
  }

  if (loading) return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="skeleton h-9 w-24 rounded-full" />
        <div className="skeleton h-8 w-24 rounded-full" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <PlanCardSkeleton key={i} />)}
      </div>
    </div>
  )

  return (
    <div>
      {printOpen && (
        <PrintOverlay plans={plans} business={business} onClose={() => setPrintOpen(false)} />
      )}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-extrabold text-3xl text-stone-900">Servicios</h1>
        <div className="flex gap-2">
          {plans.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => (isSuperuser || canPrint) ? setPrintOpen(true) : setUpgradeFeature('print')}>
              <Printer size={13} className="mr-1.5" /> Imprimir
            </Button>
          )}
          <Button onClick={openNew} size="sm">+ Nuevo servicio</Button>
        </div>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={<Package size={40} className="text-stone-300" />}
          title="No tenés planes aún"
          description="Creá un plan para luego asignarlo a tus clientes"
          action={<Button onClick={openNew}>Crear primer servicio</Button>}
        />
      ) : (
        <div className="space-y-3">
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onEdit={() => openEdit(plan)} onDelete={() => setDeleteConfirm(plan.id)} />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar servicio' : 'Nuevo servicio'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nombre del plan" name="name" value={form.name} onChange={handleChange} placeholder="Ej: Plan mensual 8 clases" required />
          <Textarea label="Descripción (opcional)" name="description" value={form.description} onChange={handleChange} placeholder="Detalle del plan..." />
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">Incluye</label>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: 4 cortes de pelo"
                value={itemInput}
                onChange={e => setItemInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
              />
              <button
                type="button"
                onClick={addItem}
                className="px-3.5 rounded-xl bg-brand-600 text-white text-base font-bold hover:bg-brand-700 transition-colors shrink-0"
              >+</button>
            </div>
            {form.items.length > 0 && (
              <ul className="space-y-1">
                {form.items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between bg-surface-tint rounded-xl px-3 py-1.5 text-sm text-stone-700">
                    <span>{item}</span>
                    <button type="button" onClick={() => removeItem(i)} className="text-stone-400 hover:text-red-500 transition-colors ml-2">
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Precio ($)" name="price" type="number" min="0" value={form.price} onChange={handleChange} placeholder="0" />
            <Input label="Usos" name="total_uses" type="number" min="1" value={form.total_uses} onChange={handleChange} placeholder="8" />
            <Input label="Días" name="duration_days" type="number" min="1" value={form.duration_days} onChange={handleChange} placeholder="30" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-2.5">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">{editing ? 'Guardar cambios' : 'Crear plan'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar plan">
        <p className="text-sm text-stone-600 mb-4">¿Seguro que querés eliminar este plan?</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={async () => { await deletePlan(deleteConfirm); setDeleteConfirm(null); showToast('Servicio eliminado') }} className="flex-1">Eliminar</Button>
        </div>
      </Modal>

      <UpgradeModal
        open={!!upgradeFeature}
        onClose={() => setUpgradeFeature(null)}
        feature={upgradeFeature}
      />
    </div>
  )
}

function PlanCard({ plan, onEdit, onDelete }) {
  return (
    <div className="bg-surface rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-stretch">
        {/* Left: info */}
        <div className="flex-1 px-5 py-4">
          <p className="font-bold text-stone-900 text-base leading-tight">{plan.name}</p>
          {plan.description && (
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">{plan.description}</p>
          )}
          {plan.items?.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {plan.items.map((item, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-stone-500">
                  <span className="w-1 h-1 rounded-full bg-brand-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 bg-brand-100 rounded-full px-3 py-1">
              <Repeat size={11} /> {plan.total_uses} usos
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-surface-tint rounded-full px-3 py-1">
              <Calendar size={11} /> {plan.duration_days} días
            </span>
          </div>
        </div>

        {/* Right: price + actions */}
        <div className="flex flex-col items-center justify-between bg-brand-50 px-5 py-4 min-w-[100px]">
          <div className="text-center">
            <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-widest mb-0.5">Precio</p>
            <p className="font-extrabold text-3xl text-brand-700 leading-tight">
              ${Number(plan.price).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-brand-100 text-brand-400 hover:text-brand-600 transition-colors"
              title="Editar"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
