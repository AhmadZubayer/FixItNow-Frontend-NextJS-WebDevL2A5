import PageSkeleton from "@/components/page-skeleton";

export default function Loading() {
  return <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 sm:px-6"><div className="h-7 w-40 animate-pulse rounded bg-muted" /><PageSkeleton /></div>;
}
