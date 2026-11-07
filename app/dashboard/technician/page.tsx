"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import PageSkeleton from "@/components/page-skeleton";
import AvailabilityEditor from "@/components/technician/availability-editor";
import ProfileForm from "@/components/technician/profile-form";
import ServiceForm from "@/components/technician/service-form";
import { Button } from "@/components/ui/button";
import type { Category } from "@/lib/public-api";
import type { TechnicianBooking, TechnicianProfile, TechnicianService } from "@/lib/technician-types";

export default function TechnicianDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [bookings, setBookings] = useState<TechnicianBooking[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<TechnicianService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const me = await axios.get<{ role: string }>("/api/session/me");
      if (me.data.role !== "TECHNICIAN") { router.replace(`/dashboard/${me.data.role.toLowerCase()}`); return; }
      const [profileResponse, bookingResponse, categoryResponse] = await Promise.all([
        axios.get<TechnicianProfile | null>("/api/technician/profile"),
        axios.get<TechnicianBooking[]>("/api/technician/bookings"),
        axios.get<Category[]>("/api/categories"),
      ]);
      setProfile(profileResponse.data);
      setBookings(bookingResponse.data);
      setCategories(categoryResponse.data);
      setError("");
    } catch (failure) {
      if (axios.isAxiosError(failure) && failure.response?.status === 401) { router.replace("/auth/login"); return; }
      setError("Could not load your technician workspace. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  async function toggleService(service: TechnicianService) {
    if (pendingServiceId) return;
    setPendingServiceId(service.id);
    try {
      await axios.patch(`/api/technician/services/${service.id}`, { isActive: !service.isActive });
      toast.success(service.isActive ? "Service paused." : "Service activated.");
      await load();
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not update service." : "Could not update service.");
    } finally { setPendingServiceId(null); }
  }

  const upcoming = bookings.filter((booking) => ["ACCEPTED", "PAID", "IN_PROGRESS"].includes(booking.status)).length;
  const pending = bookings.filter((booking) => booking.status === "REQUESTED").length;
  const earnings = bookings.filter((booking) => booking.status === "COMPLETED").reduce((total, booking) => total + Number(booking.priceAtBooking), 0);

  return <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">Technician workspace</h1><p className="mt-1 text-sm text-muted-foreground">Manage your profile, services, availability, and jobs.</p></div><Button render={<Link href="/dashboard/technician/bookings" />}>Manage bookings</Button></div>{loading ? <PageSkeleton /> : error ? <p role="alert" className="text-sm text-destructive">{error} <button type="button" onClick={() => { setLoading(true); void load(); }} className="underline underline-offset-4">Retry</button></p> : <><section className="grid gap-3 sm:grid-cols-3" aria-label="Job overview"><div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Pending requests</p><p className="mt-2 text-2xl font-semibold">{pending}</p></div><div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Upcoming jobs</p><p className="mt-2 text-2xl font-semibold">{upcoming}</p></div><div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Completed job value</p><p className="mt-2 text-2xl font-semibold">৳{earnings.toFixed(2)}</p></div></section><section className="space-y-4" aria-labelledby="profile-heading"><h2 id="profile-heading" className="text-lg font-semibold">Your profile</h2><ProfileForm profile={profile} onSaved={() => void load()} /></section>{profile && <><section className="space-y-4" aria-labelledby="services-heading"><div className="flex items-center justify-between"><h2 id="services-heading" className="text-lg font-semibold">Your services</h2>{editing && <Button variant="ghost" onClick={() => setEditing(null)}>Add new instead</Button>}</div>{profile.services.length > 0 && <div className="grid gap-2 sm:grid-cols-2">{profile.services.map((service) => <div key={service.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"><div><p className="text-sm font-medium">{service.title}</p><p className="text-xs text-muted-foreground">৳{service.price} · {service.durationMinutes} min · {service.isActive ? "Active" : "Paused"}</p></div><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => setEditing(service)}>Edit</Button><Button size="sm" variant="outline" disabled={!!pendingServiceId} onClick={() => toggleService(service)}>{pendingServiceId === service.id ? "Saving" : service.isActive ? "Pause" : "Activate"}</Button></div></div>)}</div>}<ServiceForm key={editing?.id ?? "new"} service={editing ?? undefined} categories={categories} onSaved={() => { setEditing(null); void load(); }} /></section><section className="space-y-4" aria-labelledby="availability-heading"><h2 id="availability-heading" className="text-lg font-semibold">Availability</h2><AvailabilityEditor slots={profile.availabilitySlots} onSaved={() => void load()} /></section></>}</>}</main>;
}
