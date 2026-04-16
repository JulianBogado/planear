const variants = {
  green:  'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-700',
  red:    'bg-red-100 text-red-700',
  gray:   'bg-stone-100 text-stone-600',
  brand:  'bg-brand-100 text-brand-700',
}

export default function Badge({ color = 'gray', children }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${variants[color] ?? variants.gray}`}>
      {children}
    </span>
  )
}
