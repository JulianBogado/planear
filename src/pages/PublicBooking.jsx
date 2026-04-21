import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { addDays, format, isToday, startOfDay, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, CheckCircle2, AlertCircle, UserCheck, User } from 'lucide-react'
import { usePublicAvailability, getAvailableSlots } from '../hooks/useAppointments'
import MiniCalendar from '../components/ui/MiniCalendar'
import Button from '../components/ui/Button'

const STEPS = { DNI: 0, WARN: 1, DATE: 2, SLOT: 3, FORM: 4, SUCCESS: 5, EXPIRED: 6 }

export default function PublicBooking() {
  const { slug } = useParams()
  const { business, availability, loading, notFound, getBookedSlots, lookupSubscriber, checkExistingBooking, cancelPublicAppointment, bookAppointment } = usePublicAvailability(slug)

  const [step, setStep] = useState(STEPS.DNI)

  // Step 0 — DNI gate
  const [dniInput, setDniInput] = useState('')
  const [dniChecking, setDniChecking] = useState(false)
  const [dniError, setDniError] = useState('')
  const [subscriber, setSubscriber] = useState(null)
  const [guestMode, setGuestMode] = useState(false)
  const [expiredSubscriber, setExpiredSubscriber] = useState(null)

  // Step 1 — existing booking warning
  const [existingBooking, setExistingBooking] = useState(null)
  const [shouldCancelExisting, setShouldCancelExisting] = useState(false)

  // Steps 2-4
  const today = startOfDay(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(today))
  const [bookedSlots, setBookedSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [form, setForm] = useState({ name: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Build selectable dates array
  const advance = availability?.[0]?.advance_days ?? 7
  const selectableDates = []
  for (let i = 0; i < advance; i++) {
    const d = addDays(today, i)
    if (!availability?.length || availability.some(b => b.days_of_week?.includes(d.getDay()))) {
      selectableDates.push(format(d, 'yyyy-MM-dd'))
    }
  }

  // --- Handlers ---

  async function handleDniSubmit(e) {
    e.preventDefault()
    if (!business) return
    setDniError('')
    setDniChecking(true)
    const sub = await lookupSubscriber(business.id, dniInput)
    if (!sub) {
      setDniChecking(false)
      setDniError('No encontramos ningún suscriptor activo con ese DNI.')
      return
    }
    if (sub.status !== 'active' && sub.status !== 'expiring_soon') {
      setDniChecking(false)
      setExpiredSubscriber(sub)
      setStep(STEPS.EXPIRED)
      return
    }
    // Check for existing upcoming booking
    const existing = await checkExistingBooking(business.id, sub.id)
    setDniChecking(false)
    setSubscriber(sub)
    setForm(p => ({ ...p, name: sub.name }))
    if (existing) {
      setExistingBooking(existing)
      setStep(STEPS.WARN)
    } else {
      setStep(STEPS.DATE)
    }
  }

  function handleContinueAsGuest() {
    if (!business?.allow_guest_bookings) return
    setGuestMode(true)
    setSubscriber(null)
    setStep(STEPS.DATE)
  }

  async function handleSelectDate(date) {
    setSelectedDate(date)
    const booked = await getBookedSlots(business.id, format(date, 'yyyy-MM-dd'))
    setBookedSlots(booked)
    setStep(STEPS.SLOT)
  }

  function handleSelectSlot(slot) {
    setSelectedSlot(slot)
    setStep(STEPS.FORM)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !selectedSlot) return
    setSubmitting(true)
    setSubmitError('')
    const { error } = await bookAppointment({
      business_id: business.id,
      subscriber_id: subscriber?.id ?? null,
      slot_start: selectedSlot.start.toISOString(),
      slot_end: selectedSlot.end.toISOString(),
      client_name: form.name.trim(),
      client_dni: dniInput.replace(/\D/g, '') || null,
      notes: form.notes.trim() || null,
      status: 'pending',
    })
    setSubmitting(false)
    if (error) {
      const isSlotFull = error.message?.includes('slot_full') || error.code === 'P0001'
      setSubmitError(isSlotFull
        ? 'Este horario ya no tiene cupos disponibles. Elegí otro.'
        : 'Ocurrió un error al reservar. Intentá de nuevo.')
      return
    }
    if (shouldCancelExisting && existingBooking && subscriber) {
      await cancelPublicAppointment(existingBooking.id, subscriber.id)
    }
    setStep(STEPS.SUCCESS)
  }

  const availableSlots = availability?.length && selectedDate
    ? getAvailableSlots(availability, format(selectedDate, 'yyyy-MM-dd'), bookedSlots)
    : []
  const simpleShifts = availableSlots.filter(s => s.isSimpleShift)
  const granularSlots = availableSlots.filter(s => !s.isSimpleShift)

  // --- Loading / not found / disabled ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8f5' }}>
        <div className="w-8 h-8 border-4 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <PublicShell>
        <AlertCircle size={48} className="text-stone-300 mb-4 mx-auto" />
        <h1 className="font-extrabold text-2xl text-stone-800 mb-2">Negocio no encontrado</h1>
        <p className="text-stone-400 text-sm">El enlace que recibiste no es válido.</p>
      </PublicShell>
    )
  }

  if (business?.agenda_enabled === false) {
    return (
      <PublicShell business={business}>
        <AlertCircle size={48} className="text-amber-300 mb-4 mx-auto" />
        <h1 className="font-extrabold text-xl text-stone-800 mb-2">Reservas desactivadas</h1>
        <p className="text-stone-400 text-sm">Las reservas online están temporalmente desactivadas. Contactate con el negocio.</p>
      </PublicShell>
    )
  }

  if (!availability?.length) {
    return (
      <PublicShell business={business}>
        <AlertCircle size={48} className="text-stone-300 mb-4 mx-auto" />
        <h1 className="font-extrabold text-xl text-stone-800 mb-2">Sin disponibilidad configurada</h1>
        <p className="text-stone-400 text-sm">Este negocio todavía no configuró su agenda.</p>
      </PublicShell>
    )
  }

  // --- Render ---

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf8f5' }}>
      <div className="max-w-md mx-auto px-4 py-10">

        {/* Brand */}
        <div className="text-center mb-8">
          <p className="font-extrabold text-2xl text-stone-900 mb-0.5">{business.name}</p>
          <p className="text-sm text-stone-400">Reservá tu turno</p>
        </div>

        {/* Subscriber/guest banner (steps 1+) */}
        {step > STEPS.DNI && step < STEPS.SUCCESS && subscriber && (
          <div className="bg-emerald-50 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
            <UserCheck size={16} className="text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800">{subscriber.name}</p>
              <p className="text-xs text-emerald-600">{subscriber.uses_remaining} usos restantes</p>
            </div>
          </div>
        )}
        {step > STEPS.DNI && step < STEPS.SUCCESS && guestMode && (
          <div className="bg-stone-100 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
            <User size={16} className="text-stone-500 shrink-0" />
            <p className="text-sm text-stone-600 font-medium">Reservando sin suscripción</p>
          </div>
        )}

        {/* Step 0 — DNI gate */}
        {step === STEPS.DNI && (
          <div className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
            <div>
              <h2 className="font-bold text-stone-800 text-lg mb-1">¿Sos suscriptor?</h2>
              <p className="text-sm text-stone-400">Ingresá tu DNI para verificar tu suscripción.</p>
            </div>
            <form onSubmit={handleDniSubmit} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                value={dniInput}
                onChange={e => { setDniInput(e.target.value); setDniError('') }}
                placeholder="Ej: 35123456"
                className="w-full bg-stone-50 rounded-2xl px-4 py-3 text-sm border-2 border-transparent focus:border-brand-400 focus:outline-none transition-colors"
                autoFocus
              />
              {dniError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{dniError}</p>
              )}
              <Button type="submit" loading={dniChecking} disabled={!dniInput.trim()} className="w-full">
                Verificar DNI
              </Button>
            </form>
{/*             <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-stone-400">o</span>
              </div>
            </div> */}
            {business?.allow_guest_bookings && (
              <button
                onClick={handleContinueAsGuest}
                className="w-full py-2.5 rounded-2xl border-2 border-stone-200 text-sm font-semibold text-stone-600 hover:border-stone-300 transition-colors"
              >
                Reservar sin suscripción
              </button>
            )}
          </div>
        )}

        {/* Step EXPIRED — subscription not active */}
        {step === STEPS.EXPIRED && expiredSubscriber && (
          <div className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
                <AlertCircle size={28} className="text-amber-500" />
              </div>
              <div>
                <h2 className="font-bold text-stone-800 text-lg">Tu suscripción no está activa</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Hola {expiredSubscriber.name},{' '}
                  {expiredSubscriber.uses_remaining <= 0
                    ? 'ya no te quedan usos disponibles.'
                    : 'tu plan está vencido.'}
                </p>
                <p className="text-sm text-stone-400 mt-1">
                  Para realizar una reserva, contactate con el negocio.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {business?.phone && (
                <a
                  href={`https://wa.me/${business.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.523 5.828L.057 23.885a.5.5 0 00.611.611l6.057-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.504-5.254-1.387l-.376-.217-3.898.943.943-3.898-.217-.376A9.959 9.959 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  Contactar al negocio por WhatsApp
                </a>
              )}
              {business?.allow_guest_bookings && (
                <button
                  onClick={handleContinueAsGuest}
                  className="w-full py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-sm font-semibold text-stone-700 transition-colors"
                >
                  Reservar sin suscripción
                </button>
              )}
              <button
                onClick={() => { setExpiredSubscriber(null); setDniInput(''); setDniError(''); setStep(STEPS.DNI) }}
                className="w-full py-2.5 text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                Ingresar otro DNI
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — Existing booking warning */}
        {step === STEPS.WARN && existingBooking && (
          <div className={`rounded-3xl shadow-sm p-6 space-y-5 ${subscriber?.uses_remaining === 1 ? 'bg-red-50' : 'bg-amber-50'}`}>
            <div className="flex flex-col items-center text-center gap-3">
              <AlertCircle size={40} className={subscriber?.uses_remaining === 1 ? 'text-red-400' : 'text-amber-400'} />
              {subscriber?.uses_remaining === 1 ? (
                <>
                  <h2 className="font-bold text-stone-800 text-lg">Ya tenés un turno reservado</h2>
                  <p className="text-sm text-stone-600">
                    Tenés un turno para el{' '}
                    <span className="font-semibold">
                      {format(new Date(existingBooking.slot_start), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                    </span>
                    {' '}y solo te queda 1 uso. Si reservás otro turno, este se cancelará automáticamente.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-bold text-stone-800 text-lg">Ya tenés una reserva</h2>
                  <p className="text-sm text-stone-600">
                    Tenés un turno para el{' '}
                    <span className="font-semibold">
                      {format(new Date(existingBooking.slot_start), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                    </span>
                    . ¿Querés reservar otro turno de todos modos?
                  </p>
                </>
              )}
            </div>
            <div className="space-y-2">
              {subscriber?.uses_remaining === 1 ? (
                <Button
                  className="w-full"
                  onClick={() => { setShouldCancelExisting(true); setStep(STEPS.DATE) }}
                >
                  Reemplazar reserva
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => setStep(STEPS.DATE)}
                >
                  Sí, reservar otro turno
                </Button>
              )}
              <button
                onClick={() => { setSubscriber(null); setExistingBooking(null); setStep(STEPS.DNI) }}
                className="w-full py-2.5 rounded-2xl border-2 border-stone-200 text-sm font-semibold text-stone-600 hover:border-stone-300 transition-colors bg-white"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Select date via mini calendar */}
        {step === STEPS.DATE && (
          <div className="space-y-4">
            <h2 className="font-bold text-stone-800 text-lg">Elegí un día</h2>
            <MiniCalendar
              selected={selectedDate}
              onSelect={date => {
                const ds = format(date, 'yyyy-MM-dd')
                if (selectableDates.includes(ds)) handleSelectDate(date)
              }}
              calendarMonth={calendarMonth}
              onMonthChange={setCalendarMonth}
              selectableDates={selectableDates}
            />
            <p className="text-xs text-center text-stone-400">
              Tocá un día disponible para ver los horarios
            </p>
          </div>
        )}

        {/* Step 3 — Select slot */}
        {step === STEPS.SLOT && (
          <div>
            <button onClick={() => setStep(STEPS.DATE)} className="text-sm text-stone-400 hover:text-stone-600 mb-4 flex items-center gap-1">
              ← Volver
            </button>
            <h2 className="font-bold text-stone-800 text-lg mb-1 flex items-center gap-2">
              <Clock size={18} className="text-brand-600" /> Elegí un horario
            </h2>
            <p className="text-sm text-stone-400 mb-4 capitalize">
              {isToday(selectedDate) ? 'Hoy' : format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </p>
            {availableSlots.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 text-center text-stone-400 text-sm">
                No hay turnos disponibles para este día.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Turnos simples — cards grandes */}
                {simpleShifts.length > 0 && (
                  <div className="space-y-2">
                    {simpleShifts.map(slot => (
                      <button
                        key={slot.start.toISOString()}
                        onClick={() => handleSelectSlot(slot)}
                        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 bg-white transition-all text-left hover:border-brand-300 active:scale-[0.98] border-stone-100 shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-stone-900 text-sm">
                            {slot.blockName ?? `${format(slot.start, 'HH:mm')} – ${format(slot.end, 'HH:mm')}`}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            De {format(slot.start, 'HH:mm')} a {format(slot.end, 'HH:mm')}
                          </p>
                        </div>
                        <span className="text-brand-500 text-lg font-bold">›</span>
                      </button>
                    ))}
                  </div>
                )}
                {/* Slots granulares — grilla de horarios */}
                {granularSlots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {granularSlots.map(slot => (
                      <button
                        key={slot.start.toISOString()}
                        onClick={() => handleSelectSlot(slot)}
                        className="bg-white rounded-2xl shadow-sm py-3.5 text-center hover:shadow-md transition-all hover:border-brand-300 border-2 border-transparent active:scale-95"
                      >
                        <p className="font-bold text-stone-900">{format(slot.start, 'HH:mm')}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4 — Form */}
        {step === STEPS.FORM && (
          <div>
            <button onClick={() => setStep(STEPS.SLOT)} className="text-sm text-stone-400 hover:text-stone-600 mb-4 flex items-center gap-1">
              ← Volver
            </button>
            <h2 className="font-bold text-stone-800 text-lg mb-1">Confirmá tu reserva</h2>
            <div className="mb-5">
              {selectedSlot?.isSimpleShift ? (
                <div>
                  <p className="text-sm font-semibold text-stone-700">
                    {isToday(selectedDate) ? 'Hoy' : format(selectedDate, "d/MM", { locale: es })}
                    {selectedSlot.blockName ? ` · ${selectedSlot.blockName}` : ''}
                  </p>
                  <p className="text-sm text-stone-400">
                    Te esperamos de {format(selectedSlot.start, 'HH:mm')} a {format(selectedSlot.end, 'HH:mm')}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-stone-400">
                  {isToday(selectedDate) ? 'Hoy' : format(selectedDate, "d/MM", { locale: es })} · {format(selectedSlot.start, 'HH:mm')} – {format(selectedSlot.end, 'HH:mm')}
                </p>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Tu nombre completo"
                  required
                  className="w-full bg-white rounded-2xl px-4 py-3 text-sm border-2 border-transparent focus:border-brand-400 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Notas (opcional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="¿Algo que quieras aclarar?"
                  rows={3}
                  className="w-full bg-white rounded-2xl px-4 py-3 text-sm border-2 border-transparent focus:border-brand-400 focus:outline-none transition-colors resize-none"
                />
              </div>
              {submitError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2.5">{submitError}</p>
              )}
              <Button type="submit" loading={submitting} className="w-full">
                Confirmar reserva
              </Button>
            </form>
          </div>
        )}

        {/* Step 5 — Success */}
        {step === STEPS.SUCCESS && (
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center space-y-4">
            <CheckCircle2 size={52} className="text-emerald-500 mx-auto" />
            <h2 className="font-extrabold text-2xl text-stone-900">¡Turno reservado!</h2>
            <div className="bg-stone-50 rounded-2xl p-4 text-left space-y-2">
              <p className="text-sm text-stone-600">
                <span className="font-semibold">Fecha:</span>{' '}
                {isToday(selectedDate) ? 'Hoy' : format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-sm text-stone-600">
                <span className="font-semibold">Horario:</span>{' '}
                {selectedSlot?.isSimpleShift
                  ? `${selectedSlot.blockName ? selectedSlot.blockName + ' · ' : ''}De ${format(selectedSlot.start, 'HH:mm')} a ${format(selectedSlot.end, 'HH:mm')}`
                  : `${format(selectedSlot.start, 'HH:mm')} – ${format(selectedSlot.end, 'HH:mm')}`
                }
              </p>
              <p className="text-sm text-stone-600">
                <span className="font-semibold">Nombre:</span> {form.name}
              </p>
            </div>
            <p className="text-xs text-stone-400">
              Te esperamos. Si necesitás cancelar, contactate con el negocio.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

function PublicShell({ business, children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#faf8f5' }}>
      {business && <p className="font-extrabold text-xl text-stone-900 mb-6">{business.name}</p>}
      {children}
    </div>
  )
}
