import { useState, useEffect, useCallback } from 'react'
import { addDays, format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { computeStatus } from '../utils/status'

const PLANS_SELECT = 'name, total_uses, duration_days, price'

function withStatus(subscriber) {
  const { status } = computeStatus(subscriber.end_date, subscriber.uses_remaining)
  return { ...subscriber, status }
}

export function useSubscribers(businessId) {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSubscribers = useCallback(async () => {
    if (!businessId) {
      setSubscribers([])
      setLoading(false)
      return
    }
    setLoading(true)

    const [{ data: subs }, { data: lastUsed }, { data: nextAppts }] = await Promise.all([
      supabase
        .from('subscribers')
        .select(`*, plans(${PLANS_SELECT})`)
        .eq('business_id', businessId)
        .order('name', { ascending: true }),
      supabase
        .from('usage_logs')
        .select('subscriber_id, used_at')
        .eq('business_id', businessId)
        .is('deleted_at', null)
        .order('used_at', { ascending: false })
        .limit(500),
      supabase
        .from('appointments')
        .select('subscriber_id, slot_start')
        .eq('business_id', businessId)
        .neq('status', 'cancelled')
        .gte('slot_start', new Date().toISOString())
        .order('slot_start', { ascending: true }),
    ])

    const lastUsedMap = {}
    for (const row of lastUsed ?? []) {
      if (!lastUsedMap[row.subscriber_id]) lastUsedMap[row.subscriber_id] = row.used_at
    }
    const nextApptMap = {}
    for (const row of nextAppts ?? []) {
      if (!nextApptMap[row.subscriber_id]) nextApptMap[row.subscriber_id] = row.slot_start
    }

    setSubscribers((subs ?? []).map(s => withStatus({
      ...s,
      last_used_at:     lastUsedMap[s.id] ?? null,
      next_appointment: nextApptMap[s.id] ?? null,
    })))
    setLoading(false)
  }, [businessId])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  async function createSubscriber(subData) {
    const plan = subData._plan
    const startDate = subData.start_date || format(new Date(), 'yyyy-MM-dd')
    const endDate = format(addDays(new Date(startDate + 'T00:00:00'), plan.duration_days), 'yyyy-MM-dd')
    const usesRemaining = plan.total_uses
    const { status } = computeStatus(endDate, usesRemaining)

    const insertData = {
      business_id: businessId,
      plan_id: subData.plan_id,
      name: subData.name,
      phone: subData.phone || null,
      dni: subData.dni || null,
      email: subData.email?.trim() || null,
      notes: subData.notes || null,
      start_date: startDate,
      end_date: endDate,
      uses_remaining: usesRemaining,
      status,
    }

    const { data, error } = await supabase
      .from('subscribers')
      .insert(insertData)
      .select(`*, plans(${PLANS_SELECT})`)
      .single()

    if (!error) {
      setSubscribers(prev => [...prev, withStatus(data)].sort((a, b) => a.name.localeCompare(b.name)))
      const amount = parseFloat(subData.amount)
      if (amount > 0) {
        await supabase.from('payments').insert({
          subscriber_id: data.id,
          amount,
          paid_at: new Date().toISOString(),
        })
      }
    }
    return { data, error }
  }

  async function updateSubscriber(id, updates) {
    const { data, error } = await supabase
      .from('subscribers')
      .update(updates)
      .eq('id', id)
      .select(`*, plans(${PLANS_SELECT})`)
      .single()
    if (!error) setSubscribers(prev => prev.map(s => s.id === id ? withStatus(data) : s))
    return { data, error }
  }

  async function deleteSubscriber(id) {
    const { error } = await supabase.from('subscribers').delete().eq('id', id)
    if (!error) setSubscribers(prev => prev.filter(s => s.id !== id))
    return { error }
  }

  async function registerUse(subscriber, notes = null) {
    const newUses = subscriber.uses_remaining - 1
    const { status } = computeStatus(subscriber.end_date, newUses)

    const logData = { subscriber_id: subscriber.id, business_id: businessId }
    if (notes?.trim()) logData.notes = notes.trim()

    const [{ data, error }] = await Promise.all([
      supabase
        .from('subscribers')
        .update({ uses_remaining: newUses, status })
        .eq('id', subscriber.id)
        .select(`*, plans(${PLANS_SELECT})`)
        .single(),
      supabase.from('usage_logs').insert(logData),
    ])

    if (!error) {
      const now = new Date().toISOString()
      setSubscribers(prev => prev.map(s => s.id === subscriber.id
        ? withStatus({ ...data, last_used_at: now, next_appointment: s.next_appointment })
        : s
      ))
    }
    return { data, error }
  }

  async function renewSubscriber(subscriber, amount, newPlan = null) {
    const today = format(new Date(), 'yyyy-MM-dd')
    const plan = newPlan ?? subscriber.plans
    const durationDays = plan?.duration_days ?? 30
    const totalUses = plan?.total_uses ?? 1
    const newEndDate = format(addDays(new Date(today + 'T00:00:00'), durationDays), 'yyyy-MM-dd')
    const { status } = computeStatus(newEndDate, totalUses)

    const updates = {
      start_date: today,
      end_date: newEndDate,
      uses_remaining: totalUses,
      status,
    }

    if (newPlan && newPlan.id !== subscriber.plan_id) {
      updates.plan_id = newPlan.id
    }

    const ops = [
      supabase
        .from('subscribers')
        .update(updates)
        .eq('id', subscriber.id)
        .select(`*, plans(${PLANS_SELECT})`)
        .single(),
    ]

    if (amount && parseFloat(amount) > 0) {
      ops.push(
        supabase.from('payments').insert({
          subscriber_id: subscriber.id,
          amount: parseFloat(amount),
          paid_at: new Date().toISOString(),
        })
      )
    }

    const [{ data, error }] = await Promise.all(ops)
    if (!error) {
      setSubscribers(prev => prev.map(s => s.id === subscriber.id
        ? withStatus({ ...data, last_used_at: null, next_appointment: s.next_appointment })
        : s
      ))
    }
    return { data, error }
  }

  return {
    subscribers,
    loading,
    refetch: fetchSubscribers,
    createSubscriber,
    updateSubscriber,
    deleteSubscriber,
    registerUse,
    renewSubscriber,
  }
}
