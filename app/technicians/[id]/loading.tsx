import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => {
  return (
    <main
      className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6"
      role="status"
      aria-label="Loading technician profile"
    >
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column: Profile Card & Reviews Skeleton */}
        <div className="space-y-6 lg:col-span-5">
          {/* Profile Card Skeleton */}
          <div className="rounded-xl border bg-card p-6 text-card-foreground">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-8 w-48" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="h-3.5 w-4/6" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </div>

          {/* Customer Reviews Skeleton */}
          <section className="space-y-4">
            <Skeleton className="h-7 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className="space-y-2 rounded-xl border bg-card p-4 text-card-foreground">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-3/4" />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Provided Services & Booking Card Skeleton */}
        <div className="space-y-6 lg:col-span-7">
          {/* Provided Services Skeleton */}
          <section className="space-y-4">
            <Skeleton className="h-7 w-44" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className="space-y-3 rounded-xl border bg-card p-4 text-card-foreground">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          </section>

          {/* Booking Card Skeleton */}
          <section className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
            <Skeleton className="h-7 w-48" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </div>
            <Skeleton className="h-11 w-full" />
          </section>
        </div>
      </div>
    </main>
  );
};

export default Loading;
