import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export function getAvailableSlots(availabilityBlocks, dateStr, existingAppointments) {
  if (!availabilityBlocks) return []
  const blocks = Array.isArray(availabilityBlocks) ? availabilityBlocks : [availabilityBlocks]
  if (!blocks.length) return []

  const date = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = date.getDay()
  const appts = (existingAppointments ?? []).filter(a => a.status !== 'cancelled')

  const allSlots = []
  for (const block of blocks) {
    if (!block.days_of_week?.includes(dayOfWeek)) continue

    const capacity = block.slot_capacity ?? 1
    const [startH, startM] = block.start_time.split(':').map(Number)
    const [endH, endM] = block.end_time.split(':').map(Number)
    const blockStart = new Date(date); blockStart.setHours(startH, startM, 0, 0)
    const blockEnd   = new Date(date); blockEnd.setHours(endH, endM, 0, 0)

    if (block.simple_shift) {
      // One slot covering the entire block — count all bookings that fall within it
      const booked = appts.filter(a => {
        const s = new Date(a.slot_start)
        return s >= blockStart && s < blockEnd
      }).length
      if (booked < capacity) {
        allSlots.push({
          start: blockStart,
          end: blockEnd,
          blockName: block.block_name || null,
          isSimpleShift: true,
        })
      }
    } else {
      // Granular slots — existing logic
      const bookedCount = {}
      for (const a of appts) {
        const key = new Date(a.slot_start).toISOString()
        bookedCount[key] = (bookedCount[key] || 0) + 1
      }
      let current = new Date(blockStart)
      while (current < blockEnd) {
        const slotStart = new Date(current)
        const slotEnd = new Date(current.getTime() + block.slot_duration * 60000)
        if ((bookedCount[slotStart.toISOString()] ?? 0) < capacity) {
          allSlots.push({ start: slotStart, end: slotEnd, blockName: block.block_name || null, isSimpleShift: false })
        }
        current = slotEnd
      }
    }
  }

  return allSlots.sort((a, b) => a.start - b.start)
}

export function useAppointments(businessId, date) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAppointments = useCallback(async () => {
    if (!businessId) { setLoading(false); return }
    setLoading(true)
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd')
    const dayStart = dateStr + 'T00:00:00.000Z'
    const dayEnd   = dateStr + 'T23:59:59.999Z'
    const { data } = await supabase
      .from('appointments')
      .select('*, subscribers(name, uses_remaining)')
      .eq('business_id', businessId)
      .gte('slot_start', dayStart)
      .lte('slot_start', dayEnd)
      .order('slot_start')
    setAppointments(data ?? [])
    setLoading(false)
  }, [businessId, date])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  async function createAppointment(payload) {
    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...payload, business_id: businessId })
      .select()
      .single()
    if (!error) setAppointments(prev => [...prev, data].sort((a, b) => new Date(a.slot_start) - new Date(b.slot_start)))
    return { data, error }
  }

  async function confirmAppointment(id, subscriberId) {
    // Update appointment status
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'confirmed', use_logged: !!subscriberId })
      .eq('id', id)
    if (error) return { error }

    // Deduct use if subscriber
    if (subscriberId) {
      await supabase.from('usage_logs').insert({
        subscriber_id: subscriberId,
        business_id: businessId,
        used_at: new Date().toISOString(),
        notes: 'Turno confirmado desde agenda',
      })
      const { data: sub } = await supabase
        .from('subscribers')
        .select('uses_remaining')
        .eq('id', subscriberId)
        .single()
      if (sub) {
        const newUses = Math.max(0, (sub.uses_remaining ?? 0) - 1)
        await supabase
          .from('subscribers')
          .update({ uses_remaining: newUses, status: newUses === 0 ? 'no_uses' : sub.status })
          .eq('id', subscriberId)
      }
    }

    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed', use_logged: !!subscriberId } : a))
    return { error: null }
  }

  async function cancelAppointment(id, reason) {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', cancel_reason: reason || null })
      .eq('id', id)
    if (!error) setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled', cancel_reason: reason || null } : a))
    return { error }
  }

  return { appointments, loading, refetch: fetchAppointments, createAppointment, confirmAppointment, cancelAppointment }
}

// Hook for dashboard: fetch today + tomorrow appointments in one query
export function useTodayTomorrowAppointments(businessId) {
  const [todayAppts, setTodayAppts] = useState([])
  const [tomorrowAppts, setTomorrowAppts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!businessId) { setLoading(false); return }
      const today = new Date()
      const todayStr = format(today, 'yyyy-MM-dd')
      const tomorrowStr = format(new Date(today.getTime() + 86400000), 'yyyy-MM-dd')
      const { data } = await supabase
        .from('appointments')
        .select('id, slot_start, slot_end, client_name, status, subscriber_id')
        .eq('business_id', businessId)
        .neq('status', 'cancelled')
        .gte('slot_start', todayStr + 'T00:00:00.000Z')
        .lte('slot_start', tomorrowStr + 'T23:59:59.999Z')
        .order('slot_start')
      const all = data ?? []
      setTodayAppts(all.filter(a => a.slot_start.startsWith(todayStr)))
      setTomorrowAppts(all.filter(a => a.slot_start.startsWith(tomorrowStr)))
      setLoading(false)
    }
    load()
  }, [businessId])

  return { todayAppts, tomorrowAppts, loading }
}

