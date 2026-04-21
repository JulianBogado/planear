import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useUsageLogs(businessId) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchLogs = useCallback(async () => {
    if (!businessId) {
      setLogs([])
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('usage_logs')
      .select('id, subscriber_id, used_at, notes, subscribers(name)')
      .eq('business_id', businessId)
      .is('deleted_at', null)
      .order('used_at', { ascending: false })
      .limit(300)
    setLogs(data ?? [])
    setLoading(false)
  }, [businessId])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  async function deleteUsage(logId, reason) {
    const { error } = await supabase.rpc('delete_usage_log_atomic', {
      p_log_id:        logId,
      p_business_id:   businessId,
      p_delete_reason: reason,
    })
    if (!error) setLogs(prev => prev.filter(l => l.id !== logId))
    return { error }
  }

  return { logs, loading, refetch: fetchLogs, deleteUsage }
}
