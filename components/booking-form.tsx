"use client";

import axios from "axios";
import Link from "next/link";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import PendingButton from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { bookingSchema, type BookingValues } from "@/validations/booking.validation";

type BookingSlot = { id: string; startAt: string; endAt: string; isActive: boolean; bookings: Array<{ status: string }> };
type BookingFormProps = {
  services: Array<{
    id: string;
    title: string;
    price: string;
    durationMinutes: number;
    category?: { name: string };
  }>;
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
  const [values, setValues] = useState<BookingValues>({
    serviceIds: services.some(service => service.id === initialServiceId) ? [initialServiceId!] : services.slice(0, 1).map(service => service.id),
    availabilitySlotId: "",
  });
  const [date, setDate] = useState<Date | undefined>(() => {
    const first = slots.find((slot) => slot.isActive && !slot.bookings.length) ?? slots[0];
    if (!first) return undefined;
    const parts = slotDayKey(first.startAt).split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const selectedServices = services.filter(service => values.serviceIds.includes(service.id));
  const totalMinutes = selectedServices.reduce((sum, service) => sum + service.durationMinutes, 0);
  const totalPoisha = selectedServices.reduce((sum, service) => sum + Math.round(Number(service.price) * 100), 0);

  const toggleService = (id: string) => {
    setValues(current => ({
      serviceIds: current.serviceIds.includes(id)
        ? current.serviceIds.filter(selectedId => selectedId !== id)
        : [...current.serviceIds, id],
      availabilitySlotId: "",
    }));
    setErrors({});
  };
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

  return (
    <div className="space-y-6">
      {/* Provided Services Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">
          Provided services <span className="sr-only">Services and prices</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => {
            const isSelected = values.serviceIds.includes(service.id);
            return (
              <Button
                key={service.id}
                type="button"
                variant="outline"
                aria-pressed={isSelected}
                disabled={!isSelected && values.serviceIds.length >= 50}
                onClick={() => toggleService(service.id)}
                className={cn(
                  "h-auto min-w-0 justify-between gap-3 rounded-lg bg-card p-4 text-left whitespace-normal text-card-foreground hover:bg-[#9AE600] hover:text-black focus-visible:outline-green-800",
                  isSelected && "border-[#9AE600]"
                )}
              >
                <span className="min-w-0"><span className="block text-sm font-semibold sm:text-base">{service.title}</span><span className="block text-xs text-muted-foreground">{service.category?.name} · {service.durationMinutes} min</span></span>
                <span className="font-semibold text-sm sm:text-base">৳{service.price}</span>
              </Button>
            );
          })}
        </div>
      </section>

      {/* Book a Service Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">
          Book a service <span className="sr-only">Request a booking</span>
        </h2>
        <div className="rounded-xl border bg-card p-6 text-card-foreground">
          {!loaded ? (
            <div className="h-7 w-28 animate-pulse rounded bg-muted" aria-label="Checking account" />
          ) : role !== "CUSTOMER" ? (
            <p className="text-sm text-muted-foreground">
              {role ? "Only customers can request bookings." : <><Link href="/auth/login" className="underline underline-offset-4">Log in</Link> as a customer to book.</>}
            </p>
          ) : !services.length || !slots.length ? (
            <p className="text-sm text-muted-foreground">No bookable time is available right now.</p>
          ) : (
            <form onSubmit={handleSubmit} className="w-full space-y-5" noValidate>
              <div className="space-y-2 rounded-lg border bg-background/50 p-3" aria-live="polite">
                <p className="text-sm font-medium">Selected services</p>
                {selectedServices.length > 0 && <ul className="flex flex-wrap gap-2">
                  {selectedServices.map(service => (
                    <li key={service.id} className="flex min-w-0 items-center gap-1 rounded-full bg-[#9AE600] py-0.5 pr-1 pl-3 text-xs text-black">
                      <span>{service.title}</span>
                      <Button type="button" variant="ghost" size="icon-xs" className="rounded-full hover:bg-black/10 focus-visible:outline-green-800" aria-label={`Remove ${service.title}`} onClick={() => toggleService(service.id)}>
                        <X aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>}
                {errors.serviceIds && <p className="text-xs text-destructive">{errors.serviceIds[0]}</p>}
                <div className="flex items-end justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{totalMinutes} min total</span>
                  <div className="text-right">
                    <span className="block text-xs text-muted-foreground">Total price</span>
                    <span className="text-xl font-bold">৳{(totalPoisha / 100).toFixed(totalPoisha % 100 ? 2 : 0)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Choose a day (Bangladesh time)</Label>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(next) => {
                    setDate(next);
                    setValues((current) => ({ ...current, availabilitySlotId: "" }));
                  }}
                  disabled={(day) => !slots.some((slot) => slotDayKey(slot.startAt) === dayKey(day))}
                  className="rounded-lg border bg-background"
                />
              </div>

              <fieldset className="space-y-2" aria-describedby={errors.availabilitySlotId ? "booking-slot-error" : undefined}>
                <legend className="text-sm font-semibold">Available slots</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {visibleSlots.map((slot) => {
                    const fits = totalMinutes > 0 && (new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) >= totalMinutes * 60_000;
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
                        onClick={() => {
                          setValues((current) => ({ ...current, availabilitySlotId: slot.id }));
                          setErrors({});
                        }}
                        style={isSelected ? { backgroundColor: "#9AE600", color: "#000000", borderColor: "#9AE600" } : undefined}
                        className={cn(
                          "h-auto min-w-0 flex-col items-center justify-center rounded-xl px-3 py-2.5 text-center text-sm",
                          available && "hover:border-[#9AE600]",
                          isSelected
                            ? "border-[#9AE600] !bg-[#9AE600] font-semibold text-black hover:!bg-[#9AE600]"
                            : "bg-background"
                        )}
                      >
                        <span className="block font-medium">{slotTime(slot.startAt)}</span>
                        <span className="text-[11px] text-muted-foreground">{booked ? "Booked" : !totalMinutes ? "Select services" : fits ? "Available" : "Too short"}</span>
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
          )}
        </div>
      </section>
    </div>
  );
};

export default BookingForm;