// Hook that returns which dates in a month have appointments (for calendar dots)
export function useMonthAppointments(businessId, year, month) {
  const [dates, setDates] = useState([]) // array of 'yyyy-MM-dd' strings

  const load = useCallback(async () => {
    if (!businessId) return
    const mm = String(month).padStart(2, '0')
    const lastDay = new Date(year, month, 0).getDate()
    const { data } = await supabase
      .from('appointments')
      .select('slot_start')
      .eq('business_id', businessId)
      .neq('status', 'cancelled')
      .gte('slot_start', `${year}-${mm}-01T00:00:00.000Z`)
      .lte('slot_start', `${year}-${mm}-${lastDay}T23:59:59.999Z`)
    const unique = [...new Set((data ?? []).map(a => a.slot_start.slice(0, 10)))]
    setDates(unique)
  }, [businessId, year, month])

  useEffect(() => { load() }, [load])

  return [dates, load]
}

// Hook: pending appointments from the past (not yet confirmed or cancelled)
export function usePastPendingAppointments(businessId) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!businessId) { setLoading(false); return }
    const now = new Date().toISOString()
    const { data } = await supabase
      .from('appointments')
      .select('*, subscribers(name, uses_remaining)')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .lt('slot_start', now)
      .order('slot_start', { ascending: false })
    setAppointments(data ?? [])
    setLoading(false)
  }, [businessId])

  useEffect(() => { refetch() }, [refetch])

  return { appointments, loading, refetch }
}

// Hook: fetch all appointments for a week (Mon–Sun of the week containing weekStart)
// weekStart must be a 'yyyy-MM-dd' string (not a Date object) to avoid infinite loop
export function useWeekAppointments(businessId, weekStart) {
  const [byDay, setByDay] = useState([]) // array of { dateStr, label, appts }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!businessId || !weekStart) { setLoading(false); return }
      setLoading(true)
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart + 'T00:00:00')
        d.setDate(d.getDate() + i)
        return d
      })
      const start = days[0]
      const end   = days[6]
      const { data } = await supabase
        .from('appointments')
        .select('*, subscribers(name, uses_remaining)')
        .eq('business_id', businessId)
        .gte('slot_start', format(start, 'yyyy-MM-dd') + 'T00:00:00.000Z')
        .lte('slot_start', format(end,   'yyyy-MM-dd') + 'T23:59:59.999Z')
        .order('slot_start')
      const all = data ?? []
      setByDay(days.map(d => {
        const ds = format(d, 'yyyy-MM-dd')
        return { dateStr: ds, date: d, appts: all.filter(a => a.slot_start.startsWith(ds)) }
      }))
      setLoading(false)
    }
    load()
  }, [businessId, weekStart])

  return { byDay, loading }
}

// Hook for public booking page (no auth)
export function usePublicAvailability(slug) {
  const [business, setBusiness] = useState(null)
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      if (!slug) return
      const { data: biz } = await supabase
        .from('businesses')
        .select('id, name, category, slug, agenda_enabled, phone')
        .eq('slug', slug)
        .maybeSingle()
      if (!biz) { setNotFound(true); setLoading(false); return }
      setBusiness(biz)

      const { data: avail } = await supabase
        .from('business_availability')
        .select('*')
        .eq('business_id', biz.id)
        .order('id')
      setAvailability(avail ?? [])
      setLoading(false)
    }
    load()
  }, [slug])

  async function getBookedSlots(businessId, dateStr) {
    const { data } = await supabase
      .rpc('public_get_booked_slots', { p_business_id: businessId, p_date: dateStr })
    return data ?? []
  }

  async function lookupSubscriber(businessId, dni) {
    if (!dni) return null
    const clean = dni.replace(/\D/g, '')
    const { data } = await supabase
      .rpc('public_lookup_subscriber', { p_business_id: businessId, p_dni: clean })
    return data?.[0] ?? null
  }

  async function checkExistingBooking(businessId, subscriberId) {
    const { data } = await supabase
      .rpc('public_check_existing_booking', { p_business_id: businessId, p_subscriber_id: subscriberId })
    return data?.[0] ?? null
  }

  async function cancelPublicAppointment(appointmentId, subscriberId) {
    const { error } = await supabase
      .rpc('public_cancel_appointment', { p_appointment_id: appointmentId, p_subscriber_id: subscriberId })
    return { error }
  }

  async function bookAppointment(payload) {
    const { data, error } = await supabase
      .rpc('public_book_appointment', {
        p_business_id: payload.business_id,
        p_subscriber_id: payload.subscriber_id ?? null,
        p_slot_start: payload.slot_start,
        p_slot_end: payload.slot_end,
        p_client_name: payload.client_name,
        p_client_dni: payload.client_dni ?? null,
        p_notes: payload.notes ?? null,
      })
    return { data: data ? { id: data } : null, error }
  }

  return { business, availability, loading, notFound, getBookedSlots, lookupSubscriber, checkExistingBooking, cancelPublicAppointment, bookAppointment }
}
