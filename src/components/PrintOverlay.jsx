import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, Check } from 'lucide-react'

const CARD_STYLES = [
  { id: 'linea',  label: 'Línea',  desc: 'Acento lateral' },
  { id: 'panel',  label: 'Panel',  desc: 'Franja superior' },
  { id: 'solido', label: 'Sólido', desc: 'Fondo completo' },
]

const PRINT_COLORS = [
  { id: 'brand',  label: 'Tema',    color: null },
  { id: 'blue',   label: 'Azul',    color: '#2563eb' },
  { id: 'green',  label: 'Verde',   color: '#16a34a' },
  { id: 'violet', label: 'Violeta', color: '#7c3aed' },
  { id: 'orange', label: 'Naranja', color: '#ea580c' },
]

export default function PrintOverlay({ plans, business, onClose }) {
  const [style, setStyle] = useState('linea')
  const [printColor, setPrintColor] = useState('brand')

  const resolvedColor = PRINT_COLORS.find(c => c.id === printColor)?.color ?? 'var(--brand-600)'

  const count = plans.length
  const cols  = Math.min(count, 3)
  const isFew = count <= 3

  // Screen preview width so ≤3 cards are nicely centered
  const previewMaxWidth = isFew ? `${cols * 280 + (cols - 1) * 20}px` : '896px'

  return (
    <>
      {/* ── Screen overlay (preview only, never printed) ─── */}
      <div className="fixed inset-0 z-[60] flex flex-col bg-[#f3f1ea]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-stone-100 shrink-0">
          <div>
            <h2 className="font-extrabold text-lg text-stone-900">Imprimir planes</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Activá "Imprimir fondos" en el diálogo del sistema para ver los colores
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Style + Color selector */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3 bg-white border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-stone-500 shrink-0">Estilo:</p>
            <div className="flex gap-2">
              {CARD_STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all ${
                    style === s.id
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <StyleDot styleId={s.id} />
                  {s.label}
                  {style === s.id && <Check size={12} className="text-brand-600" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-stone-500 shrink-0">Color:</p>
            <div className="flex gap-2">
              {PRINT_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setPrintColor(c.id)}
                  title={c.label}
                  className={`w-6 h-6 rounded-full transition-all ${
                    printColor === c.id ? 'ring-2 ring-offset-1 ring-stone-400 scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.color ?? 'var(--brand-600)' }}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-stone-400 ml-auto hidden lg:block">
            {count} plan{count !== 1 ? 'es' : ''} · A4 horizontal
          </p>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-8 flex items-start justify-center">
          <div
            className="grid gap-5 w-full"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: previewMaxWidth }}
          >
            {plans.map(plan => (
              <PrintCard key={plan.id} plan={plan} business={business} styleId={style} tall={isFew} color={resolvedColor} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-stone-100 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border-2 border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold shadow-sm transition-colors"
            style={{ backgroundColor: 'var(--brand-600)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-700)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--brand-600)'}
          >
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>

      {/* ── Print portal: rendered directly under <body>, invisible on screen ── */}
      {createPortal(
        <div id="print-portal">
          <div
            className="print-area"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {plans.map(plan => (
              <PrintCard key={plan.id} plan={plan} business={business} styleId={style} tall={isFew} color={resolvedColor} />
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

/* ── Mini dot for each style ─────────────────────────── */
function StyleDot({ styleId }) {
  if (styleId === 'linea') return (
    <span
      className="w-3.5 h-3.5 rounded bg-white border border-stone-200 shrink-0"
      style={{ borderLeft: '3px solid var(--brand-600)' }}
    />
  )
  if (styleId === 'panel') return (
    <span
      className="w-3.5 h-3.5 rounded overflow-hidden shrink-0"
      style={{ background: `linear-gradient(180deg, var(--brand-600) 38%, white 38%)`, border: '1px solid rgba(0,0,0,0.08)' }}
    />
  )
  return <span className="w-3.5 h-3.5 rounded shrink-0" style={{ backgroundColor: 'var(--brand-600)' }} />
}

/* ── Contact line helper ──────────────────────────────── */
function ContactLine({ business, light }) {
  const parts = []
  if (business?.phone)     parts.push(business.phone)
  if (business?.instagram) parts.push(`@${business.instagram}`)
  if (parts.length === 0)  return null
  return (
    <p
      className="text-[9px] mt-2 tracking-wide"
      style={{ color: light ? 'rgba(255,255,255,0.5)' : '#a8a29e' }}
    >
      {parts.join('  ·  ')}
    </p>
  )
}

/* ── Individual print card ────────────────────────────── */
function PrintCard({ plan, business, styleId, tall, color }) {
  const price    = `$${Number(plan.price).toLocaleString('es-AR')}`
  const usesText = `Incluye ${plan.total_uses} uso${plan.total_uses !== 1 ? 's' : ''}`
  const daysText = `Válido por ${plan.duration_days} días`
  const cardStyle = { minHeight: tall ? '340px' : '200px' }

  if (styleId === 'linea') {
    return (
      <div
        className="print-card bg-white rounded-2xl flex flex-col shadow-card"
        style={{ ...cardStyle, padding: tall ? '28px' : '20px', border: '1px solid #d4d0c8', borderLeft: `5px solid ${color}` }}
      >
        <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color }}>
          {business?.name}
        </p>
        <p className={`font-extrabold text-stone-900 leading-snug ${tall ? 'text-2xl' : 'text-lg'}`}>{plan.name}</p>
        {plan.description && (
          <p className="text-sm text-stone-500 leading-relaxed mt-2">{plan.description}</p>
        )}
        {plan.items?.length > 0 && (
          <div className="mt-2 mb-5">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color }}>Incluye</p>
            <ul className="space-y-1">
              {plan.items.map((item, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[13px] text-stone-500">
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-auto pt-5 border-t border-stone-100">
          <p className={`font-extrabold leading-none ${tall ? 'text-5xl' : 'text-3xl'}`} style={{ color }}>
            {price}
          </p>
          <p className={`text-stone-400 mt-2 ${tall ? 'text-sm' : 'text-xs'}`}>{usesText}</p>
          <p className={`text-stone-400 ${tall ? 'text-sm' : 'text-xs'}`}>{daysText}</p>
          <ContactLine business={business} />
        </div>
      </div>
    )
  }

  if (styleId === 'panel') {
    return (
      <div className="print-card bg-white rounded-2xl overflow-hidden shadow-card flex flex-col" style={{ ...cardStyle, border: '1px solid #d4d0c8' }}>
        <div className="shrink-0" style={{ backgroundColor: color, padding: tall ? '20px 24px' : '16px 20px' }}>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1">{business?.name}</p>
          <p className={`text-white font-extrabold leading-snug ${tall ? 'text-2xl' : 'text-lg'}`}>{plan.name}</p>
        </div>
        <div className="flex flex-col flex-1" style={{ padding: tall ? '20px 24px' : '16px 20px' }}>
          {plan.description && (
            <p className="text-sm text-stone-500 leading-relaxed mb-3">{plan.description}</p>
          )}
          {plan.items?.length > 0 && (
            <div className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color }}>Incluye</p>
              <ul className="space-y-1">
                {plan.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[13px] text-stone-500">
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-auto">
            <p className={`font-extrabold leading-none ${tall ? 'text-5xl' : 'text-3xl'}`} style={{ color }}>
              {price}
            </p>
            <p className={`text-stone-400 mt-2 ${tall ? 'text-sm' : 'text-xs'}`}>{usesText}</p>
            <p className={`text-stone-400 ${tall ? 'text-sm' : 'text-xs'}`}>{daysText}</p>
            <ContactLine business={business} />
          </div>
        </div>
      </div>
    )
  }

  // 'solido'
  return (
    <div
      className="print-card rounded-2xl flex flex-col shadow-card"
      style={{ ...cardStyle, backgroundColor: color, padding: tall ? '28px' : '20px', border: '1px solid #d4d0c8' }}
    >
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-3">{business?.name}</p>
      <p className={`font-extrabold text-white leading-snug ${tall ? 'text-2xl' : 'text-lg'}`}>{plan.name}</p>
      {plan.description && (
        <p className="text-sm text-white/70 leading-relaxed mt-2">{plan.description}</p>
      )}
      {plan.items?.length > 0 && (
        <div className="mt-2 mb-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">Incluye</p>
          <ul className="space-y-1">
            {plan.items.map((item, i) => (
              <li key={i} className="flex items-center gap-1.5 text-[13px] text-white/70">
                <span className="w-1 h-1 rounded-full bg-white/50 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-auto pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <p className={`font-extrabold leading-none text-white ${tall ? 'text-5xl' : 'text-3xl'}`}>{price}</p>
        <p className={`text-white/60 mt-2 ${tall ? 'text-sm' : 'text-xs'}`}>{usesText}</p>
        <p className={`text-white/60 ${tall ? 'text-sm' : 'text-xs'}`}>{daysText}</p>
        <ContactLine business={business} light />
      </div>
    </div>
  )
}
