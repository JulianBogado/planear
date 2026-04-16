import { useNavigate } from 'react-router-dom'
import { Lock, Users, Package, Printer, BarChart2 } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

const FEATURE_CONFIG = {
  subscribers: {
    icon: <Users size={22} />,
    title: 'Límite de clientes alcanzado',
    description: 'Tu plan Free permite hasta 5 clientes. Actualizá para agregar más.',
    tierNeeded: 'Starter o Pro',
  },
  plans: {
    icon: <Package size={22} />,
    title: 'Límite de planes alcanzado',
    description: 'Tu plan Free permite hasta 2 planes. Actualizá para crear más.',
    tierNeeded: 'Starter o Pro',
  },
  print: {
    icon: <Printer size={22} />,
    title: 'Función exclusiva de Starter',
    description: 'La impresión de carteles está disponible a partir del plan Starter.',
    tierNeeded: 'Starter o Pro',
  },
  stats: {
    icon: <BarChart2 size={22} />,
    title: 'Función exclusiva de Pro',
    description: 'Las estadísticas completas están disponibles en el plan Pro.',
    tierNeeded: 'Pro',
  },
}

export default function UpgradeModal({ open, onClose, feature }) {
  const navigate = useNavigate()
  const config = FEATURE_CONFIG[feature] ?? FEATURE_CONFIG.subscribers

  return (
    <Modal open={open} onClose={onClose} title="Actualizá tu plan">
      <div className="space-y-4">
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-4">
            {config.icon}
          </div>
          <h3 className="font-semibold text-stone-800 mb-1">{config.title}</h3>
          <p className="text-sm text-stone-500 leading-relaxed">{config.description}</p>
        </div>

        <div className="bg-surface-tint rounded-2xl px-4 py-3 flex items-center gap-2">
          <Lock size={14} className="text-brand-600 shrink-0" />
          <p className="text-sm text-stone-600">
            Disponible en <span className="font-semibold text-stone-800">{config.tierNeeded}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Ahora no</Button>
          <Button onClick={() => { onClose(); navigate('/precios') }} className="flex-1">
            Ver planes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
