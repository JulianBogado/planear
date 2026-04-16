import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TEMPLATES } from '../constants/templates'

export function usePlans(businessId) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    if (!businessId) {
      setPlans([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('business_id', businessId)
      .order('price', { ascending: true })
    setPlans(data ?? [])
    setLoading(false)
  }, [businessId])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  async function createPlan(planData) {
    const { data, error } = await supabase
      .from('plans')
      .insert({
        business_id: businessId,
        name: planData.name,
        description: planData.description ?? null,
        price: Number(planData.price),
        total_uses: Number(planData.total_uses),
        duration_days: Number(planData.duration_days),
        items: planData.items ?? [],
      })
      .select()
      .single()
    if (!error) setPlans(prev => [...prev, data].sort((a, b) => a.price - b.price))
    return { data, error }
  }

  async function updatePlan(id, updates) {
    const safe = {}
    if ('name' in updates)         safe.name = updates.name
    if ('description' in updates)  safe.description = updates.description ?? null
    if ('price' in updates)        safe.price = Number(updates.price)
    if ('total_uses' in updates)   safe.total_uses = Number(updates.total_uses)
    if ('duration_days' in updates) safe.duration_days = Number(updates.duration_days)
    if ('items' in updates)        safe.items = updates.items ?? []
    const { data, error } = await supabase
      .from('plans')
      .update(safe)
      .eq('id', id)
      .select()
      .single()
    if (!error) setPlans(prev => prev.map(p => p.id === id ? data : p).sort((a, b) => a.price - b.price))
    return { data, error }
  }

  async function deletePlan(id) {
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id)
    if (!error) setPlans(prev => prev.filter(p => p.id !== id))
    return { error }
  }

  async function loadTemplates(category) {
    await supabase.from('plans').delete().eq('business_id', businessId)
    const templates = TEMPLATES[category] ?? []
    if (templates.length > 0) {
      await supabase.from('plans').insert(
        templates.map(t => ({ ...t, business_id: businessId, is_template: true }))
      )
    }
    await fetchPlans()
  }

  // Wipe completo: nullea subscriber_id en logs/pagos, borra suscriptores y planes
  async function wipeAndReload(category) {
    // 1. Obtener IDs de suscriptores del negocio
    const { data: subs } = await supabase
      .from('subscribers')
      .select('id')
      .eq('business_id', businessId)

    if (subs?.length > 0) {
      const subIds = subs.map(s => s.id)
      // 2. Nullear subscriber_id en usage_logs y payments (preserva business_id para analytics)
      await supabase.from('usage_logs').update({ subscriber_id: null }).in('subscriber_id', subIds)
      await supabase.from('payments').update({ subscriber_id: null }).in('subscriber_id', subIds)
      // 3. Borrar suscriptores
      await supabase.from('subscribers').delete().eq('business_id', businessId)
    }

    // 4. Cargar plantillas del nuevo rubro (borra planes viejos internamente)
    await loadTemplates(category)
  }

  return { plans, loading, refetch: fetchPlans, createPlan, updatePlan, deletePlan, loadTemplates, wipeAndReload }
}
