"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";

import EmptyState from "@/components/empty-state";
import PendingButton from "@/components/pending-button";
import PageSkeleton from "@/components/page-skeleton";
import BookingPaymentDialog from "@/components/customer/payment-dialog";
import { Timeline, TimelineContent, TimelineDate, TimelineHeader, TimelineIndicator, TimelineItem, TimelineSeparator, TimelineTitle } from "@/components/reui/timeline";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { bookingLabel } from "@/lib/booking-label";
import { activityViews, customerActivities, type ActivityView, type CustomerActivity, type CustomerBooking, type CustomerPayment } from "@/lib/customer-activity";

const cancellable = ["REQUESTED", "ACCEPTED", "PAID"];
const dateTime = (value: string) => Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }) : "Date unavailable";
const serviceName = (activity: CustomerActivity) => bookingLabel(activity.kind === "Payment" ? activity.payment.booking : activity.booking);
const ActivityStatus = ({ activity }: { activity: CustomerActivity }) => <Badge variant={
  ["DECLINED", "CANCELLED", "FAILED", "REFUND_FAILED"].includes(activity.status) ? "destructive"
    : ["PAID", "IN_PROGRESS", "COMPLETED", "SUBMITTED"].includes(activity.status) ? "default" : "secondary"
}>{activity.status.replaceAll("_", " ")}</Badge>;

