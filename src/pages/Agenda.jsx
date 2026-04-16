import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { format, addDays, startOfMonth, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Settings2, Plus, Check, X, User, UserCheck, CalendarDays, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAppointments, useMonthAppointments, usePastPendingAppointments, useWeekAppointments, getAvailableSlots } from '../hooks/useAppointments'
import { useSubscribers } from '../hooks/useSubscribers'
import { useAvailability } from '../hooks/useAvailability'
import { useSubscription } from '../hooks/useSubscription'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input, { Textarea } from '../components/ui/Input'
import DatePicker from '../components/ui/DatePicker'
import UpgradeModal from '../components/ui/UpgradeModal'
import MiniCalendar from '../components/ui/MiniCalendar'

export default function Agenda() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { business } = useOutletContext()
  const { canReserve } = useSubscription(business)
  const isSuperuser = user?.email === import.meta.env.VITE_SUPERUSER_EMAIL

  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(today)
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(today))
  const [view, setView] = useState('day') // 'day' | 'week'

  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd')
  const weekStartStr = format(selectedDate, 'yyyy-MM-dd')

  const { appointments, loading, createAppointment, confirmAppointment, cancelAppointment } = useAppointments(business?.id, dateStr)
  const { appointments: tomorrowAppts, loading: tomorrowLoading } = useAppointments(
    isToday(selectedDate) && view === 'day' ? business?.id : null,
    tomorrowStr
  )
  const { byDay: weekDays, loading: weekLoading } = useWeekAppointments(
    view === 'week' ? business?.id : null,
    weekStartStr
  )
  const { appointments: pastPending, loading: pastLoading, refetch: refetchPast } = usePastPendingAppointments(business?.id)
  const [busyDates, refetchBusyDates] = useMonthAppointments(
    business?.id,
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1
  )
  const { availability } = useAvailability(business)
  const { subscribers } = useSubscribers(business?.id)
  const { showToast } = useToast()

  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // New appointment modal
  const [newModal, setNewModal] = useState(false)
  const [modalDateStr, setModalDateStr] = useState(format(today, 'yyyy-MM-dd'))
  const [modalAppts, setModalAppts] = useState([])
  const [newForm, setNewForm] = useState({ slot_start: '', client_name: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [subscriberSearch, setSubscriberSearch] = useState('')
  const [selectedSubscriber, setSelectedSubscriber] = useState(null)
  const [showSubDropdown, setShowSubDropdown] = useState(false)

  // Cancel modal
  const [cancelModal, setCancelModal] = useState({ open: false, id: null })
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const [confirmingId, setConfirmingId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null) // for past-pending cards

  const modalDate = new Date(modalDateStr + 'T12:00:00')

  // Fetch appointments for modal date when it changes
  useEffect(() => {
    if (!newModal || !business?.id) return
    async function fetchForModal() {
      const dayStart = modalDateStr + 'T00:00:00.000Z'
      const dayEnd   = modalDateStr + 'T23:59:59.999Z'
      const { data } = await supabase
        .from('appointments')
        .select('slot_start, status')
        .eq('business_id', business.id)
        .gte('slot_start', dayStart)
        .lte('slot_start', dayEnd)
      setModalAppts(data ?? [])
    }
    fetchForModal()
  }, [newModal, modalDateStr, business?.id])

  if (!canReserve && !isSuperuser) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <CalendarDays size={48} className="text-stone-200 mb-4" />
          <h2 className="font-extrabold text-2xl text-stone-800 mb-2">Agenda y reservas</h2>
          <p className="text-stone-500 text-sm mb-6 max-w-xs">
            Activá el plan Pro para que tus clientes puedan reservar turnos online.
          </p>
          <Button onClick={() => setUpgradeOpen(true)}>Ver planes</Button>
        </div>
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} feature="reserve" />
      </>
    )
  }

  const modalSlots = availability ? getAvailableSlots(availability, modalDateStr, modalAppts) : []
  const showTomorrow = isToday(selectedDate) && view === 'day'

  function openNewModal(date) {
    const d = date ?? selectedDate
    setModalDateStr(format(d, 'yyyy-MM-dd'))
    setNewForm({ slot_start: '', client_name: '', notes: '' })
    setSubscriberSearch('')
    setSelectedSubscriber(null)
    setShowSubDropdown(false)
    setNewModal(true)
  }

  async function handleConfirm(appt) {
    setConfirmingId(appt.id)
    const { error } = await confirmAppointment(appt.id, appt.subscriber_id ?? null)
    setConfirmingId(null)
    if (error) { showToast('Error al confirmar', 'error'); return }
    showToast(appt.subscriber_id ? 'Turno confirmado y uso registrado' : 'Turno confirmado')
    refetchPast()
  }

  function openCancelModal(id) {
    setCancelReason('')
    setCancelModal({ open: true, id })
  }

  async function handleCancelConfirm() {
    setCancelling(true)
    const { error } = await cancelAppointment(cancelModal.id, cancelReason)
    setCancelling(false)
    if (error) { showToast('Error al cancelar', 'error'); return }
    setCancelModal({ open: false, id: null })
    showToast('Turno cancelado')
    refetchPast()
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newForm.slot_start || !newForm.client_name.trim()) return
    setSaving(true)
    const slotStart = new Date(modalDateStr + 'T' + newForm.slot_start + ':00')
    const slotEnd = new Date(slotStart.getTime() + (availability?.slot_duration ?? 60) * 60000)
    const { error } = await createAppointment({
      slot_start: slotStart.toISOString(),
      slot_end: slotEnd.toISOString(),
      client_name: newForm.client_name.trim(),
      subscriber_id: selectedSubscriber?.id ?? null,
      notes: newForm.notes.trim() || null,
      status: 'pending',
    })
    setSaving(false)
    if (error) { showToast('Error al crear turno', 'error'); return }
    setNewModal(false)
    showToast('Turno agregado')
    refetchBusyDates()
  }

  function DaySection({ label, appts, isLoading }) {
    const active = appts.filter(a => a.status !== 'cancelled')
    const cancelled = appts.filter(a => a.status === 'cancelled')
    const all = [...active, ...cancelled]

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{label}</p>
          {all.length > 0 && (
            <span className="text-xs text-stone-400">{active.length} turno{active.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          </div>
        ) : all.length === 0 ? (
          <div className="bg-surface rounded-2xl shadow-card px-4 py-5 text-center">
            <p className="text-sm text-stone-400">Sin turnos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {all.map(appt => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                onConfirm={() => handleConfirm(appt)}
                onCancel={() => openCancelModal(appt.id)}
                confirming={confirmingId === appt.id}
                cancelling={cancellingId === appt.id}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const selectedLabel = isToday(selectedDate)
    ? 'Hoy'
    : isTomorrow(selectedDate)
    ? 'Mañana'
    : format(selectedDate, "EEEE d 'de' MMMM", { locale: es })

  const modalLabel = format(modalDate, "d 'de' MMMM", { locale: es })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-extrabold text-3xl text-stone-900">Agenda</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/configuracion')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface shadow-card text-stone-400 hover:text-brand-600 transition-colors"
            title="Configurar agenda"
          >
            <Settings2 size={17} />
          </button>
          <Button size="sm" onClick={() => openNewModal()}>
            <Plus size={13} className="mr-1" /> Turno
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <MiniCalendar
        selected={selectedDate}
        onSelect={d => { setSelectedDate(d); setView('day') }}
        onDoubleClick={openNewModal}
        busyDates={busyDates}
        calendarMonth={calendarMonth}
        onMonthChange={setCalendarMonth}
      />

      {/* Quick jump + view toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setSelectedDate(today); setCalendarMonth(startOfMonth(today)); setView('day') }}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            view === 'day' && isToday(selectedDate)
              ? 'bg-brand-600 text-white border-brand-600'
              : 'border-stone-200 text-stone-600 hover:border-brand-300 bg-surface'
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => { const t = addDays(today, 1); setSelectedDate(t); setCalendarMonth(startOfMonth(t)); setView('day') }}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            view === 'day' && isTomorrow(selectedDate)
              ? 'bg-brand-600 text-white border-brand-600'
              : 'border-stone-200 text-stone-600 hover:border-brand-300 bg-surface'
          }`}
        >
          Mañana
        </button>
        <button
          onClick={() => setView('week')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            view === 'week'
              ? 'bg-brand-600 text-white border-brand-600'
              : 'border-stone-200 text-stone-600 hover:border-brand-300 bg-surface'
          }`}
        >
          Semana
        </button>
      </div>

      {/* Day view */}
      {view === 'day' && (
        <>
          <DaySection label={selectedLabel} appts={appointments} isLoading={loading} />
          {showTomorrow && (
            <DaySection label="Mañana" appts={tomorrowAppts} isLoading={tomorrowLoading} />
          )}
        </>
      )}

      {/* Week view */}
      {view === 'week' && (
        <div className="space-y-5">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            Semana del {format(selectedDate, "d 'de' MMMM", { locale: es })}
          </p>
          {weekLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
            </div>
          ) : (
            weekDays.map(({ dateStr: ds, date: d, appts }) => (
              <DaySection
                key={ds}
                label={format(d, "EEEE d/MM", { locale: es })}
                appts={appts}
                isLoading={false}
              />
            ))
          )}
        </div>
      )}

      {/* Past unconfirmed appointments */}
      {!pastLoading && pastPending.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">
              Turnos sin confirmar ({pastPending.length})
            </p>
          </div>
          <div className="bg-amber-50 rounded-3xl p-3 space-y-2">
            <p className="text-xs text-amber-700 px-1 mb-2">
              Estos turnos ya pasaron y siguen pendientes. Confirmálos si el cliente asistió o cancelálos si no.
            </p>
            {pastPending.map(appt => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                onConfirm={() => handleConfirm(appt)}
                onCancel={() => openCancelModal(appt.id)}
                confirming={confirmingId === appt.id}
                cancelling={cancellingId === appt.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* New appointment modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Nuevo turno">
        <form onSubmit={handleCreate} className="space-y-4">
          <DatePicker
            label="Fecha"
            value={modalDateStr}
            onChange={ds => { setModalDateStr(ds); setNewForm(p => ({ ...p, slot_start: '' })) }}
          />

          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2">Horario — {modalLabel}</p>
            {modalSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto">
                {modalSlots.map(slot => {
                  const val = format(slot.start, 'HH:mm')
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setNewForm(p => ({ ...p, slot_start: val }))}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                        newForm.slot_start === val
                          ? 'bg-brand-50 border-brand-400 text-brand-700'
                          : 'border-transparent bg-surface-tint text-stone-600 hover:border-stone-200'
                      }`}
                    >
                      {val}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  type="time"
                  value={newForm.slot_start}
                  onChange={e => setNewForm(p => ({ ...p, slot_start: e.target.value }))}
                  className="flex-1 bg-surface-tint rounded-2xl px-3 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  required
                />
                {availability && (
                  <p className="text-xs text-stone-400">Día sin disponibilidad configurada</p>
                )}
              </div>
            )}
          </div>

          {/* Subscriber picker */}
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-1.5">Suscriptor (opcional)</p>
            {selectedSubscriber ? (
              <div className="flex items-center gap-2 bg-brand-50 rounded-2xl px-3 py-2.5">
                <UserCheck size={14} className="text-brand-600 shrink-0" />
                <span className="flex-1 text-sm font-semibold text-brand-700">{selectedSubscriber.name}</span>
                <span className="text-xs text-brand-500">{selectedSubscriber.uses_remaining} usos</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubscriber(null)
                    setSubscriberSearch('')
                    setNewForm(p => ({ ...p, client_name: '' }))
                  }}
                  className="text-brand-400 hover:text-brand-600 ml-1"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={subscriberSearch}
                  onChange={e => { setSubscriberSearch(e.target.value); setShowSubDropdown(true) }}
                  onFocus={() => setShowSubDropdown(true)}
                  placeholder="Buscar por nombre..."
                  className="w-full bg-surface-tint rounded-2xl px-3 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                {showSubDropdown && subscriberSearch.trim().length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-surface rounded-2xl shadow-lg border border-stone-100 overflow-hidden">
                    {subscribers
                      .filter(s => s.name.toLowerCase().includes(subscriberSearch.toLowerCase()))
                      .slice(0, 5)
                      .map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={() => {
                            setSelectedSubscriber(s)
                            setNewForm(p => ({ ...p, client_name: s.name }))
                            setShowSubDropdown(false)
                            setSubscriberSearch('')
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-brand-50 transition-colors"
                        >
                          <UserCheck size={13} className="text-brand-500 shrink-0" />
                          <span className="flex-1 text-sm font-medium text-stone-800">{s.name}</span>
                          <span className="text-xs text-stone-400">{s.uses_remaining} usos</span>
                        </button>
                      ))
                    }
                    {subscribers.filter(s => s.name.toLowerCase().includes(subscriberSearch.toLowerCase())).length === 0 && (
                      <p className="px-3 py-2.5 text-sm text-stone-400">Sin resultados</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <Input
            label="Nombre del cliente"
            value={newForm.client_name}
            onChange={e => setNewForm(p => ({ ...p, client_name: e.target.value }))}
            placeholder="Ej: María García"
            required
          />
          <Textarea
            label="Notas (opcional)"
            value={newForm.notes}
            onChange={e => setNewForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Color, largo, servicio..."
          />
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => setNewModal(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">Agregar</Button>
          </div>
        </form>
      </Modal>

      {/* Cancel reason modal */}
      <Modal open={cancelModal.open} onClose={() => setCancelModal({ open: false, id: null })} title="Cancelar turno">
        <div className="space-y-4">
          <p className="text-sm text-stone-500">¿Por qué cancelás este turno? (opcional)</p>
          <textarea
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Ej: El cliente avisó que no puede venir..."
            rows={3}
            className="w-full bg-surface-tint rounded-2xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none border-0"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCancelModal({ open: false, id: null })} className="flex-1">
              Volver
            </Button>
            <button
              onClick={handleCancelConfirm}
              disabled={cancelling}
              className="flex-1 py-2.5 rounded-full text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelando…' : 'Confirmar cancelación'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function AppointmentCard({ appt, onConfirm, onCancel, confirming, cancelling }) {
  const time = format(new Date(appt.slot_start), 'HH:mm')
  const timeEnd = format(new Date(appt.slot_end), 'HH:mm')
  const isSubscriber = !!appt.subscriber_id
  const isPending = appt.status === 'pending'
  const isConfirmed = appt.status === 'confirmed'
  const isCancelled = appt.status === 'cancelled'

  return (
    <div className={`bg-surface rounded-2xl shadow-card overflow-hidden ${isCancelled ? 'opacity-50' : ''}`}>
      <div className="flex items-stretch">
        <div className={`flex flex-col items-center justify-center px-4 py-4 min-w-[72px] ${
          isConfirmed ? 'bg-emerald-50' : isCancelled ? 'bg-stone-50' : 'bg-brand-50'
        }`}>
          <p className={`font-extrabold text-lg leading-none ${
            isConfirmed ? 'text-emerald-700' : isCancelled ? 'text-stone-400' : 'text-brand-700'
          }`}>{time}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">{timeEnd}</p>
        </div>

        <div className="flex-1 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            {isSubscriber
              ? <UserCheck size={13} className="text-brand-500 shrink-0" />
              : <User size={13} className="text-stone-400 shrink-0" />
            }
            <p className={`font-bold text-stone-900 text-sm leading-tight ${isCancelled ? 'line-through' : ''}`}>
              {appt.client_name}
            </p>
          </div>
          {isSubscriber && appt.subscribers?.name && (
            <p className="text-xs text-brand-600 mb-0.5">Suscriptor · {appt.subscribers.uses_remaining} usos restantes</p>
          )}
          {appt.notes && <p className="text-xs text-stone-400 leading-relaxed">{appt.notes}</p>}

          {isConfirmed && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
              <Check size={9} /> Confirmado{appt.use_logged ? ' · uso registrado' : ''}
            </span>
          )}
          {isCancelled && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-stone-400 bg-stone-100 rounded-full px-2 py-0.5">
              <X size={9} /> Cancelado{appt.cancel_reason ? ` · ${appt.cancel_reason}` : ''}
            </span>
          )}
        </div>

        {isPending && (
          <div className="flex flex-col gap-1 items-center justify-center px-3 py-3">
            <button
              onClick={onConfirm}
              disabled={confirming}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors disabled:opacity-50"
              title="Confirmar"
            >
              {confirming ? <span className="text-[10px]">...</span> : <Check size={14} />}
            </button>
            <button
              onClick={onCancel}
              disabled={cancelling}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-stone-300 hover:text-red-500 transition-colors disabled:opacity-50"
              title="Cancelar"
            >
              {cancelling ? <span className="text-[10px]">...</span> : <X size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
