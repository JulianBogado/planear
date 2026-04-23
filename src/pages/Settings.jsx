import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Pencil, Check, Camera, Globe, Music2, Phone, MapPin, ChevronRight, CalendarDays, Copy, CheckCheck, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOutletContext } from 'react-router-dom'
import { useTheme, THEMES, PALETTE_META } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { CATEGORIES, TEMPLATES } from '../constants/templates'
import { TIER_INFO } from '../constants/tiers'
import { usePlans } from '../hooks/usePlans'
import { useSubscription } from '../hooks/useSubscription'
import { useIsAdmin } from '../hooks/useIsAdmin'
import { useAvailability } from '../hooks/useAvailability'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Input, { Select } from '../components/ui/Input'
import Modal from '../components/ui/Modal'


export default function Settings() {
  const { user, signOut } = useAuth()
  const { business, updateBusiness } = useOutletContext()
  const { theme, setTheme, syncFromBusiness } = useTheme()
  const { showToast } = useToast()
  const { loadTemplates, wipeAndReload } = usePlans(business?.id)

  const isSuperuser = useIsAdmin()
  const { canReserve, isExpired } = useSubscription(business)
  const { availability, saveAvailability, ensureSlug } = useAvailability(business)
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#agenda-seccion') {
      const el = document.getElementById('agenda-seccion')
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [location.hash])

  const DAYS_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const SLOT_OPTIONS = [20, 40, 60, 120, 240]
  const CAPACITY_OPTIONS = [1, 2, 3, 5, 10]
  const DEFAULT_BLOCK = { block_name: '', days_of_week: [1, 2, 3, 4, 5], start_time: '09:00', end_time: '18:00', slot_duration: 60, slot_capacity: 1, simple_shift: false }

  const [agendaEnabled, setAgendaEnabled] = useState(true)

  const [agendaBlocks, setAgendaBlocks] = useState([{ ...DEFAULT_BLOCK }])
  const [agendaAdvance, setAgendaAdvance] = useState(7)
  const [savingAgenda, setSavingAgenda] = useState(false)
  const [slug, setSlug] = useState(null)
  const [copied, setCopied] = useState(false)

  const [demoCategory, setDemoCategory] = useState(null)
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [tiktok, setTiktok] = useState('')

  const [saving, setSaving] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [error, setError] = useState('')

  // Conteos de datos (para validar downgrade)
  const [subscriberCount, setSubscriberCount] = useState(null)
  const [planCount, setPlanCount] = useState(null)

  // Gestión de suscripción
  const [confirmDowngradeOpen, setConfirmDowngradeOpen] = useState(false)
  const [downgradeTo, setDowngradeTo] = useState(null)
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(false)

  // Eliminar cuenta
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deleteAccountStartedAt, setDeleteAccountStartedAt] = useState(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteSent, setDeleteSent] = useState(false)
  const [deleteSending, setDeleteSending] = useState(false)

  // Flujo cambio de rubro
  const [pendingCategory, setPendingCategory] = useState(null)
  const [confirmRubroOpen, setConfirmRubroOpen] = useState(false)
  const [templateModal, setTemplateModal] = useState(false)
  const [wiping, setWiping] = useState(false)

  useEffect(() => {
    if (business) {
      setName(business.name ?? '')
      setCategory(business.category ?? '')
      setPhone(business.phone ?? '')
      setAddress(business.address ?? '')
      setInstagram(business.instagram ?? '')
      setFacebook(business.facebook ?? '')
      setTiktok(business.tiktok ?? '')
      setSlug(business.slug ?? null)
      setAgendaEnabled(business.agenda_enabled !== false)

      syncFromBusiness(business)
    }
  }, [business])

  useEffect(() => {
    if (availability?.length) {
      setAgendaBlocks(availability.map(b => ({
        block_name: b.block_name ?? '',
        days_of_week: b.days_of_week ?? [1, 2, 3, 4, 5],
        start_time: b.start_time?.slice(0, 5) ?? '09:00',
        end_time: b.end_time?.slice(0, 5) ?? '18:00',
        slot_duration: b.slot_duration ?? 60,
        slot_capacity: b.slot_capacity ?? 1,
      })))
      setAgendaAdvance(availability[0].advance_days ?? 7)
    }
  }, [availability])

  useEffect(() => {
    if (!business?.id) return
    supabase
      .from('subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .then(({ count }) => setSubscriberCount(count ?? 0))
    supabase
      .from('plans')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .then(({ count }) => setPlanCount(count ?? 0))
  }, [business?.id])

  function openDowngrade(targetTier) {
    setDowngradeTo(targetTier)
    setConfirmDowngradeOpen(true)
  }

  async function handleConfirmDowngrade(force = false) {
    setSubscriptionActionLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const action = downgradeTo === 'starter' ? 'to_starter' : 'to_free'

    const { data, error: fnError } = await supabase.functions.invoke('cancel-subscription', {
      body: { action, force },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    setSubscriptionActionLoading(false)

    if (fnError) {
      showToast('Ocurrió un error. Intentá de nuevo.', 'error')
      return
    }

    if (data?.error === 'over_limit' && !force) {
      return
    }

    setConfirmDowngradeOpen(false)

    if (action === 'to_free') {
      showToast('Suscripción cancelada')
      window.location.reload()
    } else {
      const url = data?.init_point
      if (
        !url?.startsWith('https://www.mercadopago.com.ar/') &&
        !url?.startsWith('https://sandbox.mercadopago.com.ar/')
      ) {
        showToast('Error: URL de pago inválida.', 'error')
        return
      }
      window.location.href = url
    }
  }

  async function handleDeleteAccountRequest(e) {
    e.preventDefault()
    setDeleteSending(true)
    const autoMessage =
      `Solicito la eliminación de mi cuenta.\n\nEmail: ${user?.email}\nNegocio: ${business?.name ?? '—'}\nPlan: ${business?.tier ?? 'free'}` +
      (deleteReason ? `\n\nMotivo: ${deleteReason}` : '')

    const { error: fnError } = await supabase.functions.invoke('contact-form', {
      body: {
        name: business?.name ?? user?.email ?? 'Usuario',
        email: user?.email,
        message: autoMessage,
        website: '',
        form_started_at: deleteAccountStartedAt,
      },
    })
    setDeleteSending(false)
    if (fnError) { showToast('No se pudo enviar. Intentá de nuevo.', 'error'); return }
    setDeleteSent(true)
  }

  async function handleSaveBusiness(e) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre no puede estar vacío.'); return }
    // Si cambió el rubro, abrir confirmación en vez de guardar directo
    if (category !== (business?.category ?? '') && category !== '') {
      setPendingCategory(category)
      setConfirmRubroOpen(true)
      return
    }
    setError(''); setSaving(true)
    const { error: err } = await updateBusiness(business.id, { name: name.trim(), category })
    setSaving(false)
    if (err) { setError('Error al guardar.'); return }
    setEditingName(false)
    showToast('Cambios guardados')
  }

  async function handleConfirmRubro() {
    setConfirmRubroOpen(false)
    setWiping(true)
    // Guardar nombre y rubro, limpiar suscriptores y planes
    await updateBusiness(business.id, { name: name.trim(), category: pendingCategory })
    await wipeAndReload(pendingCategory)
    setWiping(false)
    setEditingName(false)
    showToast('Rubro actualizado')
    // Preguntar si cargar plantillas del nuevo rubro
    const hasTemplates = (TEMPLATES[pendingCategory] ?? []).length > 0
    if (hasTemplates) setTemplateModal(true)
  }

  async function handleLoadNewTemplates() {
    setTemplateModal(false)
    setLoadingTemplates(true)
    await loadTemplates(pendingCategory)
    setLoadingTemplates(false)
    const cat = CATEGORIES.find(c => c.value === pendingCategory)
    showToast(`Plantillas de ${cat?.label ?? pendingCategory} cargadas`)
    setPendingCategory(null)
  }

  async function handleToggleAgenda() {
    const next = !agendaEnabled
    setAgendaEnabled(next)
    await updateBusiness(business.id, { agenda_enabled: next })
    showToast(next ? 'Reservas online activadas' : 'Reservas online desactivadas')
  }


  async function handleSaveAgenda(e) {
    e.preventDefault()
    setSavingAgenda(true)
    let currentSlug = slug
    if (!currentSlug) {
      currentSlug = await ensureSlug()
      setSlug(currentSlug)
    }
    await saveAvailability(agendaBlocks.map(b => ({ ...b, advance_days: agendaAdvance })))
    setSavingAgenda(false)
    showToast('Configuración de agenda guardada')
  }

  function handleCopySlug() {
    const url = `${window.location.origin}/reservar/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveContact(e) {
    e.preventDefault(); setSavingContact(true)
    await updateBusiness(business.id, {
      phone: phone.trim() || null, address: address.trim() || null,
      instagram: instagram.trim() || null, facebook: facebook.trim() || null, tiktok: tiktok.trim() || null,
    })
    setSavingContact(false)
    showToast('Datos guardados')
  }

  async function handleThemeChange(newTheme) {
    await setTheme(newTheme, business?.id)
  }

  async function handleLoadTemplates() {
    if (!demoCategory) return
    setLoadingTemplates(true)
    await loadTemplates(demoCategory)
    await updateBusiness(business.id, { category: demoCategory })
    setLoadingTemplates(false)
    const cat = CATEGORIES.find(c => c.value === demoCategory)
    showToast(`Plantillas de ${cat?.label ?? demoCategory} cargadas`)
    setDemoCategory(null)
  }

  const filledInput = 'w-full bg-surface-tint border-0 border-b-2 border-stone-200 focus:border-brand-600 rounded-t-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-0 transition-colors placeholder:text-stone-400'

  return (
    <div className="space-y-5">
      <h1 className="font-extrabold text-3xl text-stone-900">Configuración</h1>

      {/* Business name & category */}
      <div className="bg-surface rounded-3xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-800">Negocio</h2>
          {!editingName && (
            <button onClick={() => setEditingName(true)} className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700">
              <Pencil size={12} /> Editar
            </button>
          )}
        </div>

        {!editingName ? (
          <div className="space-y-2">
            <div className="bg-surface-tint rounded-2xl px-4 py-3">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Nombre</p>
              <p className="font-bold text-stone-900">{business?.name ?? '—'}</p>
            </div>
            <div className="bg-surface-tint rounded-2xl px-4 py-3">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Rubro</p>
              <div className="flex items-center gap-2">
                {(() => {
                  const cat = CATEGORIES.find(c => c.value === business?.category)
                  if (!cat) return <p className="font-medium text-stone-700">{business?.category ?? '—'}</p>
                  const { Icon, label } = cat
                  return <p className="font-medium text-stone-700 flex items-center gap-2"><Icon size={15} />{label}</p>
                })()}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveBusiness} className="space-y-4">
            <Input label="Nombre del negocio" value={name} onChange={e => setName(e.target.value)} required />
            <Select label="Rubro" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Seleccioná un rubro</option>
              {CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            {category !== (business?.category ?? '') && category !== '' && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5">
                ⚠️ Cambiar el rubro borrará todos tus clientes y planes actuales. Esta acción no se puede deshacer.
              </p>
            )}
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-2.5">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setEditingName(false); setName(business?.name ?? ''); setCategory(business?.category ?? '') }} className="flex-1">Cancelar</Button>
              <Button type="submit" loading={saving || wiping} className="flex-1">Guardar</Button>
            </div>
          </form>
        )}
      </div>

      {/* Color palette selector */}
      <div className="bg-surface rounded-3xl shadow-card p-5">
        <h2 className="font-semibold text-stone-800 mb-1">Apariencia</h2>
        <p className="text-xs text-stone-400 mb-5">Elegí la paleta de colores de tu panel</p>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(t => {
            const meta = PALETTE_META[t]
            const isActive = theme === t
            return (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`relative flex flex-col gap-3 p-3 rounded-2xl border-2 transition-all ${
                  isActive ? 'border-brand-500 shadow-card' : 'border-transparent shadow-card hover:border-stone-200'
                }`}
                style={{ backgroundColor: meta.bg }}
              >
                {/* Mini app preview */}
                <div className="w-full rounded-xl overflow-hidden" style={{ backgroundColor: meta.bg }}>
                  {/* Header bar */}
                  <div className="h-3 rounded-t-xl" style={{ backgroundColor: meta.brand600 }} />
                  {/* Content */}
                  <div className="p-2 space-y-1.5">
                    <div className="h-2 rounded-full w-4/5" style={{ backgroundColor: meta.brand200 }} />
                    <div className="h-1.5 rounded-full w-3/5 bg-stone-200" />
                    <div className="h-4 rounded-full w-2/3 mt-1" style={{ backgroundColor: meta.brand600 + 'cc' }} />
                  </div>
                </div>

                {/* Label */}
                <div className="text-center">
                  <p className={`text-xs font-bold ${isActive ? 'text-stone-900' : 'text-stone-700'}`}>{meta.label}</p>
                  <p className="text-[10px] text-stone-400 leading-tight">{meta.description}</p>
                </div>

                {isActive && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                    <Check size={9} className="text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contact & social */}
      <div className="bg-surface rounded-3xl shadow-card p-5">
        <h2 className="font-semibold text-stone-800 mb-5">Contacto y redes</h2>
        <form onSubmit={handleSaveContact} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Teléfono"
                className={`${filledInput} pl-8`} />
            </div>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección"
                className={`${filledInput} pl-8`} />
            </div>
          </div>

          {[
            { icon: Camera, value: instagram, setter: setInstagram, placeholder: 'Instagram' },
            { icon: Globe,  value: facebook,  setter: setFacebook,  placeholder: 'Facebook' },
            { icon: Music2, value: tiktok,    setter: setTiktok,    placeholder: 'TikTok' },
          ].map(({ icon: Icon, value, setter, placeholder }) => (
            <div key={placeholder} className="relative">
              <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-stone-300 text-sm pointer-events-none">@</span>
              <input type="text" value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                className={`${filledInput} pl-12`} />
            </div>
          ))}

          <Button type="submit" loading={savingContact}>Guardar datos de contacto</Button>
        </form>
      </div>

      {/* Demo mode — superuser only */}
      {isSuperuser && (
        <div className="bg-surface rounded-3xl shadow-card p-5">
          <h2 className="font-semibold text-stone-800 mb-1">Modo demo</h2>
          <p className="text-xs text-stone-400 mb-5">Cargá las plantillas de cualquier rubro para probar la app</p>
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {CATEGORIES.filter(c => c.value !== 'otro').map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setDemoCategory(v => v === value ? null : value)}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-2xl border-2 text-sm font-semibold transition-all text-left ${
                  demoCategory === value
                    ? 'bg-brand-50 border-brand-400 text-brand-800'
                    : 'border-transparent bg-surface-tint text-stone-700 hover:border-stone-200'
                }`}
              >
                <Icon size={16} className={demoCategory === value ? 'text-brand-600' : 'text-stone-400'} />
                {label}
              </button>
            ))}
          </div>

          {demoCategory && (
            <div className="mb-4 bg-stone-50 rounded-2xl p-3 space-y-1.5">
              {(TEMPLATES[demoCategory] ?? []).map((t, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-stone-700 font-medium truncate">{t.name}</span>
                  <span className="text-brand-700 font-bold shrink-0">${t.price.toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleLoadTemplates}
            loading={loadingTemplates}
            disabled={!demoCategory}
            className="w-full"
          >
            Cargar plantillas{demoCategory ? ` de ${CATEGORIES.find(c => c.value === demoCategory)?.label}` : ''}
          </Button>
        </div>
      )}

      {/* Mi suscripción — superuser: selector directo de tier */}
      {isSuperuser && business && (
        <div className="bg-surface rounded-3xl shadow-card p-5">
          <h2 className="font-semibold text-stone-800 mb-3">Mi suscripción <span className="text-xs text-stone-400">(admin)</span></h2>
          <div className="grid grid-cols-3 gap-2">
            {['free', 'starter', 'pro'].map(t => (
              <button
                key={t}
                onClick={async () => {
                  const { error } = await updateBusiness(business.id, { tier: t })
                  if (error) showToast('No se pudo actualizar el tier', 'error')
                }}
                className={`py-2.5 rounded-2xl text-sm font-semibold transition-all border-2 ${
                  business.tier === t
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-transparent bg-surface-tint text-stone-600 hover:border-stone-200'
                }`}
              >
                {TIER_INFO[t].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mi suscripción */}
      {business && (() => {
        const tier = business.tier ?? 'free'
        const info = TIER_INFO[tier]
        return (
          <div className="bg-surface rounded-3xl shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-800">Mi suscripción</h2>
              {business.is_promo ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                  Pro (promo)
                </span>
              ) : (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isExpired ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700'}`}>
                  {isExpired ? `${info.label} (vencido)` : info.label}
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500 mb-4">
              {tier === 'free'
                ? 'Hasta 5 clientes · 2 planes · Sin cartelería ni estadísticas'
                : tier === 'starter'
                ? 'Hasta 50 clientes · Hasta 3 planes · Cartelería incluida'
                : 'Clientes ilimitados · Todo incluido'}
            </p>
            {business.is_promo ? (
              <div className="space-y-2">
                {business.subscription_ends_at && (
                  <p className="text-xs text-stone-400">
                    Acceso promocional hasta: {new Date(business.subscription_ends_at).toLocaleDateString('es-AR')}
                  </p>
                )}
              </div>
            ) : tier === 'free' ? (
              <Link to="/precios">
                <Button size="sm" className="w-full">Mejorar plan</Button>
              </Link>
            ) : isExpired ? (
              <div className="space-y-2">
                <div className="bg-red-50 rounded-2xl px-4 py-2.5 text-sm text-red-700 font-medium">
                  Tu suscripción venció. Perdiste acceso a las funciones pagas.
                </div>
                <Link to="/precios">
                  <Button size="sm" className="w-full">Renovar suscripción</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {business.subscription_ends_at && (
                  <p className="text-xs text-stone-400">
                    Próximo cobro: {new Date(business.subscription_ends_at).toLocaleDateString('es-AR')}
                  </p>
                )}
                <Link to="/precios" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                  Ver todos los planes →
                </Link>
                {tier === 'pro' && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => openDowngrade('starter')}>
                    Bajar al plan Starter
                  </Button>
                )}
                <button
                  onClick={() => openDowngrade('free')}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors block"
                >
                  Darse de baja (pasar a Free)
                </button>
              </div>
            )}
          </div>
        )
      })()}

      {/* Agenda — Pro only */}
      {(canReserve || isSuperuser) && (
        <div id="agenda-seccion" className="scroll-mt-20 bg-surface rounded-3xl shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={16} className="text-brand-600" />
            <h2 className="font-semibold text-stone-800">Agenda y reservas</h2>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-semibold text-stone-700">Reservas online</p>
              <p className="text-xs text-stone-400">Permitir que tus clientes reserven por la URL pública</p>
            </div>
            <button
              onClick={handleToggleAgenda}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${agendaEnabled ? 'bg-brand-600' : 'bg-stone-200'}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${agendaEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {agendaEnabled && <>
          <p className="text-xs text-stone-400 mb-4">Configurá tu disponibilidad para que tus clientes puedan reservar online</p>

          {/* URL pública */}
          <div className="bg-surface-tint rounded-2xl px-4 py-3 mb-4">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-1">Tu URL pública</p>
            {slug ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-stone-700 font-medium truncate flex-1">
                  {window.location.origin}/reservar/{slug}
                </p>
                <button
                  onClick={handleCopySlug}
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-brand-100 text-brand-400 hover:text-brand-600 transition-colors"
                >
                  {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ) : (
              <p className="text-sm text-stone-400 italic">Se genera al guardar la configuración</p>
            )}
          </div>

          <form onSubmit={handleSaveAgenda} className="space-y-4">
            {/* Franjas horarias */}
            {agendaBlocks.map((block, idx) => (
              <div key={idx} className="bg-surface-tint rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                    Franja {agendaBlocks.length > 1 ? idx + 1 : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAgendaBlocks(prev => prev.filter((_, i) => i !== idx))}
                    disabled={agendaBlocks.length === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Nombre opcional */}
                <div>
                  <p className="text-xs font-semibold text-stone-500 mb-1.5">Nombre (opcional)</p>
                  <input
                    type="text"
                    value={block.block_name}
                    onChange={e => setAgendaBlocks(prev => prev.map((b, i) => i === idx ? { ...b, block_name: e.target.value } : b))}
                    placeholder="Ej: Mañana, Tarde…"
                    className="w-full bg-surface rounded-xl px-3 py-2 text-sm text-stone-800 border-0 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <label className="flex items-center gap-2 cursor-pointer mt-2.5">
                    <input
                      type="checkbox"
                      checked={block.simple_shift ?? false}
                      onChange={e => setAgendaBlocks(prev => prev.map((b, i) => i === idx ? { ...b, simple_shift: e.target.checked } : b))}
                      className="accent-brand-600 w-4 h-4 rounded"
                    />
                    <span className="text-xs text-stone-500 font-medium">
                      Turno simple — el cliente elige el bloque completo, no un horario exacto
                    </span>
                  </label>
                </div>

                {/* Días disponibles */}
                <div>
                  <p className="text-xs font-semibold text-stone-500 mb-2">Días disponibles</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS_LABELS.map((label, dayIdx) => (
                      <button
                        key={dayIdx}
                        type="button"
                        onClick={() => setAgendaBlocks(prev => prev.map((b, i) => i === idx ? {
                          ...b,
                          days_of_week: b.days_of_week.includes(dayIdx)
                            ? b.days_of_week.filter(d => d !== dayIdx)
                            : [...b.days_of_week, dayIdx].sort()
                        } : b))}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border-2 ${
                          block.days_of_week.includes(dayIdx)
                            ? 'bg-brand-50 border-brand-400 text-brand-700'
                            : 'border-transparent bg-surface text-stone-500 hover:border-stone-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horario */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-stone-500 mb-1.5">Desde</p>
                    <input
                      type="time"
                      value={block.start_time}
                      onChange={e => setAgendaBlocks(prev => prev.map((b, i) => i === idx ? { ...b, start_time: e.target.value } : b))}
                      className="w-full bg-surface rounded-xl px-3 py-2.5 text-sm text-stone-800 border-0 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-500 mb-1.5">Hasta</p>
                    <input
                      type="time"
                      value={block.end_time}
                      onChange={e => setAgendaBlocks(prev => prev.map((b, i) => i === idx ? { ...b, end_time: e.target.value } : b))}
                      className="w-full bg-surface rounded-xl px-3 py-2.5 text-sm text-stone-800 border-0 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>
                </div>

                {/* Duración del turno — oculto en turno simple */}
                {!block.simple_shift && (
                  <div>
                    <p className="text-xs font-semibold text-stone-500 mb-2">Duración del turno</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {SLOT_OPTIONS.map(min => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => setAgendaBlocks(prev => prev.map((b, i) => i === idx ? { ...b, slot_duration: min } : b))}
                          className={`flex-1 min-w-0 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${
                            block.slot_duration === min
                              ? 'bg-brand-50 border-brand-400 text-brand-700'
                              : 'border-transparent bg-surface text-stone-500 hover:border-stone-200'
                          }`}
                        >
                          {min >= 60 ? `${min / 60}h` : `${min}m`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Capacidad por turno */}
                <div>
                  <p className="text-xs font-semibold text-stone-500 mb-2">Capacidad por turno</p>
                  <div className="flex gap-1.5">
                    {CAPACITY_OPTIONS.map(cap => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setAgendaBlocks(prev => prev.map((b, i) => i === idx ? { ...b, slot_capacity: cap } : b))}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${
                          block.slot_capacity === cap
                            ? 'bg-brand-50 border-brand-400 text-brand-700'
                            : 'border-transparent bg-surface text-stone-500 hover:border-stone-200'
                        }`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Agregar franja */}
            <button
              type="button"
              onClick={() => setAgendaBlocks(prev => [...prev, { ...DEFAULT_BLOCK }])}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-stone-200 text-sm font-semibold text-stone-400 hover:border-brand-300 hover:text-brand-600 transition-colors"
            >
              <Plus size={14} /> Agregar franja horaria
            </button>

            {/* Anticipación */}
            <div>
              <p className="text-xs font-semibold text-stone-500 mb-1.5">Reservas hasta con cuántos días de anticipación</p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={agendaAdvance}
                  onChange={e => setAgendaAdvance(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-bold text-brand-700 w-16 text-right">{agendaAdvance} días</span>
              </div>
            </div>

            <Button type="submit" loading={savingAgenda} className="w-full">Guardar configuración</Button>
          </form>
          </>}
        </div>
      )}

      {/* Ayuda */}
      <Link to="/ayuda" className="bg-surface rounded-3xl shadow-card p-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-stone-800">¿Necesitás ayuda?</h2>
          <p className="text-xs text-stone-400 mt-0.5">Preguntas frecuentes y soporte</p>
        </div>
        <ChevronRight size={18} className="text-stone-400 shrink-0" />
      </Link>

      {/* Account */}
      <div className="bg-surface rounded-3xl shadow-card p-5">
        <h2 className="font-semibold text-stone-800 mb-1">Cuenta</h2>
        <p className="text-sm text-stone-400 mb-4">{user?.email}</p>
        <Button variant="outline" onClick={signOut}>Cerrar sesión</Button>
        <button
          onClick={() => {
            setDeleteAccountOpen(true)
            setDeleteAccountStartedAt(Date.now())
            setDeleteSent(false)
            setDeleteReason('')
          }}
          className="mt-3 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors block"
        >
          Solicitar eliminación de cuenta
        </button>
      </div>

      {/* Modal downgrade de suscripción */}
      <Modal
        open={confirmDowngradeOpen}
        onClose={() => setConfirmDowngradeOpen(false)}
        title={downgradeTo === 'starter' ? 'Bajar al plan Starter' : 'Darse de baja'}
      >
        {(() => {
          const newLimits = downgradeTo === 'starter'
            ? { maxSubscribers: 15, maxPlans: 3 }
            : { maxSubscribers: 5,  maxPlans: 2 }
          const excessSubs  = Math.max(0, (subscriberCount ?? 0) - newLimits.maxSubscribers)
          const excessPlans = Math.max(0, (planCount ?? 0) - newLimits.maxPlans)
          const hasExcess   = excessSubs > 0 || excessPlans > 0

          return (
            <>
              <p className="text-sm text-stone-600 mb-3">
                {downgradeTo === 'starter'
                  ? 'Pasás de Pro a Starter ($16.900/mes). Perdés acceso a estadísticas y agenda.'
                  : 'Tu plan pasa a Free. Perdés todas las funciones pagas.'}
              </p>

              {hasExcess && (
                <div className="bg-amber-50 rounded-2xl px-4 py-3 mb-4 text-xs text-amber-800 space-y-1">
                  <p className="font-semibold">⚠️ Tenés datos que superan el límite del nuevo plan:</p>
                  {excessSubs > 0 && (
                    <p>• {subscriberCount} clientes (límite: {newLimits.maxSubscribers}) — eliminá {excessSubs}</p>
                  )}
                  {excessPlans > 0 && (
                    <p>• {planCount} planes (límite: {newLimits.maxPlans}) — eliminá {excessPlans}</p>
                  )}
                </div>
              )}

              {hasExcess ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    {excessSubs > 0 && (
                      <Link to="/suscriptores" className="flex-1" onClick={() => setConfirmDowngradeOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">Gestionar clientes</Button>
                      </Link>
                    )}
                    {excessPlans > 0 && (
                      <Link to="/servicios" className="flex-1" onClick={() => setConfirmDowngradeOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full">Gestionar planes</Button>
                      </Link>
                    )}
                  </div>
                  <button
                    onClick={() => handleConfirmDowngrade(true)}
                    disabled={subscriptionActionLoading}
                    className="w-full text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors py-2"
                  >
                    {subscriptionActionLoading
                      ? 'Procesando...'
                      : `O bajar de igual manera (PLANE.AR eliminará los ${excessSubs + excessPlans} datos sobrantes)`}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setConfirmDowngradeOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    variant={downgradeTo === 'starter' ? 'primary' : 'danger'}
                    loading={subscriptionActionLoading}
                    onClick={() => handleConfirmDowngrade(false)}
                    className="flex-1"
                  >
                    {downgradeTo === 'starter' ? 'Ir a pagar Starter' : 'Confirmar baja'}
                  </Button>
                </div>
              )}
            </>
          )
        })()}
      </Modal>

      {/* Modal eliminar cuenta */}
      <Modal
        open={deleteAccountOpen}
        onClose={() => { setDeleteAccountOpen(false); setDeleteSent(false) }}
        title="Eliminar cuenta"
      >
        {deleteSent ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-sm font-semibold text-stone-800">Solicitud enviada</p>
            <p className="text-xs text-stone-500">
              Te contactamos en 48 hs hábiles para confirmar la eliminación.
            </p>
            <Button variant="outline" onClick={() => { setDeleteAccountOpen(false); setDeleteSent(false) }} className="w-full mt-2">
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleDeleteAccountRequest} className="space-y-4">
            <p className="text-sm text-stone-600">
              Nuestro equipo elimina tu cuenta y todos tus datos dentro de las 48 hs hábiles.
            </p>
            <div className="bg-surface-tint rounded-2xl px-4 py-3">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-0.5">Email de la cuenta</p>
              <p className="text-sm font-medium text-stone-700">{user?.email}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-500 mb-1.5 block">Motivo (opcional)</label>
              <textarea
                rows={3}
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Podés contarnos por qué si querés…"
                className="w-full bg-surface-tint border-0 border-b-2 border-stone-200 focus:border-red-400 rounded-t-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-0 transition-colors placeholder:text-stone-400"
              />
            </div>
            <div className="bg-red-50 rounded-2xl px-4 py-2.5">
              <p className="text-xs text-red-700 font-medium">
                Acción irreversible. Se eliminan tu cuenta, clientes, planes y todos los datos del negocio.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => setDeleteAccountOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button variant="danger" type="submit" loading={deleteSending} className="flex-1">
                Enviar solicitud
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal confirmación cambio de rubro */}
      <Modal open={confirmRubroOpen} onClose={() => setConfirmRubroOpen(false)} title="Cambiar rubro">
        <p className="text-sm text-stone-600 mb-2">
          Estás por cambiar el rubro a <strong>{CATEGORIES.find(c => c.value === pendingCategory)?.label}</strong>.
        </p>
        <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-2.5 mb-4">
          ⚠️ Se borrarán todos tus clientes y planes actuales. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConfirmRubroOpen(false)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={handleConfirmRubro} className="flex-1">Sí, cambiar rubro</Button>
        </div>
      </Modal>

      {/* Modal cargar plantillas del nuevo rubro */}
      <Modal open={templateModal} onClose={() => { setTemplateModal(false); setPendingCategory(null) }} title="¿Cargamos los planes sugeridos?">
        <p className="text-sm text-stone-600 mb-4">
          Tenemos planes sugeridos para <strong>{CATEGORIES.find(c => c.value === pendingCategory)?.label}</strong>. ¿Querés cargarlos ahora?
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setTemplateModal(false); setPendingCategory(null) }} className="flex-1">No, después</Button>
          <Button loading={loadingTemplates} onClick={handleLoadNewTemplates} className="flex-1">Sí, cargar planes</Button>
        </div>
      </Modal>
    </div>
  )
}
