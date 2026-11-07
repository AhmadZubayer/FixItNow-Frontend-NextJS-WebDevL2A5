"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import PendingButton from "@/components/pending-button";
import { Label } from "@/components/ui/label";
import { bookingSchema, type BookingValues } from "@/validations/booking.validation";

type BookingFormProps = {
  services: Array<{ id: string; title: string }>;
  slots: Array<{ id: string; startAt: string; endAt: string }>;
};

export default function BookingForm({ services, slots }: BookingFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [values, setValues] = useState<BookingValues>({ serviceId: services[0]?.id ?? "", availabilitySlotId: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    axios.get<{ role: string }>("/api/session/me").then((response) => {
      if (active) setRole(response.data.role);
    }).catch(() => {
      if (active) setRole(null);
    }).finally(() => {
      if (active) setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const result = bookingSchema.safeParse(values);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setPending(true);
    try {
      await axios.post("/api/customer/bookings", result.data);
      toast.success("Booking request sent.");
      router.push("/dashboard/customer");
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message ?? "Could not request this booking." : "Could not request this booking.");
    } finally {
      setPending(false);
    }
  }

  if (!loaded) return <div className="h-7 w-28 animate-pulse rounded bg-muted" aria-label="Checking account" />;
  if (role !== "CUSTOMER") return <p className="text-sm text-muted-foreground">{role ? "Only customers can request bookings." : <><Link href="/auth/login" className="underline underline-offset-4">Log in</Link> as a customer to book.</>}</p>;
  if (!services.length || !slots.length) return <p className="text-sm text-muted-foreground">No bookable time is available right now.</p>;

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3" noValidate>
      <div className="space-y-1"><Label htmlFor="booking-service">Service</Label><select id="booking-service" value={values.serviceId} onChange={(event) => setValues({ ...values, serviceId: event.target.value })} aria-invalid={!!errors.serviceId} aria-describedby={errors.serviceId ? "booking-service-error" : undefined} className="flex h-7 w-full rounded-md border bg-background px-2 text-xs">{services.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}</select>{errors.serviceId && <p id="booking-service-error" className="text-xs text-destructive">{errors.serviceId[0]}</p>}</div>
      <div className="space-y-1"><Label htmlFor="booking-slot">Available time</Label><select id="booking-slot" value={values.availabilitySlotId} onChange={(event) => setValues({ ...values, availabilitySlotId: event.target.value })} aria-invalid={!!errors.availabilitySlotId} aria-describedby={errors.availabilitySlotId ? "booking-slot-error" : undefined} className="flex h-7 w-full rounded-md border bg-background px-2 text-xs"><option value="">Choose a time</option>{slots.map((slot) => <option key={slot.id} value={slot.id}>{new Date(slot.startAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}</option>)}</select>{errors.availabilitySlotId && <p id="booking-slot-error" className="text-xs text-destructive">{errors.availabilitySlotId[0]}</p>}</div>
      <PendingButton type="submit" pending={pending} pendingText="Sending request">Request booking</PendingButton>
    </form>
  );
}
