export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-stone-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-stone-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