const CustomerDashboard = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [view, setView] = useState<ActivityView>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paymentBookingId, setPaymentBookingId] = useState<string | null>(null);
  const requestVersion = useRef(0);

  const loadActivity = useCallback(async (signal?: AbortSignal) => {
    const version = ++requestVersion.current;
    try {
      const me = await axios.get<{ role: string }>("/api/session/me", { signal });
      if (me.data.role !== "CUSTOMER") { router.replace(`/dashboard/${me.data.role.toLowerCase()}`); return; }
      const [bookingResponse, paymentResponse] = await Promise.all([
        axios.get<CustomerBooking[]>("/api/customer/bookings", { signal }),
        axios.get<CustomerPayment[]>("/api/customer/payments", { signal }),
      ]);
      if (signal?.aborted || version !== requestVersion.current) return;
      setBookings(bookingResponse.data);
      setPayments(paymentResponse.data);
      setError("");
    } catch (failure) {
      if (axios.isCancel(failure) || signal?.aborted || version !== requestVersion.current) return;
      if (axios.isAxiosError(failure) && failure.response?.status === 401) { router.replace("/auth/login"); return; }
      setError("We could not load your activity. Please try again.");
    } finally { if (!signal?.aborted && version === requestVersion.current) setLoading(false); }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) void loadActivity(controller.signal); });
    const refresh = () => { if (document.visibilityState === "visible") void loadActivity(controller.signal); };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [loadActivity]);

  const cancelBooking = async (id: string) => {
    if (pendingId) return;
    setPendingId(id);
    try {
      await axios.patch(`/api/customer/bookings/${id}/cancel`);
      toast.success("Booking cancelled.");
      await loadActivity();
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not cancel this booking." : "Could not cancel this booking.");
    } finally { setPendingId(null); }
  };

  const activities = customerActivities(bookings, payments, view);
  const selected = customerActivities(bookings, payments).find(({ id }) => id === selectedId);

  const openPayment = (id: string) => { setSelectedId(null); setPaymentBookingId(id); };

  return <><Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" className="gap-2" />}>View: {view}<ChevronDown aria-hidden className="size-3.5" /></DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup value={view} onValueChange={(value) => { if (activityViews.includes(value as ActivityView)) setView(value as ActivityView); }}>
              {activityViews.map((option) => <DropdownMenuRadioItem key={option} value={option}>{option}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {loading ? <PageSkeleton /> : error ? <Alert variant="destructive">
        <AlertTitle>Activity unavailable</AlertTitle><AlertDescription>{error}<Button variant="link" onClick={() => { setLoading(true); void loadActivity(); }}>Retry</Button></AlertDescription>
      </Alert> : activities.length ? <Timeline value={0} className="w-full max-w-3xl" aria-label="Customer activity">
        {activities.map((activity, index) => <TimelineItem key={activity.id} step={index + 1} className="group-data-[orientation=vertical]/timeline:ms-10 group-data-[orientation=vertical]/timeline:not-last:pb-9">
          <TimelineHeader>
            <TimelineSeparator className="bg-border group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" />
            <TimelineDate dateTime={activity.date} className="h-auto!">{dateTime(activity.date)}</TimelineDate>
            <TimelineTitle className="mt-1 text-sm font-medium">{activity.kind}</TimelineTitle>
            <TimelineIndicator className="flex size-6 items-center justify-center border-0 bg-transparent group-data-[orientation=vertical]/timeline:-left-7">
              {activity.successful ? <Check className="size-5 text-green-600" /> : <X className="size-5 text-red-600" />}
            </TimelineIndicator>
          </TimelineHeader>
          <TimelineContent className="min-w-0 space-y-3 pt-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><p className="font-medium text-foreground [overflow-wrap:anywhere]">{serviceName(activity)}</p><ActivityStatus activity={activity} /></div>
            <div className="flex flex-wrap items-center gap-3">
              <DialogTrigger render={<Button variant="link" className="h-auto bg-transparent p-0 text-sm font-semibold text-black" onClick={() => setSelectedId(activity.id)} />}>View details<span className="sr-only"> for {activity.kind.toLowerCase()} {serviceName(activity)}</span></DialogTrigger>
              {activity.kind === "Booking" && activity.booking.status === "ACCEPTED" && <Button onClick={() => openPayment(activity.booking.id)}>Pay now</Button>}
            </div>
          </TimelineContent>
        </TimelineItem>)}
      </Timeline> : <EmptyState title={view === "All" ? "No activity yet" : `No ${view.toLowerCase()} yet`} description={view === "All" || view === "Bookings" ? "Browse services and request your first appointment." : view === "Payments" ? "Your payment activity will appear here after checkout." : "Your submitted reviews will appear here after completed bookings."} />}
    </div>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>{selected?.kind ?? "Activity"} details</DialogTitle><DialogDescription className="[overflow-wrap:anywhere]">{selected ? serviceName(selected) : ""}</DialogDescription></DialogHeader>
      {selected && <div className="space-y-5">
        <ActivityStatus activity={selected} />
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-3 text-sm [&_dt]:text-muted-foreground [&_dd]:min-w-0 [&_dd]:[overflow-wrap:anywhere]">
          <dt>Activity time</dt><dd>{dateTime(selected.date)}</dd>
          {selected.kind === "Payment" ? <>
            <dt>Payment ID</dt><dd>{selected.payment.id}</dd><dt>Booking ID</dt><dd>{selected.payment.bookingId}</dd>
            <dt>Amount</dt><dd>৳{selected.payment.amount}</dd><dt>Provider</dt><dd>{selected.payment.provider}</dd>
            <dt>Created</dt><dd>{dateTime(selected.payment.createdAt)}</dd>
            {selected.payment.paidAt && <><dt>Paid</dt><dd>{dateTime(selected.payment.paidAt)}</dd></>}
            {selected.payment.transactionId && <><dt>Transaction</dt><dd>{selected.payment.transactionId}</dd></>}
          </> : <>
            <dt>Booking ID</dt><dd>{selected.booking.id}</dd>
            <dt>Technician</dt><dd><Link href={`/technicians/${selected.booking.service.technicianProfile.id}`} className="font-medium underline underline-offset-4">{selected.booking.service.technicianProfile.user.name}</Link></dd>
            {selected.kind === "Review" ? <><dt>Rating</dt><dd>{selected.review.rating} / 5</dd><dt>Comment</dt><dd className="whitespace-pre-wrap">{selected.review.comment || "No comment provided."}</dd></> : <>
              <dt>Requested</dt><dd>{dateTime(selected.booking.createdAt)}</dd>
              <dt>Appointment</dt><dd>{dateTime(selected.booking.startAt)}</dd>
              {selected.booking.endAt && <><dt>Ends</dt><dd>{dateTime(selected.booking.endAt)}</dd></>}
              <dt>Total</dt><dd>৳{selected.booking.priceAtBooking}</dd>
            </>}
          </>}
        </dl>
        {selected.kind === "Booking" && <div className="flex flex-wrap gap-2">
          {selected.booking.status === "ACCEPTED" && <Button onClick={() => openPayment(selected.booking.id)}>Pay now</Button>}
          {cancellable.includes(selected.booking.status) && <PendingButton variant="outline" pending={pendingId === selected.booking.id} pendingText="Cancelling" disabled={!!pendingId} onClick={() => cancelBooking(selected.booking.id)}>Cancel booking</PendingButton>}
          {selected.booking.status === "COMPLETED" && !selected.booking.review && <Link href={`/dashboard/customer/bookings/${selected.booking.id}/review`} className={buttonVariants({ variant: "outline" })}>Leave a review</Link>}
        </div>}
      </div>}
    </DialogContent>
  </Dialog>
    {paymentBookingId && <BookingPaymentDialog key={paymentBookingId} bookingId={paymentBookingId} onClose={() => setPaymentBookingId(null)} onBookingChanged={() => void loadActivity()} />}
  </>;
};

export default CustomerDashboard;
