import {
  Scissors, Sparkles, Flower2, Dumbbell,
  Activity, GlassWater, Wrench,
  Gem, Eye, Feather, Stethoscope, Wine, Sprout,
} from 'lucide-react'

export const CATEGORIES = [
  { value: 'peluqueria',  label: 'Peluquería',         Icon: Scissors },
  { value: 'manicura',    label: 'Manicura',            Icon: Sparkles },
  { value: 'floreria',    label: 'Florería',            Icon: Flower2 },
  { value: 'entrenador',  label: 'Entrenador personal', Icon: Dumbbell },
  { value: 'yoga',        label: 'Yoga',                Icon: Activity },
  { value: 'bar',         label: 'Bar / Cervecería',    Icon: GlassWater },
  { value: 'estetica',    label: 'Centro de estética',  Icon: Gem },
  { value: 'lashista',    label: 'Lashista',            Icon: Eye },
  { value: 'masajista',   label: 'Masajista',           Icon: Feather },
  { value: 'dermatologa', label: 'Dermatóloga',         Icon: Stethoscope },
  { value: 'vinoteca',   label: 'Vinoteca',            Icon: Wine },
  { value: 'vivero',      label: 'Vivero',              Icon: Sprout },
  { value: 'otro',        label: 'Otro',                Icon: Wrench },
]

