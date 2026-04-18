import { TIER_LIMITS } from '../constants/tiers'

export function useSubscription(business) {
  const tier = business?.tier ?? 'free'

  const isExpired = business?.subscription_ends_at
    ? new Date() > new Date(business.subscription_ends_at)
    : false
  const effectiveTier = (tier !== 'free' && isExpired) ? 'free' : tier

  const limits = TIER_LIMITS[effectiveTier]

  return {
    tier,
    effectiveTier,
    isExpired,
    limits,
    canAddSubscriber: (currentCount) =>
      limits.maxSubscribers === null || currentCount < limits.maxSubscribers,
    canAddPlan: (currentCount) =>
      limits.maxPlans === null || currentCount < limits.maxPlans,
    canPrint: limits.canPrint,
    canStats: limits.canStats,
    canReserve: limits.canReserve,
  }
}
