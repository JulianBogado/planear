import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, TEMPLATES } from '../constants/templates'

export default function Onboarding() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [category, setCategory] = useState('')
  const [selectedTemplates, setSelectedTemplates] = useState([])
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [instagram, setInstagram] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleCategorySelect(value) {
    setCategory(value)
    setSelectedTemplates(TEMPLATES[value]?.map((_, i) => i) ?? [])
  }

  function toggleTemplate(idx) {
    setSelectedTemplates(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
  }

  async function handleFinish() {
    setError(''); setLoading(true)
    const { data: business, error: bizError } = await supabase
      .from('businesses').insert({
        user_id: user.id,
        name: businessName.trim(),
        category,
        phone: phone.trim() || null,
        address: address.trim() || null,
        instagram: instagram.trim() || null,
      }).select().single()
    if (bizError) { setError('Hubo un error al guardar. Intentá de nuevo.'); setLoading(false); return }
    const templates = TEMPLATES[category] ?? []
    const plansToInsert = selectedTemplates.map(idx => templates[idx]).filter(Boolean).map(t => ({ ...t, business_id: business.id, is_template: true }))
    if (plansToInsert.length > 0) await supabase.from('plans').insert(plansToInsert)
    navigate('/dashboard')
  }

  return (
    <div data-theme="celeste" className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--bg)' }}>

      {/* Brand + sign out */}
      <div className="flex items-center justify-between w-full max-w-md mb-8">
        <p className="font-extrabold text-2xl text-brand-600 tracking-tight">PLANE.AR</p>
        <button
          onClick={signOut}
          className="text-xs text-stone-400 hover:text-red-500 transition-colors font-medium"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="w-full max-w-md">

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(n => (
            <div key={n} className={`h-1.5 rounded-full transition-all ${n <= step ? 'bg-brand-600 w-10' : 'bg-stone-200 w-6'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="bg-surface rounded-3xl shadow-card p-8 text-center space-y-8">
            <div>
              <h1 className="font-extrabold text-3xl text-stone-900 leading-tight mb-2">¿Cómo se llama<br />tu negocio?</h1>
              <p className="text-stone-400 text-sm">Este nombre lo verás en tu panel</p>
            </div>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && businessName.trim() && setStep(2)}
              placeholder="Ej: Peluquería Martínez"
              autoFocus
              className="w-full text-center text-xl font-semibold bg-surface-tint border-0 border-b-2 border-stone-200 focus:border-brand-600 rounded-t-xl py-3 focus:outline-none focus:ring-0 placeholder:text-stone-300 transition-colors"
            />
            <div className="border-t border-stone-100 pt-4 space-y-3 text-left">
              <p className="text-xs text-stone-400 font-medium text-center">Información de contacto · podés completarlo después</p>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Teléfono"
                className="w-full bg-surface-tint border-0 border-b-2 border-stone-200 focus:border-brand-600 rounded-t-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-0 transition-colors placeholder:text-stone-300"
              />
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Dirección"
                className="w-full bg-surface-tint border-0 border-b-2 border-stone-200 focus:border-brand-600 rounded-t-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-0 transition-colors placeholder:text-stone-300"
              />
              <input
                type="text"
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                placeholder="Instagram (sin @)"
                className="w-full bg-surface-tint border-0 border-b-2 border-stone-200 focus:border-brand-600 rounded-t-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-0 transition-colors placeholder:text-stone-300"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!businessName.trim()}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold rounded-full py-3.5 text-sm transition-all shadow-sm"
            >
              Continuar →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="font-extrabold text-3xl text-stone-900 mb-1">¿Cuál es tu rubro?</h1>
              <p className="text-stone-400 text-sm">Nos ayuda a sugerirte los mejores planes</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => handleCategorySelect(value)}
                  className={`flex flex-col items-center gap-3 px-4 py-5 rounded-3xl border-2 text-sm font-semibold transition-all ${
                    category === value
                      ? 'bg-brand-50 border-brand-400 text-brand-800 shadow-card'
                      : 'bg-surface border-transparent shadow-card text-stone-700 hover:border-brand-200'
                  }`}
                >
                  <Icon size={24} className={category === value ? 'text-brand-600' : 'text-stone-400'} />
                  <span className="text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border-2 border-stone-200 text-stone-600 font-semibold rounded-full py-3 text-sm hover:bg-stone-50 transition-colors">← Atrás</button>
              <button onClick={() => setStep(3)} disabled={!category} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold rounded-full py-3 text-sm transition-all shadow-sm">Continuar →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="font-extrabold text-3xl text-stone-900 mb-1">Servicios sugeridos</h1>
              <p className="text-stone-400 text-sm">Elegí cuáles querés usar. Podés editarlos después.</p>
            </div>

            {(TEMPLATES[category] ?? []).length === 0 ? (
              <div className="bg-surface rounded-3xl shadow-card p-8 text-center text-stone-400">
                <p className="text-sm">Podés crear tus propios planes desde el panel</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(TEMPLATES[category] ?? []).map((t, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedTemplates.includes(idx)
                        ? 'bg-brand-50 border-brand-300 shadow-card'
                        : 'bg-surface border-transparent shadow-card hover:border-stone-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTemplates.includes(idx)}
                      onChange={() => toggleTemplate(idx)}
                      className="accent-brand-600 w-4 h-4 rounded shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-900">{t.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{t.total_uses} usos · {t.duration_days} días</p>
                    </div>
                    <p className="font-extrabold text-xl text-brand-700 shrink-0">${t.price.toLocaleString('es-AR')}</p>
                  </label>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-2.5">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border-2 border-stone-200 text-stone-600 font-semibold rounded-full py-3 text-sm hover:bg-stone-50 transition-colors">← Atrás</button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-full py-3 text-sm transition-all shadow-sm"
              >
                {loading ? 'Guardando...' : '¡Empezar!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
