import Badge from './Badge'

export function StatusBadge({ status }) {
  const map = {
    active:        { color: 'green',  label: 'Activa' },
    expiring_soon: { color: 'yellow', label: 'Por vencer' },
    expired:       { color: 'red',    label: 'Vencida' },
    no_uses:       { color: 'red',    label: 'Sin usos' },
  }
  const { color, label } = map[status] ?? { color: 'gray', label: status }
  return <Badge color={color}>{label}</Badge>
}
