import PageSkeleton from "@/components/page-skeleton";

const Loading = () => {
  return (
    <div className="mx-auto w-full max-w-[100rem] space-y-6 bg-white px-4 py-8 sm:px-6">
      <div className="h-7 w-40 animate-pulse rounded bg-muted" />
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="space-y-4 border-b pb-5 lg:border-r lg:border-b-0 lg:pr-6">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-9 w-full animate-pulse rounded-full bg-muted" />
            ))}
          </div>
        </div>
        <div className="min-w-0 space-y-6">
          <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
          <PageSkeleton />
        </div>
      </div>
    </div>
  );
};

export default Loading;
