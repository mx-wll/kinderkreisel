import { Skeleton } from "@/components/ui/skeleton";

export default function ItemDetailLoading() {
  return (
    <div className="pb-6">
      <div className="px-4 py-3">
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="aspect-square w-full" />
      <div className="px-4 space-y-4">
        <div className="mt-4 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}
