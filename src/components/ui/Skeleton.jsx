/** Base skeleton block — use className to set size/shape */
export default function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

/** Pre-built skeleton for a subscriber/dashboard card */
export function SubscriberCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl shadow-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="h-3 w-24 rounded-full" />
        </div>
        <div className="space-y-1.5 items-end flex flex-col">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-3 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

/** Pre-built skeleton for a plan card */
export function PlanCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl shadow-card overflow-hidden flex">
      <div className="flex-1 px-5 py-4 space-y-3">
        <Skeleton className="h-4 w-44 rounded-full" />
        <Skeleton className="h-3 w-32 rounded-full" />
        <div className="flex gap-2 mt-1">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div className="w-24 bg-stone-50 flex items-center justify-center">
        <Skeleton className="h-8 w-14 rounded-full" />
      </div>
    </div>
  )
}

/** Pre-built skeleton for the stats strip */
export function StatsSkeleton() {
  return (
    <div className="bg-surface rounded-3xl shadow-card p-1 grid grid-cols-3 divide-x divide-stone-100">
      {[0, 1, 2].map(i => (
        <div key={i} className="text-center py-5 px-2 space-y-2 flex flex-col items-center">
          <Skeleton className="h-12 w-10 rounded-xl" />
          <Skeleton className="h-3 w-14 rounded-full" />
        </div>
      ))}
    </div>
  )
}
