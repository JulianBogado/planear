import { useState, useRef, useEffect } from 'react'
import { format, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import MiniCalendar from './MiniCalendar'

/**
 * Props:
 *   value     string        — 'yyyy-MM-dd'
 *   onChange  (string)=>    — called with 'yyyy-MM-dd' on selection
 *   label?    string        — label above the input
 */
export default function DatePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = value ? new Date(value + 'T00:00:00') : new Date()
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(selected))

  useEffect(() => {
    function handleOutside(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  // Sync calendarMonth when value changes externally (e.g. openNewModal sets a different date)
  useEffect(() => {
    if (value) setCalendarMonth(startOfMonth(new Date(value + 'T00:00:00')))
  }, [value])

  function handleSelect(date) {
    onChange(format(date, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const displayDate = value
    ? format(new Date(value + 'T00:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })
    : 'Seleccionar fecha'

  return (
    <div className="space-y-1" ref={ref}>
      {label && (
        <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-widest">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between bg-surface-tint border-b-2 rounded-t-xl px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none ${
            open ? 'border-brand-600 text-stone-900' : 'border-stone-200 text-stone-700 hover:border-stone-300'
          }`}
        >
          <span>{displayDate}</span>
          <CalendarDays size={15} className={`shrink-0 ml-2 transition-colors ${open ? 'text-brand-500' : 'text-stone-400'}`} />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1">
            <MiniCalendar
              selected={selected}
              onSelect={handleSelect}
              calendarMonth={calendarMonth}
              onMonthChange={setCalendarMonth}
            />
          </div>
        )}
      </div>
    </div>
  )
}
