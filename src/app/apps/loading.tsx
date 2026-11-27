import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown the moment a member clicks, while the page reads its data. The
 * shapes match the cards they stand in for, so nothing jumps when the
 * content arrives.
 */
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
            <Skeleton className="aspect-[16/9] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
