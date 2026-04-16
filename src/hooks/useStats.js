import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { subWeeks, startOfWeek, format, parseISO, isAfter } from 'date-fns'

function buildEmptyWeeks(asObject = false) {
  const result = asObject ? {} : []
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 })
    const label = format(weekStart, 'dd/MM')
    if (asObject) {
      result[label] = { week: label, count: 0 }
    } else {
      result.push({ week: label, count: 0 })
    }
  }
  return result
}

export function useStats(businessId) {
  const [usageByWeek, setUsageByWeek] = useState(() => buildEmptyWeeks())
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [recentRevenue, setRecentRevenue] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) {
      setUsageByWeek(buildEmptyWeeks())
      setLoading(false)
      return
    }

    async function fetchStats() {
      setLoading(true)
      const eightWeeksAgo = subWeeks(new Date(), 8)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const { data: subs } = await supabase
        .from('subscribers')
        .select('id')
        .eq('business_id', businessId)

      const subIds = subs?.map(s => s.id) ?? []

      if (subIds.length > 0) {
        const [logsResult, paymentsResult] = await Promise.all([
          supabase
            .from('usage_logs')
            .select('used_at')
            .in('subscriber_id', subIds)
            .gte('used_at', eightWeeksAgo.toISOString()),
          supabase
            .from('payments')
            .select('amount, paid_at')
            .in('subscriber_id', subIds),
        ])

        const weekMap = buildEmptyWeeks(true)
        ;(logsResult.data ?? []).forEach(log => {
          const weekStart = startOfWeek(parseISO(log.used_at), { weekStartsOn: 1 })
          const label = format(weekStart, 'dd/MM')
          if (weekMap[label]) weekMap[label].count++
        })
        setUsageByWeek(Object.values(weekMap))

        const payments = paymentsResult.data ?? []
        setTotalRevenue(payments.reduce((sum, p) => sum + Number(p.amount), 0))
        setRecentRevenue(
          payments
            .filter(p => isAfter(parseISO(p.paid_at), thirtyDaysAgo))
            .reduce((sum, p) => sum + Number(p.amount), 0)
        )
      } else {
        setUsageByWeek(buildEmptyWeeks())
        setTotalRevenue(0)
        setRecentRevenue(0)
      }

      setLoading(false)
    }

    fetchStats()
  }, [businessId])

  return { usageByWeek, totalRevenue, recentRevenue, loading }
}
