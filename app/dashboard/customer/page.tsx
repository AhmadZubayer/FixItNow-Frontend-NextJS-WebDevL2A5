"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import EmptyState from "@/components/empty-state";
import PendingButton from "@/components/pending-button";
import PageSkeleton from "@/components/page-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Booking = {
  id: string;
  status: "REQUESTED" | "ACCEPTED" | "DECLINED" | "PAID" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  startAt: string;
  priceAtBooking: string;
  service: { title: string; technicianProfile: { id: string; user: { name: string } } };
};

const cancellable = ["REQUESTED", "ACCEPTED", "PAID"];

export default function CustomerDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      const me = await axios.get<{ role: string }>("/api/session/me");
      if (me.data.role !== "CUSTOMER") {
        router.replace(`/dashboard/${me.data.role.toLowerCase()}`);
        return;
      }
      const response = await axios.get<Booking[]>("/api/customer/bookings");
      setBookings(response.data);
      setError("");
    } catch (failure) {
      if (axios.isAxiosError(failure) && failure.response?.status === 401) {
        router.replace("/auth/login");
        return;
      }
      setError("We could not load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { queueMicrotask(() => void loadBookings()); }, [loadBookings]);

  async function cancelBooking(id: string) {
    if (pendingId) return;
    setPendingId(id);
    try {
      await axios.patch(`/api/customer/bookings/${id}/cancel`);
      toast.success("Booking cancelled.");
      await loadBookings();
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not cancel this booking." : "Could not cancel this booking.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">Your bookings</h1><p className="mt-1 text-sm text-muted-foreground">Track requests and upcoming work.</p></div><div className="flex gap-2"><Button variant="outline" render={<Link href="/dashboard/customer/payments" />}>Payments</Button><Button render={<Link href="/services" />}>Browse services</Button></div></div>
      {loading ? <PageSkeleton /> : error ? <Alert variant="destructive"><AlertTitle>Bookings unavailable</AlertTitle><AlertDescription>{error} <button type="button" onClick={() => { setLoading(true); void loadBookings(); }} className="underline underline-offset-4">Retry</button></AlertDescription></Alert> : bookings.length ? <Table><TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Technician</TableHead><TableHead>When</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{bookings.map((booking) => <TableRow key={booking.id}><TableCell className="font-medium">{booking.service.title}</TableCell><TableCell>{booking.service.technicianProfile.user.name}</TableCell><TableCell>{new Date(booking.startAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}</TableCell><TableCell>৳{booking.priceAtBooking}</TableCell><TableCell><Badge variant={booking.status === "DECLINED" || booking.status === "CANCELLED" ? "destructive" : booking.status === "PAID" || booking.status === "IN_PROGRESS" ? "default" : "secondary"}>{booking.status.replaceAll("_", " ")}</Badge></TableCell><TableCell><div className="flex gap-1">{booking.status === "ACCEPTED" && <Button size="sm" render={<Link href={`/dashboard/customer/bookings/${booking.id}/pay`} />}>Pay now</Button>}{cancellable.includes(booking.status) && <PendingButton size="sm" variant="outline" pending={pendingId === booking.id} pendingText="Cancelling" disabled={!!pendingId} onClick={() => cancelBooking(booking.id)}>Cancel</PendingButton>}{booking.status === "COMPLETED" && <Button size="sm" variant="outline" render={<Link href={`/dashboard/customer/bookings/${booking.id}/review`} />}>Review</Button>}</div></TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="No bookings yet" description="Browse services and request your first appointment." />}
    </main>
  );
}
