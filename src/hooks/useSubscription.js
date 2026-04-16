import { TIER_LIMITS } from '../constants/tiers'

export function useSubscription(business) {
  const tier = business?.tier ?? 'free'
  const limits = TIER_LIMITS[tier]

  return {
    tier,
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
