import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function useAvailability(business) {
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAvailability = useCallback(async () => {
    if (!business?.id) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('business_availability')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle()
    setAvailability(data)
    setLoading(false)
  }, [business?.id])

  useEffect(() => { fetchAvailability() }, [fetchAvailability])

  async function saveAvailability(payload) {
    if (!business?.id) return { error: 'No business' }
    const { data, error } = await supabase
      .from('business_availability')
      .upsert({ ...payload, business_id: business.id }, { onConflict: 'business_id' })
      .select()
      .single()
    if (!error) setAvailability(data)
    return { data, error }
  }

  async function ensureSlug() {
    if (!business) return null
    if (business.slug) return business.slug
    const slug = generateSlug(business.name)
    const randomBytes = crypto.getRandomValues(new Uint8Array(4))
    const suffix = Array.from(randomBytes).map(b => b.toString(36)).join('').slice(0, 6)
    const candidate = slug + '-' + suffix
    const { error } = await supabase
      .from('businesses')
      .update({ slug: candidate })
      .eq('id', business.id)
    if (error) return null
    return candidate
  }

  return { availability, loading, saveAvailability, ensureSlug, generateSlug }
}
