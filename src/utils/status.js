import { differenceInDays, parseISO, startOfDay } from 'date-fns'

export function computeStatus(end_date, uses_remaining) {
  if (uses_remaining <= 0) {
    return { status: 'no_uses', label: 'Sin usos', colorClass: 'red' }
  }

  const today = startOfDay(new Date())
  const endDay = startOfDay(parseISO(end_date))
  const daysLeft = differenceInDays(endDay, today)

  if (daysLeft < 0) {
    return { status: 'expired', label: 'Vencida', colorClass: 'red' }
  }
  if (daysLeft < 7) {
    return { status: 'expiring_soon', label: 'Por vencer', colorClass: 'yellow' }
  }
  return { status: 'active', label: 'Activa', colorClass: 'green' }
}
