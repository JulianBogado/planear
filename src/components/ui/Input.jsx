const baseInput = (error) =>
  `w-full bg-surface-tint border-0 border-b-2 ${
    error
      ? 'border-red-400 focus:border-red-500'
      : 'border-stone-200 focus:border-brand-600'
  } rounded-t-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-0 transition-colors placeholder:text-stone-400`

export default function Input({ label, error, type = 'text', className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">
          {label}
        </label>
      )}
      <input type={type} className={`${baseInput(error)} ${className}`} {...props} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">
          {label}
        </label>
      )}
      <textarea
        rows={3}
        className={`${baseInput(error)} resize-none rounded-xl ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">
          {label}
        </label>
      )}
      <select className={`${baseInput(error)} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
