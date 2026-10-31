import { Skeleton } from "@/components/ui/card";

export default function EquipmentLoading() {
  return (
    <div className="container-x py-16" aria-busy="true" aria-label="Loading equipment catalogue">
      <Skeleton className="h-10 w-80 max-w-full" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-96 rounded-xl" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-96 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