export const TEMPLATES = {
  peluqueria: [
    {
      name: 'Básico mensual',
      description: '4 cortes al mes para mantener tu pelo siempre en forma',
      price: 55000, total_uses: 4, duration_days: 30,
      items: ['4 cortes de pelo', 'Peinado final'],
    },
    {
      name: 'Retoque quincenal',
      description: 'Un corte cada 15 días para que no te crezca ni un pelo',
      price: 28000, total_uses: 2, duration_days: 15,
      items: ['2 cortes de pelo'],
    },
  ],
  manicura: [
    {
      name: 'Manos perfectas',
      description: 'Manicura completa cada dos semanas, siempre impecable',
      price: 50000, total_uses: 2, duration_days: 30,
      items: ['2 turnos de manicura', 'Esmaltado a elección', 'Limpieza de cutícula'],
    },
    {
      name: 'Cuidado mensual',
      description: 'Un turno para mantener tus manos al día',
      price: 27000, total_uses: 1, duration_days: 30,
      items: ['1 turnos de manicura', 'Esmaltado a elección'],
    },
  ],
  floreria: [
    {
      name: 'Flores cada 15 días',
      description: 'Arreglos florales frescos para renovar tu espacio',
      price: 50000, total_uses: 2, duration_days: 30,
      items: ['2 arreglos florales medianos', 'Flores de temporada'],
    },
    {
      name: 'Primavera todo el mes',
      description: 'Un arreglo por semana para que tu local nunca pierda color',
      price: 95000, total_uses: 4, duration_days: 30,
      items: ['4 arreglos florales', 'Flores de temporada', 'Diseño a elección'],
    },
  ],
  entrenador: [
    {
      name: 'Entrada en calor',
      description: 'El plan ideal para empezar a moverse con constancia',
      price: 80000, total_uses: 8, duration_days: 30,
      items: ['8 sesiones de entrenamiento', 'Rutina personalizada', 'Seguimiento de progreso'],
    },
    {
      name: 'Sin excusas',
      description: 'Para los que van en serio: tres veces por semana todo el mes',
      price: 110000, total_uses: 12, duration_days: 30,
      items: ['12 sesiones de entrenamiento', 'Rutina personalizada', 'Seguimiento de progreso', 'Asesoramiento nutricional'],
    },
  ],
  yoga: [
    {
      name: 'Flujo mensual',
      description: 'Tres clases por semana para conectar cuerpo y mente',
      price: 70000, total_uses: 12, duration_days: 30,
      items: ['12 clases de yoga', 'Todos los niveles', 'Mat disponible en el estudio'],
    },
    {
      name: 'Bienestar a tu ritmo',
      description: 'Dos veces por semana para empezar a soltar el estrés',
      price: 50000, total_uses: 8, duration_days: 30,
      items: ['8 clases de yoga', 'Todos los niveles'],
    },
  ],
  bar: [
    {
      name: 'Siempre listo',
      description: 'Dos chopps por semana para los fanáticos de siempre',
      price: 50000, total_uses: 8, duration_days: 30,
      items: ['8 cervezas artesanales', 'Variedad de estilos', 'Descuento en picadas'],
    },
    {
      name: 'Una mas y arrancamos',
      description: 'Para el que no falta ningún jueves ni viernes',
      price: 9000, total_uses: 16, duration_days: 30,
      items: ['16 cervezas artesanales', 'Variedad de estilos', 'Vaso de regalo', 'Descuento en picadas'],
    },
  ],
  estetica: [
    {
      name: 'Facial Premium',
      description: 'Limpiezas semanales para una piel siempre luminosa',
      price: 55000, total_uses: 2, duration_days: 30,
      items: ['4 limpiezas de cutis', 'Hidratación post-tratamiento', 'Evaluación de piel', 'Masaje facial incluido'],
    },
    {
      name: 'Cutis Radiante',
      description: 'Dos tratamientos al mes para una piel que se note',
      price: 30000, total_uses: 1, duration_days: 30,
      items: ['2 tratamientos faciales', 'Hidratación profunda', 'Evaluación de piel'],
    },
  ],
  lashista: [
    {
      name: 'Cejas al día',
      description: 'Dos diseños al mes para que estés siempre lista',
      price: 40000, total_uses: 2, duration_days: 30,
      items: ['2 diseños de cejas', 'Depilación incluida'],
    },
    {
      name: 'Retoque quincenal',
      description: 'Un diseño cada 15 días, siempre perfectas',
      price: 22000, total_uses: 1, duration_days: 15,
      items: ['1 diseño de cejas', 'Depilación incluida'],
    },
  ],
  masajista: [
    {
      name: 'Relajación total',
      description: 'Un masaje por semana para desenchufarse de todo',
      price: 120000, total_uses: 4, duration_days: 30,
      items: ['4 masajes de 60 minutos', 'Técnica a elección', 'Aromaterapia incluida'],
    },
    {
      name: 'Alivio quincenal',
      description: 'Dos masajes cada quince días para mantener el cuerpo en orden',
      price: 45000, total_uses: 2, duration_days: 15,
      items: ['2 masajes de 60 minutos', 'Técnica a elección'],
    },
  ],
  dermatologa: [
    {
      name: 'Control mensual',
      description: 'Dos consultas por mes para cuidar tu piel con seguimiento profesional',
      price: 60000, total_uses: 2, duration_days: 30,
      items: ['2 consultas dermatológicas', 'Análisis de piel', 'Recomendaciones personalizadas'],
    },
    {
      name: 'Seguimiento trimestral',
      description: 'Tres consultas en noventa días para un tratamiento con continuidad',
      price: 80000, total_uses: 3, duration_days: 90,
      items: ['3 consultas dermatológicas', 'Análisis de piel', 'Recomendaciones personalizadas', 'Foto-seguimiento'],
    },
  ],
  vinoteca: [
    {
      name: 'Selección de la casa',
      description: 'Una caja con 4 vinos seleccionados por nuestro sommelier',
      price: 60000, total_uses: 1, duration_days: 30,
      items: ['4 vinos reserva', 'Ficha técnica de cada vino'],
    },
    {
      name: 'Viaje a la cava',
      description: '2 cajas con 4 vinos cada una, para un recorrido completo por distintas regiones',
      price: 90000, total_uses: 2, duration_days: 30,
      items: ['2 combos de vinos seleccionados', 'Notas de cata', 'Recomendación de maridaje'],
    },
  ],
  vivero: [
    {
      name: 'Verde en casa',
      description: 'Una planta nueva por mes, seleccionada para tu espacio',
      price: 25000, total_uses: 1, duration_days: 30,
      items: ['1 planta de interior o exterior', 'Sustrato incluido', 'Guía de cuidados'],
    },
    {
      name: 'Fan de las plantas',
      description: 'Dos plantas al mes para ir armando tu espacio verde de a poco',
      price: 50000, total_uses: 2, duration_days: 30,
      items: ['2 plantas a elección', 'Guía de cuidados', 'Asesoramiento'],
    },
  ],
  otro: [],
}
