import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { format, addMonths } from 'date-fns'
import {
  Shield, Search, Star, X, ChevronDown, Copy, Check,
  Trash2, Pencil, Users,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useIsAdmin } from '../hooks/useIsAdmin'
import { useToast } from '../context/ToastContext'
import Button from '../components/ui/Button'
import DatePicker from '../components/ui/DatePicker'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'

// ─── helpers ────────────────────────────────────────────────────────────────

function TierBadge({ tier, isPromo }) {
  if (isPromo) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
        <Star size={10} />
        Pro promo
      </span>
    )
  }
  const styles = {
    free:    'bg-stone-100 text-stone-500',
    starter: 'bg-brand-50 text-brand-700',
    pro:     'bg-violet-50 text-violet-700',
  }
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[tier] ?? styles.free}`}>
      {tier ?? 'free'}
    </span>
  )
}

function CopyChip({ label, value }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  function handleCopy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-stone-600 bg-stone-50 hover:bg-stone-100 rounded-xl px-2.5 py-1.5 transition-colors"
    >
      {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} className="text-stone-400" />}
      <span className="truncate max-w-[180px]">{label ?? value}</span>
    </button>
  )
}

// ─── Edit modal ─────────────────────────────────────────────────────────────

function EditModal({ biz, open, onClose, onSaved }) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    business_name: '',
    nombre: '',
    apellido: '',
    telefono: '',
  })

  useEffect(() => {
    if (open && biz) {
      setForm({
        business_name: biz.name ?? '',
        nombre:        biz.owner_nombre ?? '',
        apellido:      biz.owner_apellido ?? '',
        telefono:      biz.owner_phone ?? '',
      })
    }
  }, [open, biz])

  async function handleSave() {
    setLoading(true)
    const { error } = await supabase.rpc('admin_update_user', {
      p_user_id:       biz.user_id,
      p_nombre:        form.nombre,
      p_apellido:      form.apellido,
      p_telefono:      form.telefono,
      p_business_name: form.business_name,
    })
    setLoading(false)
    if (error) {
      showToast('No se pudo guardar', 'error')
    } else {
      showToast('Cambios guardados', 'success')
      onSaved({ ...biz, name: form.business_name, owner_nombre: form.nombre, owner_apellido: form.apellido, owner_phone: form.telefono })
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar usuario">
      <div className="space-y-4">
        <Input
          label="Nombre del negocio"
          value={form.business_name}
          onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          />
          <Input
            label="Apellido"
            value={form.apellido}
            onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
          />
        </div>
        <Input
          label="Teléfono del dueño"
          value={form.telefono}
          onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
        />
        <Button className="w-full" loading={loading} onClick={handleSave}>
          Guardar cambios
        </Button>
      </div>
    </Modal>
  )
}

// ─── Delete modal ────────────────────────────────────────────────────────────

function DeleteModal({ biz, open, onClose, onDeleted }) {
  const { showToast } = useToast()
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (!open) setConfirm('') }, [open])

  const nameMatch = confirm.trim().toLowerCase() === biz?.name?.toLowerCase()

  async function handleDelete() {
    if (!nameMatch) return
    setLoading(true)
    const { error } = await supabase.rpc('admin_delete_user', { p_user_id: biz.user_id })
    setLoading(false)
    if (error) {
      showToast('No se pudo eliminar el usuario', 'error')
    } else {
      showToast(`${biz.name} eliminado`, 'success')
      onDeleted(biz.id)
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Eliminar usuario">
      <div className="space-y-4">
        <div className="bg-red-50 rounded-2xl px-4 py-3 text-sm text-red-700">
          Esta acción es <strong>irreversible</strong>. Se borran el negocio, suscriptores, pagos, turnos y el acceso a la cuenta.
        </div>
        <p className="text-sm text-stone-600">
          Escribí <span className="font-semibold text-stone-900">{biz?.name}</span> para confirmar:
        </p>
        <Input
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder={biz?.name}
        />
        <Button
          className="w-full"
          loading={loading}
          onClick={handleDelete}
          disabled={!nameMatch}
        >
          Eliminar definitivamente
        </Button>
      </div>
    </Modal>
  )
}

// ─── Promo panel (grant / revoke) ────────────────────────────────────────────

function PromoPanel({ biz, onGranted, onRevoked }) {
  const { showToast } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const defaultExpiry = format(addMonths(new Date(), 6), 'yyyy-MM-dd')
  const [expiryDate, setExpiryDate] = useState(defaultExpiry)

  async function handleGrant() {
    setLoading(true)
    const { error } = await supabase
      .from('businesses')
      .update({
        tier: 'pro',
        subscription_ends_at: new Date(expiryDate + 'T23:59:59').toISOString(),
        is_promo: true,
      })
      .eq('id', biz.id)
    setLoading(false)
    if (error) {
      showToast('No se pudo otorgar acceso', 'error')
    } else {
      showToast(`Acceso pro promo otorgado a ${biz.name}`, 'success')
      setExpanded(false)
      onGranted(biz.id, expiryDate)
    }
  }

  async function handleRevoke() {
    setLoading(true)
    const { error } = await supabase
      .from('businesses')
      .update({ tier: 'free', subscription_ends_at: null, is_promo: false })
      .eq('id', biz.id)
    setLoading(false)
    if (error) {
      showToast('No se pudo revocar acceso', 'error')
    } else {
      showToast(`Acceso pro revocado para ${biz.name}`, 'success')
      onRevoked(biz.id)
    }
  }

  if (biz.is_promo) {
    return (
      <button
        onClick={handleRevoke}
        disabled={loading}
        className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
      >
        Revocar promo
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(o => !o)}
        className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
      >
        <Star size={11} />
        Dar pro promo
        <ChevronDown size={11} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="space-y-2 pt-1">
          <DatePicker label="Vence el" value={expiryDate} onChange={setExpiryDate} />
          <Button size="sm" className="w-full" loading={loading} onClick={handleGrant}>
            Confirmar
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Business card ────────────────────────────────────────────────────────────

const STATUS_DOT = {
  active:         'bg-green-400',
  expiring_soon:  'bg-amber-400',
  expired:        'bg-red-400',
  no_uses:        'bg-red-400',
}

function BizCard({ biz, onUpdate, onDeleted }) {
  const [expanded, setExpanded] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [subs, setSubs] = useState(null)
  const [subsLoading, setSubsLoading] = useState(false)

  const ownerName = [biz.owner_nombre, biz.owner_apellido].filter(Boolean).join(' ') || '—'

  useEffect(() => {
    if (!expanded || subs !== null) return
    setSubsLoading(true)
    supabase.rpc('admin_get_subscribers', { p_business_id: biz.id })
      .then(({ data }) => { setSubs(data ?? []); setSubsLoading(false) })
  }, [expanded, biz.id, subs])

  function handleGranted(id, expiryDate) {
    onUpdate(id, { tier: 'pro', is_promo: true, subscription_ends_at: new Date(expiryDate + 'T23:59:59').toISOString() })
  }
  function handleRevoked(id) {
    onUpdate(id, { tier: 'free', is_promo: false, subscription_ends_at: null })
  }

  return (
    <>
      <div className="bg-surface rounded-2xl shadow-card overflow-hidden">
        {/* Header — siempre visible */}
        <button
          className="w-full text-left p-4"
          onClick={() => setExpanded(o => !o)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-stone-800 truncate">{biz.name}</p>
                <TierBadge tier={biz.tier} isPromo={biz.is_promo} />
              </div>
              <p className="text-xs text-stone-400 mt-0.5 truncate">{ownerName}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 text-xs text-stone-400">
                <Users size={11} />
                {biz.subscriber_count ?? 0}
              </span>
              <ChevronDown
                size={14}
                className={`text-stone-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
        </button>

        {/* Detalle expandido */}
        {expanded && (
          <div className="border-t border-stone-100 px-4 pb-4 pt-3 space-y-4">
            {/* Contacto */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Contacto</p>
              <div className="flex flex-wrap gap-1.5">
                <CopyChip value={biz.email} label={biz.email} />
                {biz.owner_phone && (
                  <CopyChip value={biz.owner_phone} label={`📞 ${biz.owner_phone}`} />
                )}
                {biz.business_phone && biz.business_phone !== biz.owner_phone && (
                  <CopyChip value={biz.business_phone} label={`🏪 ${biz.business_phone}`} />
                )}
              </div>
            </div>

            {/* Redes */}
            {(biz.instagram || biz.facebook || biz.tiktok) && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Redes</p>
                <div className="flex flex-wrap gap-1.5">
                  {biz.instagram && <CopyChip value={biz.instagram} label={`IG: ${biz.instagram}`} />}
                  {biz.facebook  && <CopyChip value={biz.facebook}  label={`FB: ${biz.facebook}`} />}
                  {biz.tiktok    && <CopyChip value={biz.tiktok}    label={`TT: ${biz.tiktok}`} />}
                </div>
              </div>
            )}

            {/* Info extra */}
            <div className="flex gap-4 text-xs text-stone-400">
              {biz.category && <span>Rubro: <span className="text-stone-600">{biz.category}</span></span>}
              {biz.created_at && (
                <span>Alta: <span className="text-stone-600">{format(new Date(biz.created_at), 'dd/MM/yyyy')}</span></span>
              )}
            </div>

            {/* Suscriptores */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
                Suscriptores ({biz.subscriber_count ?? 0})
              </p>
              {subsLoading ? (
                <div className="space-y-1.5">
                  {[1, 2].map(i => (
                    <div key={i} className="h-7 bg-stone-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : subs && subs.length > 0 ? (
                <div className="space-y-1">
                  {subs.map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-xl hover:bg-stone-50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[s.status] ?? 'bg-stone-300'}`} />
                        <span className="text-sm text-stone-700 truncate">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-xs text-stone-400">
                        {s.plan_name && (
                          <span className="bg-stone-100 px-1.5 py-0.5 rounded-lg truncate max-w-[90px]">{s.plan_name}</span>
                        )}
                        {s.end_date && (
                          <span>{format(new Date(s.end_date + 'T00:00:00'), 'dd/MM')}</span>
                        )}
                        {s.uses_remaining != null && s.uses_remaining >= 0 && (
                          <span>{s.uses_remaining} usos</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : subs && subs.length === 0 ? (
                <p className="text-xs text-stone-400">Sin suscriptores</p>
              ) : null}
            </div>

            {/* Promo */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Acceso Pro</p>
              {biz.is_promo && biz.subscription_ends_at && (
                <p className="text-xs text-amber-600">
                  Promo activa hasta {format(new Date(biz.subscription_ends_at), 'dd/MM/yyyy')}
                </p>
              )}
              <PromoPanel biz={biz} onGranted={handleGranted} onRevoked={handleRevoked} />
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-1 border-t border-stone-100">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-xl px-3 py-2 transition-colors"
              >
                <Pencil size={12} />
                Editar
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl px-3 py-2 transition-colors"
              >
                <Trash2 size={12} />
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      <EditModal
        biz={biz}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={updated => onUpdate(biz.id, updated)}
      />
      <DeleteModal
        biz={biz}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={onDeleted}
      />
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Admin() {
  const isSuperuser = useIsAdmin()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isSuperuser) return
    async function fetchAll() {
      setLoading(true)
      const { data } = await supabase.rpc('admin_list_businesses')
      setBusinesses(data ?? [])
      setLoading(false)
    }
    fetchAll()
  }, [isSuperuser])

  if (isSuperuser === null) return (
    <div className="flex justify-center py-16">
      <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (isSuperuser === false) return <Navigate to="/dashboard" replace />

  const filtered = businesses.filter(b => {
    const q = search.toLowerCase()
    return (
      b.name?.toLowerCase().includes(q) ||
      b.email?.toLowerCase().includes(q) ||
      b.owner_nombre?.toLowerCase().includes(q) ||
      b.owner_apellido?.toLowerCase().includes(q)
    )
  })

  const promoCount = businesses.filter(b => b.is_promo).length
  const totalSubs = businesses.reduce((acc, b) => acc + Number(b.subscriber_count ?? 0), 0)

  function handleUpdate(id, patch) {
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
  }
  function handleDeleted(id) {
    setBusinesses(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center">
          <Shield size={18} className="text-brand-600" />
        </div>
        <div>
          <h1 className="font-bold text-stone-800 text-lg leading-tight">Panel admin</h1>
          <p className="text-xs text-stone-400">
            {businesses.length} negocio{businesses.length !== 1 ? 's' : ''} · {totalSubs} suscriptores · {promoCount} promo
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o dueño..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 bg-surface rounded-2xl text-sm border border-stone-200 focus:outline-none focus:border-brand-400 transition-colors"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-2xl shadow-card p-4 animate-pulse">
              <div className="h-4 bg-stone-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-stone-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-stone-400 text-sm py-8">
          {search ? 'Sin resultados' : 'No hay negocios registrados'}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map(biz => (
            <BizCard
              key={biz.id}
              biz={biz}
              onUpdate={handleUpdate}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
