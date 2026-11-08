import { Skeleton } from "@/components/ui/skeleton";

const BookingDetailSkeleton = () => (
  <div role="status" aria-label="Loading booking" className="space-y-3 rounded-lg border p-4">
    <Skeleton className="h-5 w-2/3" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-7 w-36" />
  </div>
);

export default BookingDetailSkeleton;
