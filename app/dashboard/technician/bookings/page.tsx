"use client";

import axios from "axios";
import { bookingLabel } from "@/lib/booking-label";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import EmptyState from "@/components/empty-state";
import PendingButton from "@/components/pending-button";
import PageSkeleton from "@/components/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TechnicianBooking } from "@/lib/technician-types";
import { bookingStatusSchema } from "@/validations/booking.validation";

const TechnicianBookingsPage = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState<TechnicianBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const me = await axios.get<{ role: string }>("/api/session/me");
      if (me.data.role !== "TECHNICIAN") { router.replace(`/dashboard/${me.data.role.toLowerCase()}`); return; }
      const response = await axios.get<TechnicianBooking[]>("/api/technician/bookings");
      setBookings(response.data);
      setError("");
    } catch (failure) {
      if (axios.isAxiosError(failure) && failure.response?.status === 401) { router.replace("/auth/login"); return; }
      setError("Could not load bookings. Please try again.");
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  async function changeStatus(id: string, status: string) {
    if (pendingId) return;
    const result = bookingStatusSchema.safeParse({ status });
    if (!result.success) return;
    setPendingId(id);
    try {
      await axios.patch(`/api/technician/bookings/${id}`, result.data);
      toast.success("Booking updated.");
      await load();
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not update booking." : "Could not update booking.");
    } finally { setPendingId(null); }
  }

  return <div className="space-y-6"><div><h1 className="mt-3 text-2xl font-semibold tracking-tight">Booking requests</h1></div>{loading ? <PageSkeleton /> : error ? <p role="alert" className="text-sm text-destructive">{error} <Button variant="link" type="button" onClick={() => { setLoading(true); void load(); }} className="underline underline-offset-4">Retry</Button></p> : bookings.length ? <Table><TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Customer</TableHead><TableHead>When</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{bookings.map((booking) => <TableRow key={booking.id}><TableCell className="font-medium">{bookingLabel(booking)}</TableCell><TableCell>{booking.customer.name}</TableCell><TableCell>{new Date(booking.startAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}</TableCell><TableCell><Badge variant={booking.status === "DECLINED" || booking.status === "CANCELLED" ? "destructive" : booking.status === "PAID" || booking.status === "IN_PROGRESS" ? "default" : "secondary"}>{booking.status.replaceAll("_", " ")}</Badge></TableCell><TableCell><div className="flex gap-1">{booking.status === "REQUESTED" && <><PendingButton size="sm" pending={pendingId === booking.id} disabled={!!pendingId} onClick={() => changeStatus(booking.id, "ACCEPTED")}>Accept</PendingButton><PendingButton size="sm" variant="outline" pending={pendingId === booking.id} disabled={!!pendingId} onClick={() => changeStatus(booking.id, "DECLINED")}>Decline</PendingButton></>}{booking.status === "PAID" && <PendingButton size="sm" pending={pendingId === booking.id} disabled={!!pendingId} onClick={() => changeStatus(booking.id, "IN_PROGRESS")}>Start job</PendingButton>}{booking.status === "IN_PROGRESS" && <PendingButton size="sm" pending={pendingId === booking.id} disabled={!!pendingId} onClick={() => changeStatus(booking.id, "COMPLETED")}>Complete job</PendingButton>}</div></TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="No booking requests" description="Requests will appear when customers choose your services." />}</div>;
};

export default TechnicianBookingsPage;
