import {
  Scissors, Sparkles, Flower2, Dumbbell,
  Activity, GlassWater, Wrench,
  Gem, Eye, Feather, Stethoscope, Wine,
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
  { value: 'otro',        label: 'Otro',                Icon: Wrench },
]

export const TEMPLATES = {
  peluqueria: [
    { name: 'Plan mensual 4 cortes',    description: '4 cortes de pelo por mes',            price: 60000, total_uses: 4,  duration_days: 30 },
    { name: 'Plan quincenal 2 cortes',  description: '2 cortes de pelo cada 15 días',        price: 32000, total_uses: 2,  duration_days: 15 },
  ],
  manicura: [
    { name: 'Plan mensual 4 turnos',    description: '4 turnos de manicura por mes',         price: 50000, total_uses: 4,  duration_days: 30 },
    { name: 'Plan mensual 2 turnos',    description: '2 turnos de manicura por mes',          price: 27000, total_uses: 2,  duration_days: 30 },
  ],
  floreria: [
    { name: 'Plan mensual 2 arreglos',  description: '2 arreglos florales por mes',          price: 50000, total_uses: 2,  duration_days: 30 },
    { name: 'Plan mensual 4 arreglos',  description: '4 arreglos florales por mes',          price: 95000, total_uses: 4,  duration_days: 30 },
  ],
  entrenador: [
    { name: 'Plan mensual 8 clases',    description: '8 clases de entrenamiento por mes',    price: 80000, total_uses: 8,  duration_days: 30 },
    { name: 'Plan mensual 12 clases',   description: '12 clases de entrenamiento por mes',   price: 110000, total_uses: 12, duration_days: 30 },
  ],
  yoga: [
    { name: 'Plan mensual 12 clases',   description: '12 clases de yoga por mes',            price: 70000, total_uses: 12, duration_days: 30 },
    { name: 'Plan mensual 8 clases',    description: '8 clases de yoga por mes',             price: 50000, total_uses: 8,  duration_days: 30 },
  ],
  bar: [
    { name: 'Plan mensual 8 cervezas',  description: '8 cervezas por mes',                  price: 40000, total_uses: 8,  duration_days: 30 },
    { name: 'Plan mensual 16 cervezas', description: '16 cervezas por mes',                 price: 75000, total_uses: 16, duration_days: 30 },
  ],
  estetica: [
    { name: 'Plan mensual 4 limpiezas', description: '4 limpiezas de cutis por mes',     price: 70000, total_uses: 4, duration_days: 30 },
    { name: 'Plan mensual 2 faciales',  description: '2 tratamientos faciales por mes',  price: 55000, total_uses: 2, duration_days: 30 },
  ],
  lashista: [
    { name: 'Plan mensual 2 diseños',   description: '2 diseños de cejas por mes',       price: 40000, total_uses: 2, duration_days: 30 },
    { name: 'Plan quincenal 1 diseño',  description: '1 diseño de cejas cada 15 días',   price: 22000, total_uses: 1, duration_days: 15 },
  ],
  masajista: [
    { name: 'Plan mensual 4 masajes',   description: '4 masajes por mes',                price: 80000, total_uses: 4, duration_days: 30 },
    { name: 'Plan quincenal 2 masajes', description: '2 masajes cada 15 días',           price: 45000, total_uses: 2, duration_days: 15 },
  ],
  dermatologa: [
    { name: 'Plan mensual 2 consultas',     description: '2 consultas dermatológicas por mes',      price: 60000, total_uses: 2, duration_days: 30 },
    { name: 'Plan trimestral 3 consultas',  description: '3 consultas dermatológicas por trimestre', price: 80000, total_uses: 3, duration_days: 90 },
  ],
  vinoteca: [
    { name: 'Membresía degustación mensual', description: '4 degustaciones guiadas por mes',   price: 60000, total_uses: 4, duration_days: 30 },
    { name: 'Pack vinos del mes',            description: '2 combos de vinos curados por mes', price: 45000, total_uses: 2, duration_days: 30 },
  ],
  otro: [],
}
