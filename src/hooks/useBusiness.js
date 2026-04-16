import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useBusiness(userId) {
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchBusiness = useCallback(async () => {
    if (!userId) {
      setBusiness(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .single()
    setBusiness(data ?? null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchBusiness()
  }, [fetchBusiness])

  async function updateBusiness(id, updates) {
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error) setBusiness(data)
    return { data, error }
  }

  return { business, loading, refetch: fetchBusiness, updateBusiness }
}
