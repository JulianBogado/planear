export const TIER_LIMITS = {
  free:    { maxSubscribers: 5,   maxPlans: 2,   canPrint: false, canStats: false, canReserve: false },
  starter: { maxSubscribers: 50,  maxPlans: 3,   canPrint: true,  canStats: false, canReserve: false },
  pro:     { maxSubscribers: null, maxPlans: null, canPrint: true,  canStats: true,  canReserve: true  },
}

export const TIER_INFO = {
  free: {
    label: 'Free',
    price: 0,
    priceLabel: 'Gratis',
    description: 'Para empezar',
    features: [
      'Hasta 5 clientes',
      '2 planes',
      'Registro de usos',
      'Historial de pagos',
      'Soporte incluido',
    ],
    locked: [
      'Impresión de carteles',
      'Estadísticas',
      'Agenda y reservas online',
    ],
  },
  starter: {
    label: 'Starter',
    price: 25000,
    priceLabel: '$25.000/mes',
    description: 'Para negocios en crecimiento',
    features: [
      'Hasta 50 clientes',
      'Hasta 3 planes',
      'Registro de usos',
      'Historial de pagos',
      'Impresión de carteles',
      'Soporte incluido',
    ],
    locked: [
      'Estadísticas',
      'Agenda y reservas online',
    ],
  },
  pro: {
    label: 'Pro',
    price: 30000,
    priceLabel: '$30.000/mes',
    description: 'Sin límites',
    features: [
      'Clientes ilimitados',
      'Planes ilimitados',
      'Registro de usos',
      'Historial de pagos',
      'Impresión de carteles',
      'Estadísticas completas',
      'Agenda y reservas online',
      'Soporte incluido',
    ],
    locked: [],
  },
}
