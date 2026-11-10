"use client";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import PageSkeleton from "@/components/page-skeleton";
import EmptyState from "@/components/empty-state";
import ProfileForm from "@/components/technician/profile-form";
import AvailabilityEditor from "@/components/technician/availability-editor";
import SubmissionForm from "@/components/technician/submission-form";
import { AreaChart } from "@/components/ui/area-chart";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Timeline, TimelineContent, TimelineDate, TimelineHeader, TimelineIndicator, TimelineItem, TimelineSeparator, TimelineTitle } from "@/components/reui/timeline";
import { bookingLabel } from "@/lib/booking-label";
import type { Category } from "@/lib/public-api";
import type { TechnicianProfile, TechnicianBooking } from "@/lib/technician-types";
import { technicianEarnings, type TechnicianPayment } from "@/lib/technician-earnings";

type View = "activity" | "earnings" | "profile" | "availability";
type Activity = { id: string; kind: string; date: string; title: string; status: string; details: Array<[string, string]>; booking?: TechnicianBooking };
const dateTime = (value: string) => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }) : "Date unavailable";
const money = (value: string | number) => `৳${Number(value).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statusBadge = (status: string) => <Badge variant={["CANCELLED", "DECLINED", "FAILED", "REFUND_FAILED"].includes(status) ? "destructive" : ["PAID", "IN_PROGRESS", "COMPLETED", "SUBMITTED"].includes(status) ? "default" : "secondary"}>{status.replaceAll("_", " ")}</Badge>;
const activityViews = ["All", "Bookings", "Payments", "Reviews"];

const TechnicianWorkspace = ({ view }: { view: View }) => {
  const router = useRouter();
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [bookings, setBookings] = useState<TechnicianBooking[]>([]);
  const [payments, setPayments] = useState<TechnicianPayment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const { data: me } = await axios.get<{ role: string }>("/api/session/me", { signal });
      if (me.role !== "TECHNICIAN") { router.replace(`/dashboard/${me.role.toLowerCase()}`); return; }
      const [p, b, pay, c] = await Promise.all([
        axios.get<TechnicianProfile | null>("/api/technician/profile", { signal }), axios.get<TechnicianBooking[]>("/api/technician/bookings", { signal }),
        axios.get<TechnicianPayment[]>("/api/technician/payments", { signal }), axios.get<Category[]>("/api/categories", { signal }),
      ]);
      if (signal?.aborted) return;
      setProfile(p.data); setBookings(b.data); setPayments(pay.data); setCategories(c.data); setError("");
    } catch (failure) {
      if (axios.isCancel(failure) || signal?.aborted) return;
      if (axios.isAxiosError(failure) && failure.response?.status === 401) { router.replace("/auth/login"); return; }
      setError("Could not load your technician workspace. Please try again.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [router]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const refresh = () => { if (document.visibilityState === "visible") void load(controller.signal); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [load]);
  const serviceAction = async (id: string, action: "cancel" | "pause" | "resume") => {
    if (pending) return; setPending(id);
    try { await axios.patch(`/api/technician/services/${id}`, { action }); toast.success(action === "cancel" ? "Service withdrawn. Existing bookings are retained." : action === "pause" ? "Service paused." : "Service resumed."); await load(); }
    catch (failure) { toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not update service." : "Could not update service."); }
    finally { setPending(null); }
  };
  const changeBooking = async (id: string, status: string) => {
    if (pending) return; setPending(id);
    try { await axios.patch(`/api/technician/bookings/${id}`, { status }); toast.success("Booking updated."); await load(); }
    catch (failure) { toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not update booking." : "Could not update booking."); }
    finally { setPending(null); }
  };
  const activities: Activity[] = [
    ...bookings.map(booking => ({ id: `booking-${booking.id}`, kind: "Booking", date: booking.updatedAt ?? booking.createdAt, title: bookingLabel(booking), status: booking.status, booking,
      details: [["Booking ID", booking.id], ["Customer", booking.customer.name], ["Appointment", dateTime(booking.startAt)], ["Booking total", money(booking.priceAtBooking)]] as Array<[string, string]> })),
    ...payments.map(payment => ({ id: `payment-${payment.id}`, kind: "Payment", date: payment.updatedAt ?? payment.paidAt ?? payment.createdAt, title: bookingLabel(payment.booking), status: payment.status,
      details: [["Payment ID", payment.id], ["Customer", payment.booking.customer.name], ["Customer paid", money(payment.amount)], ["Technician share (85%)", money(payment.technicianShare)], ["Provider", payment.provider]] as Array<[string, string]> })),
    ...bookings.flatMap(booking => booking.review ? [{ id: `review-${booking.review.id}`, kind: "Review", date: booking.review.createdAt, title: bookingLabel(booking), status: "SUBMITTED",
      details: [["Customer", booking.customer.name], ["Rating", `${booking.review.rating} / 5`], ["Comment", booking.review.comment || "No comment provided."]] as Array<[string, string]> }] : []),
  ].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0) || a.id.localeCompare(b.id));
  const visible = activities.filter(item => filter === "All" || `${item.kind}s` === filter);
  const selected = activities.find(item => item.id === selectedId);
  const earnings = technicianEarnings(payments);
  const title = { activity: "Activity", earnings: "Earnings", profile: "Your profile", availability: "Select Availability Time" }[view];
  return <div className="space-y-7">
    <div className="flex flex-wrap items-center gap-4"><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {view === "activity" && <DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" />}>View: {filter}<ChevronDown aria-hidden /></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuRadioGroup value={filter} onValueChange={value => { if (activityViews.includes(value)) setFilter(value); }}>{activityViews.map(option => <DropdownMenuRadioItem key={option} value={option}>{option}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>}
      {view === "profile" && <Dialog open={adding} onOpenChange={setAdding}><DialogTrigger render={<Button className="ml-auto" disabled={!profile || loading || !!error} />}>Add New Services</DialogTrigger><DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Add New Services</DialogTitle><DialogDescription>Choose an existing title or add a new one, then send your offering for admin approval.</DialogDescription></DialogHeader>{adding && <SubmissionForm categories={categories} onSaved={() => { setAdding(false); void load(); }} />}</DialogContent></Dialog>}
    </div>
    {loading ? <PageSkeleton /> : error ? <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => { setLoading(true); void load(); }}>Retry</Button></div> : <>
      {view === "profile" && <>
        {!profile && <p className="text-sm text-muted-foreground">Save your profile before submitting services or setting availability.</p>}
        <ProfileForm key={profile?.id ?? "new"} profile={profile} onSaved={() => void load()} />
        <section className="space-y-4"><h2 className="text-lg font-semibold">Services offered</h2>{profile?.services.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name of service</TableHead><TableHead>Admin approved</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{profile.services.map(service => <TableRow key={service.id}><TableCell className="whitespace-normal font-medium">{service.title}</TableCell><TableCell><Badge variant={service.isApproved ? "default" : "secondary"}>{service.isApproved ? "Approved" : "Awaiting approval"}</Badge></TableCell><TableCell>{money(service.price)}</TableCell><TableCell>{service.isCancelled ? "Cancelled" : service.isAdminPaused ? "Paused by admin" : service.isActive ? "Active" : "Paused"}</TableCell><TableCell><DropdownMenu><DropdownMenuTrigger render={<Button size="icon-sm" variant="ghost" aria-label={`Actions for ${service.title}`} disabled={!!pending || service.isCancelled} />}><MoreHorizontal aria-hidden /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem disabled={!service.isApproved || service.isAdminPaused} onClick={() => void serviceAction(service.id, service.isActive ? "pause" : "resume")}>{service.isActive ? "Pause Service" : "Resume Service"}</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => void serviceAction(service.id, "cancel")}>Cancel service</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState title="No services offered" description="Add a service and send it for approval." />}</section>
      </>}
      {view === "availability" && (profile ? <AvailabilityEditor slots={profile.availabilitySlots} onSaved={() => void load()} /> : <Link href="/dashboard/technician/profile" className={buttonVariants()}>Create your profile first</Link>)}
      {view === "earnings" && <>
        <AreaChart title="Earnings this month" description="Your 85% share of completed payments, by day (Asia/Dhaka)." seriesLabel="Earnings (BDT)" data={earnings.daily} />
        <dl className="grid grid-cols-1 gap-5 border-y py-5 sm:grid-cols-3">{[["Earnings today", earnings.today], ["Earnings this week", earnings.week], ["Earnings this month", earnings.month]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-2 text-2xl font-semibold">{money(value)}</dd></div>)}</dl>
        <section className="space-y-4"><h2 className="text-lg font-semibold">Payment received history</h2><p className="text-xs text-muted-foreground">Recorded payments and their current status. Bank payouts are not tracked here.</p>{payments.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date &amp; time</TableHead><TableHead>Service</TableHead><TableHead>Customer</TableHead><TableHead>Your share (85%)</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{payments.map(payment => <TableRow key={payment.id}><TableCell>{dateTime(payment.paidAt ?? payment.createdAt)}</TableCell><TableCell className="whitespace-normal">{bookingLabel(payment.booking)}</TableCell><TableCell>{payment.booking.customer.name}</TableCell><TableCell>{payment.status === "COMPLETED" ? money(payment.technicianShare) : "—"}</TableCell><TableCell>{statusBadge(payment.status)}</TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState title="No payments yet" description="Payments will appear after customers pay for accepted bookings." />}</section>
      </>}
      {view === "activity" && <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelectedId(null); }}>
        {visible.length ? <Timeline value={0} className="w-full max-w-3xl" aria-label="Technician activity">{visible.map((item, index) => <TimelineItem key={item.id} step={index + 1} className="group-data-[orientation=vertical]/timeline:ms-10 group-data-[orientation=vertical]/timeline:not-last:pb-9"><TimelineHeader><TimelineSeparator className="bg-border group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5" /><TimelineDate dateTime={item.date} className="h-auto!">{dateTime(item.date)}</TimelineDate><TimelineTitle>{item.kind}</TimelineTitle><TimelineIndicator className="flex size-6 items-center justify-center border-0 bg-transparent group-data-[orientation=vertical]/timeline:-left-7">{["ACCEPTED", "PAID", "IN_PROGRESS", "COMPLETED", "SUBMITTED", "REFUNDED"].includes(item.status) ? <Check className="size-5 text-green-600" /> : <X className="size-5 text-red-600" />}</TimelineIndicator></TimelineHeader><TimelineContent className="min-w-0 space-y-3 pt-1"><div className="flex flex-wrap items-center gap-3"><p className="font-medium text-foreground [overflow-wrap:anywhere]">{item.title}</p>{statusBadge(item.status)}</div><DialogTrigger render={<Button variant="link" className="h-auto p-0 text-sm font-semibold text-black" onClick={() => setSelectedId(item.id)} />}>View details<span className="sr-only"> for {item.kind.toLowerCase()} {item.title}</span></DialogTrigger></TimelineContent></TimelineItem>)}</Timeline> : <EmptyState title={filter === "All" ? "No activity yet" : `No ${filter.toLowerCase()} yet`} description="Your bookings, received payments, and customer reviews will appear here." />}
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{selected?.kind} details</DialogTitle><DialogDescription>{selected?.title}</DialogDescription></DialogHeader>{selected && <>{statusBadge(selected.status)}<dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-sm [&_dt]:text-muted-foreground [&_dd]:[overflow-wrap:anywhere]"><dt>Activity time</dt><dd>{dateTime(selected.date)}</dd>{selected.details.map(([label, value]) => <div key={label} className="contents"><dt>{label}</dt><dd className="whitespace-pre-wrap">{value}</dd></div>)}</dl>{selected.booking && <div className="flex flex-wrap gap-2">{(selected.status === "REQUESTED" ? [["Accept", "ACCEPTED"], ["Decline", "DECLINED"]] : selected.status === "PAID" ? [["Start job", "IN_PROGRESS"]] : selected.status === "IN_PROGRESS" ? [["Complete job", "COMPLETED"]] : []).map(([label, status]) => <Button key={status} variant={status === "DECLINED" ? "outline" : "default"} disabled={!!pending} onClick={() => void changeBooking(selected.booking!.id, status)}>{pending ? "Saving…" : label}</Button>)}</div>}</>}</DialogContent>
      </Dialog>}
    </>}
  </div>;
};
export default TechnicianWorkspace;
