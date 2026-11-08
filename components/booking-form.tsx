"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import PendingButton from "@/components/pending-button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookingSchema, type BookingValues } from "@/validations/booking.validation";

type BookingSlot = { id: string; startAt: string; endAt: string; isActive: boolean; bookings: Array<{ status: string }> };
type BookingFormProps = {
  services: Array<{ id: string; title: string; durationMinutes: number }>;
  slots: BookingSlot[];
  initialServiceId?: string;
};

const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const slotDayKey = (startAt: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(startAt));
const slotTime = (value: string) => new Date(value).toLocaleTimeString("en-BD", { timeStyle: "short", timeZone: "Asia/Dhaka" });

const BookingForm = ({ services, slots, initialServiceId }: BookingFormProps) => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [values, setValues] = useState<BookingValues>({ serviceId: services.some((service) => service.id === initialServiceId) ? initialServiceId! : services[0]?.id ?? "", availabilitySlotId: "" });
  const [date, setDate] = useState<Date | undefined>(() => {
    const first = slots.find((slot) => slot.isActive && !slot.bookings.length) ?? slots[0];
    if (!first) return undefined;
    const parts = slotDayKey(first.startAt).split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const chosenService = services.find((service) => service.id === values.serviceId);
  const visibleSlots = slots.filter((slot) => date && slotDayKey(slot.startAt) === dayKey(date));

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
  };

  if (!loaded) {
    return <div className="h-7 w-28 animate-pulse rounded bg-muted" aria-label="Checking account" />;
  }
  if (role !== "CUSTOMER") {
    return <p className="text-sm text-muted-foreground">
      {role ? "Only customers can request bookings." : <><Link href="/auth/login" className="underline underline-offset-4">Log in</Link> as a customer to book.</>}
    </p>;
  }
  if (!services.length || !slots.length) {
    return <p className="text-sm text-muted-foreground">No bookable time is available right now.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4" noValidate>
      <div className="space-y-1">
        <Label htmlFor="booking-service">Service</Label>
        <Select value={values.serviceId} onValueChange={(serviceId) => { if (serviceId) setValues({ serviceId, availabilitySlotId: "" }); setErrors({}); }}>
          <SelectTrigger id="booking-service" className="w-full" aria-invalid={!!errors.serviceId}>
            <SelectValue placeholder="Choose a service">{(value: string) => services.find((service) => service.id === value)?.title ?? "Choose a service"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => <SelectItem key={service.id} value={service.id}>{service.title}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.serviceId && <p className="text-xs text-destructive">{errors.serviceId[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label>Choose a day (Bangladesh time)</Label>
        <Calendar mode="single" selected={date} onSelect={(next) => { setDate(next); setValues((current) => ({ ...current, availabilitySlotId: "" })); }} disabled={(day) => !slots.some((slot) => slotDayKey(slot.startAt) === dayKey(day))} className="rounded-lg border" />
      </div>
      <fieldset className="space-y-2" aria-describedby={errors.availabilitySlotId ? "booking-slot-error" : undefined}>
        <legend className="text-sm font-medium">Time slots</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibleSlots.map((slot) => {
            const fits = !!chosenService && (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) >= chosenService.durationMinutes * 60_000;
            const booked = slot.bookings.length > 0;
            const available = slot.isActive && !booked && fits;
            return <button
              key={slot.id}
              type="button"
              disabled={!available}
              aria-pressed={values.availabilitySlotId === slot.id}
              onClick={() => { setValues((current) => ({ ...current, availabilitySlotId: slot.id })); setErrors({}); }}
              className="rounded-md border px-3 py-2 text-left text-sm transition-colors enabled:hover:border-black enabled:focus-visible:outline-2 enabled:focus-visible:outline-offset-2 aria-pressed:border-black aria-pressed:bg-[#EFEFEF] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <span className="block">{slotTime(slot.startAt)}–{slotTime(slot.endAt)}</span>
              <span className="text-xs text-muted-foreground">{booked ? "Booked" : fits ? "Available" : "Too short"}</span>
            </button>;
          })}
        </div>
        {!visibleSlots.length && <p className="text-sm text-muted-foreground">Select a day to see time slots.</p>}
        {errors.availabilitySlotId && <p id="booking-slot-error" className="text-xs text-destructive">{errors.availabilitySlotId[0]}</p>}
      </fieldset>
      <PendingButton type="submit" pending={pending} pendingText="Sending request">Request booking</PendingButton>
    </form>
  );
};

export default BookingForm;
