import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, idx) => (
          <Skeleton key={idx} className="h-40" />
        ))}
      </div>
      <Skeleton className="h-56 w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, idx) => (
          <Skeleton key={idx} className="h-28" />
        ))}
      </div>
    </div>
  )
}
