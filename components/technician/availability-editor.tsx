"use client";

import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";

import PendingButton from "@/components/pending-button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { AvailabilitySlot } from "@/lib/technician-types";
import { availabilitySchema, type AvailabilityValues } from "@/validations/availability.validation";

export default function AvailabilityEditor({ slots, onSaved }: { slots: AvailabilitySlot[]; onSaved: () => void }) {
  const [values, setValues] = useState<AvailabilityValues>({ startAt: "", endAt: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [blockingId, setBlockingId] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const result = availabilitySchema.safeParse(values);
    if (!result.success) { setErrors(result.error.flatten().fieldErrors); return; }
    setErrors({});
    setPending(true);
    try {
      await axios.put("/api/technician/availability", result.data);
      toast.success("Availability added.");
      setValues({ startAt: "", endAt: "" });
      onSaved();
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not add availability." : "Could not add availability.");
    } finally {
      setPending(false);
    }
  }

  async function block(id: string) {
    if (blockingId) return;
    setBlockingId(id);
    try {
      await axios.patch(`/api/technician/availability/${id}/block`);
      toast.success("Time blocked.");
      onSaved();
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not block this time." : "Could not block this time.");
    } finally {
      setBlockingId(null);
    }
  }

  return <div className="space-y-4"><form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" noValidate><div className="space-y-1"><Label htmlFor="slot-start">Start (Bangladesh time)</Label><input id="slot-start" type="datetime-local" value={values.startAt} onChange={(event) => setValues({ ...values, startAt: event.target.value })} aria-invalid={!!errors.startAt} aria-describedby={errors.startAt ? "slot-start-error" : undefined} className="flex h-7 w-full rounded-md border bg-background px-2 text-xs" />{errors.startAt && <p id="slot-start-error" className="text-xs text-destructive">{errors.startAt[0]}</p>}</div><div className="space-y-1"><Label htmlFor="slot-end">End (Bangladesh time)</Label><input id="slot-end" type="datetime-local" value={values.endAt} onChange={(event) => setValues({ ...values, endAt: event.target.value })} aria-invalid={!!errors.endAt} aria-describedby={errors.endAt ? "slot-end-error" : undefined} className="flex h-7 w-full rounded-md border bg-background px-2 text-xs" />{errors.endAt && <p id="slot-end-error" className="text-xs text-destructive">{errors.endAt[0]}</p>}</div><div className="flex items-end"><PendingButton type="submit" pending={pending} pendingText="Adding time">Add time</PendingButton></div></form><div className="space-y-2">{slots.length ? slots.map((slot) => <div key={slot.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"><div className="text-xs">{new Date(slot.startAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })} – {new Date(slot.endAt).toLocaleTimeString("en-BD", { timeStyle: "short", timeZone: "Asia/Dhaka" })}</div><div className="flex items-center gap-2"><Badge variant={slot.bookings.length ? "outline" : slot.isActive ? "secondary" : "destructive"}>{slot.bookings.length ? "Booked" : slot.isActive ? "Open" : "Blocked"}</Badge>{slot.isActive && !slot.bookings.length && <PendingButton size="sm" variant="outline" pending={blockingId === slot.id} pendingText="Blocking" disabled={!!blockingId} onClick={() => block(slot.id)}>Block</PendingButton>}</div></div>) : <p className="text-sm text-muted-foreground">No upcoming availability yet.</p>}</div></div>;
}
