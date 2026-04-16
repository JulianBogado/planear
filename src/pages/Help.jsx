import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import { Textarea, Select } from '../components/ui/Input'

const FAQ_DATA = [
  {
    category: 'Primeros pasos',
    items: [
      {
        q: '¿Cómo creo mi primer servicio?',
        a: 'Andá a "Servicios" desde el menú inferior, tocá el botón "+ Nuevo servicio" y completá el nombre, precio, cantidad de usos incluidos y la duración en días. Por ejemplo: "Plan mensual – 4 clases – $60.000 – 30 días".',
      },
      {
        q: '¿Cómo agrego un cliente?',
        a: 'Andá a "Clientes" y tocá "+ Nuevo". Completá el nombre, elegí el plan que va a tener y la fecha de inicio. La fecha de vencimiento y los usos restantes se calculan automáticamente.',
      },
    ],
  },
  {
    category: 'Servicios',
    items: [
      {
        q: '¿Qué son los "usos incluidos"?',
        a: 'Cada plan tiene una cantidad de usos (clases, cortes, turnos, etc.). Cada vez que el cliente usa el servicio, registrás un uso desde su ficha y el contador se descuenta automáticamente.',
      },
      {
        q: '¿Puedo tener varios planes?',
        a: 'Sí, podés crear todos los planes que necesites. Cada cliente elige uno al momento de suscribirse. Podés tener, por ejemplo, un plan básico, uno intermedio y uno premium.',
      },
      {
        q: '¿Cómo edito o elimino un servicio?',
        a: 'En la sección "Servicios", tocá el ícono de lápiz o basura a la derecha del servicio para editarlo o eliminarlo.',
      },
    ],
  },
  {
    category: 'Clientes',
    items: [
      {
        q: '¿Cómo registro un uso?',
        a: 'En la lista de clientes, tocá "Registrar uso" debajo del nombre del cliente (o usá el menú de tres puntitos). También podés hacerlo desde la ficha individual del cliente con el botón correspondiente.',
      },
      {
        q: '¿Cómo renuevo una suscripción?',
        a: 'Cuando un cliente aparece como "Vencido" o "Por vencer", vas a ver el botón "Renovar". Al tocarlo, podés ingresar el monto cobrado (opcional), y la app reinicia los usos y extiende la fecha según la duración del plan.',
      },
      {
        q: '¿Qué significa "Por vencer"?',
        a: 'Un cliente está marcado como "Por vencer" cuando le quedan menos de 7 días para que se cumpla el vencimiento de su suscripción. Es una alerta temprana para que puedas coordinarte con ellos antes de que expire.',
      },
      {
        q: '¿Cómo veo el historial de un cliente?',
        a: 'Tocá sobre cualquier cliente para abrir su ficha. Ahí vas a encontrar el detalle del plan, el historial completo de usos registrados con fecha y hora, y el historial de pagos.',
      },
    ],
  },
  {
    category: 'Configuración',
    items: [
      {
        q: '¿Cómo cambio el color de la app?',
        a: 'En "Configuración", en la sección "Apariencia", podés elegir entre tres paletas de colores: Rosa, Salvia y Lila. El cambio se aplica de inmediato.',
      },
      {
        q: '¿Cómo cambio el nombre de mi negocio?',
        a: 'En "Configuración", en la sección "Negocio", tocá el botón "Editar". Podés modificar tanto el nombre como el rubro.',
      },
    ],
  },
]

const CONTACT_CATEGORIES = [
  { value: 'tecnico', label: 'Tengo un problema técnico' },
  { value: 'sugerencia', label: 'Tengo una sugerencia' },
  { value: 'info', label: 'Quiero más información' },
  { value: 'otro', label: 'Otro' },
]

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-stone-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full text-left flex items-start justify-between gap-3 py-4"
      >
        <span className="text-sm font-semibold text-stone-800 leading-snug">{question}</span>
        {isOpen
          ? <ChevronUp size={16} className="text-stone-400 shrink-0 mt-0.5" />
          : <ChevronDown size={16} className="text-stone-400 shrink-0 mt-0.5" />
        }
      </button>
      {isOpen && (
        <p className="text-sm text-stone-500 pb-4 leading-relaxed">{answer}</p>
      )}
    </div>
  )
}

export default function Help() {
  const { user } = useAuth()
  const { business } = useOutletContext()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState('faq')
  const [openItem, setOpenItem] = useState(null) // "category-index"

  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  function toggleItem(key) {
    setOpenItem(prev => prev === key ? null : key)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!category) { showToast('Seleccioná una categoría', 'error'); return }
    if (!message.trim()) { showToast('Escribí tu mensaje', 'error'); return }

    setSending(true)
    const { error } = await supabase.from('support_messages').insert({
      user_id: user?.id,
      business_name: business?.name ?? null,
      email: user?.email ?? null,
      category,
      message: message.trim(),
    })
    setSending(false)

    if (error) {
      showToast('Error al enviar. Intentá de nuevo.', 'error')
    } else {
      showToast('Mensaje enviado, te respondemos pronto')
      setCategory('')
      setMessage('')
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="font-extrabold text-3xl text-stone-900">Ayuda</h1>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-surface-tint rounded-2xl p-1">
        {[
          { value: 'faq', label: 'Preguntas frecuentes' },
          { value: 'contacto', label: 'Contacto' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.value
                ? 'bg-surface shadow-card text-stone-800'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          {FAQ_DATA.map(section => (
            <div key={section.category} className="bg-surface rounded-3xl shadow-card p-5">
              <h2 className="font-semibold text-stone-800 mb-2">{section.category}</h2>
              {section.items.map((item, i) => {
                const key = `${section.category}-${i}`
                return (
                  <AccordionItem
                    key={key}
                    question={item.q}
                    answer={item.a}
                    isOpen={openItem === key}
                    onToggle={() => toggleItem(key)}
                  />
                )
              })}
            </div>
          ))}

          <div className="bg-surface-tint rounded-3xl p-5 text-center">
            <p className="text-sm text-stone-600 mb-3">¿No encontraste lo que buscabas?</p>
            <Button size="sm" onClick={() => setActiveTab('contacto')}>
              Contactar soporte
            </Button>
          </div>
        </div>
      )}

      {/* Contacto */}
      {activeTab === 'contacto' && (
        <div className="space-y-4">
          <div className="bg-surface rounded-3xl shadow-card p-5">
            <h2 className="font-semibold text-stone-800 mb-1">Escribinos</h2>
            <p className="text-xs text-stone-400 mb-5">
              Te respondemos a tu email a la brevedad.
            </p>

            <form onSubmit={handleSend} className="space-y-4">
              <div className="bg-surface-tint rounded-2xl px-4 py-3">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest mb-0.5">
                  Email de respuesta
                </p>
                <p className="text-sm text-stone-700 font-medium">{user?.email}</p>
              </div>

              <Select
                label="Motivo de contacto"
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
              >
                <option value="">Seleccioná una opción</option>
                {CONTACT_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>

              <Textarea
                label="Mensaje"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Contanos en qué podemos ayudarte..."
                required
              />

              <Button type="submit" loading={sending} className="w-full">
                Enviar mensaje
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
