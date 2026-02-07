import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="px-4 py-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-64" />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border">
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
