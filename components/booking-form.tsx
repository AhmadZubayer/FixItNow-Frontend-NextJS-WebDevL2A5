"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import PendingButton from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookingSchema, type BookingValues } from "@/validations/booking.validation";

type BookingSlot = { id: string; startAt: string; endAt: string; isActive: boolean; bookings: Array<{ status: string }> };
type BookingFormProps = {
  services: Array<{ id: string; title: string; price?: string; durationMinutes: number }>;
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
    <form onSubmit={handleSubmit} className="w-full space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="booking-service">Service</Label>
        <Select value={values.serviceId} onValueChange={(serviceId) => { if (serviceId) setValues({ serviceId, availabilitySlotId: "" }); setErrors({}); }}>
          <SelectTrigger id="booking-service" className="w-full bg-background" aria-invalid={!!errors.serviceId}>
            <SelectValue placeholder="Choose a service">{(value: string) => services.find((service) => service.id === value)?.title ?? "Choose a service"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => <SelectItem key={service.id} value={service.id}>{service.title}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.serviceId && <p className="text-xs text-destructive">{errors.serviceId[0]}</p>}
      </div>

      {chosenService && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background/50 p-3">
          <div>
            <span className="text-xs text-muted-foreground block">Selected service</span>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium">
              <span>{chosenService.title}</span>
            </div>
          </div>
          {chosenService.price && (
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Total price</span>
              <span className="text-xl font-bold text-foreground">৳{chosenService.price}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Choose a day (Bangladesh time)</Label>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(next) => { setDate(next); setValues((current) => ({ ...current, availabilitySlotId: "" })); }}
          disabled={(day) => !slots.some((slot) => slotDayKey(slot.startAt) === dayKey(day))}
          className="rounded-lg border bg-background"
        />
      </div>

      <fieldset className="space-y-2" aria-describedby={errors.availabilitySlotId ? "booking-slot-error" : undefined}>
        <legend className="text-sm font-semibold">Available slots</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {visibleSlots.map((slot) => {
            const fits = !!chosenService && (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) >= chosenService.durationMinutes * 60_000;
            const booked = slot.bookings.length > 0;
            const available = slot.isActive && !booked && fits;
            const isSelected = values.availabilitySlotId === slot.id;
            return (
              <Button
                key={slot.id}
                variant="outline"
                type="button"
                disabled={!available}
                aria-pressed={isSelected}
                onClick={() => { setValues((current) => ({ ...current, availabilitySlotId: slot.id })); setErrors({}); }}
                className={cn(
                  "h-auto min-w-0 flex-col items-center justify-center rounded-xl px-3 py-2.5 text-center text-sm transition-all",
                  available && "hover:border-black",
                  isSelected
                    ? "border-black bg-[#9AE600] font-semibold text-black hover:bg-[#8edb00]"
                    : "bg-background"
                )}
              >
                <span className="block font-medium">{slotTime(slot.startAt)}</span>
                <span className="text-[11px] text-muted-foreground">{booked ? "Booked" : fits ? "Available" : "Too short"}</span>
              </Button>
            );
          })}
        </div>
        {!visibleSlots.length && <p className="text-sm text-muted-foreground">Select a day to see time slots.</p>}
        {errors.availabilitySlotId && <p id="booking-slot-error" className="text-xs text-destructive">{errors.availabilitySlotId[0]}</p>}
      </fieldset>

      <PendingButton
        type="submit"
        pending={pending}
        pendingText="Sending request"
        className="w-full rounded-xl bg-[#9AE600] py-6 text-base font-semibold text-black hover:bg-[#8edb00]"
      >
        Book now <span className="sr-only">Request booking</span>
      </PendingButton>
    </form>
  );
};

export default BookingForm;
