import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/**
 * Props:
 *   selected        Date       — currently selected day
 *   onSelect        (Date)=>   — called on single click (if day is selectable)
 *   onDoubleClick?  (Date)=>   — called on double click (optional, used in Agenda)
 *   calendarMonth   Date       — which month is shown
 *   onMonthChange   (Date)=>   — called when user navigates months
 *   busyDates?      string[]   — 'yyyy-MM-dd' strings that get a dot indicator
 *   selectableDates? string[]  — if provided, only these dates are clickable; others are dimmed
 */
export default function MiniCalendar({
  selected,
  onSelect,
  onDoubleClick,
  calendarMonth,
  onMonthChange,
  busyDates = [],
  selectableDates,
}) {
  const firstDay = startOfMonth(calendarMonth)
  const lastDay = endOfMonth(calendarMonth)
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })

  // Monday-first offset: Mon=0 … Sun=6
  const offset = (getDay(firstDay) + 6) % 7

  return (
    <div className="bg-surface rounded-3xl shadow-card p-4 select-none">
      {/* Month navigator */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onMonthChange(subMonths(calendarMonth, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-tint transition-colors"
        >
          <ChevronLeft size={16} className="text-stone-500" />
        </button>
        <p className="font-bold text-stone-800 capitalize text-sm">
          {format(calendarMonth, 'MMMM yyyy', { locale: es })}
        </p>
        <button
          onClick={() => onMonthChange(addMonths(calendarMonth, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-tint transition-colors"
        >
          <ChevronRight size={16} className="text-stone-500" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-stone-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}

        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isSelected = selected && isSameDay(day, selected)
          const isCurrentDay = isToday(day)
          const hasBusy = busyDates.includes(dateStr)
          const isOtherMonth = !isSameMonth(day, calendarMonth)
          const isDisabled = selectableDates !== undefined && !selectableDates.includes(dateStr)

          return (
            <button
              key={dateStr}
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelect(day)}
              onDoubleClick={() => !isDisabled && onDoubleClick?.(day)}
              className={`relative flex flex-col items-center justify-center w-full aspect-square rounded-xl transition-all text-sm font-semibold
                ${isDisabled
                  ? 'opacity-30 cursor-default'
                  : isSelected
                  ? 'bg-brand-600 text-white shadow-sm'
                  : isCurrentDay
                  ? 'bg-brand-50 text-brand-700'
                  : isOtherMonth
                  ? 'text-stone-300'
                  : 'text-stone-700 hover:bg-surface-tint cursor-pointer'
                }`}
            >
              {day.getDate()}
              {/* Busy dot */}
              {hasBusy && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white opacity-70' : 'bg-brand-400'}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
