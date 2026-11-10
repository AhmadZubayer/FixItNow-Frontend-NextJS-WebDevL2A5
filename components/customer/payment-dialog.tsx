"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import PendingButton from "@/components/pending-button";
import BookingDetailSkeleton from "@/components/booking-detail-skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { paymentSchema } from "@/validations/payment.validation";

type PayableBooking = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  priceAtBooking: string;
  items?: Array<{ serviceId: string; title: string; price: string; durationMinutes: number }>;
  service: { title: string; durationMinutes: number; technicianProfile: { user: { name: string } } };
};

type Props = { bookingId: string; onClose: () => void; onBookingChanged: () => void };
const money = (value: number) => `৳${(value / 100).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateTime = (value: string) => new Date(value).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });

const BookingPaymentDialog = ({ bookingId, onClose, onBookingChanged }: Props) => {
  const [booking, setBooking] = useState<PayableBooking | null>(null);
  const [loadError, setLoadError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [retry, setRetry] = useState(0);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    axios.get<PayableBooking>(`/api/customer/bookings/${encodeURIComponent(bookingId)}`, { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) { setBooking(data); setLoadError(""); }
    }).catch(() => { if (!controller.signal.aborted) setLoadError("Could not load the booking details. Please try again."); });
    return () => controller.abort();
  }, [bookingId, retry]);

  const startCheckout = async () => {
    if (submitting.current || booking?.status !== "ACCEPTED") return;
    const result = paymentSchema.safeParse({ bookingId, provider: "STRIPE" });
    if (!result.success) { setCheckoutError("This booking ID is invalid."); return; }
    submitting.current = true;
    setPending(true);
    setCheckoutError("");
    try {
      const response = await axios.post<{ checkoutUrl: string }>("/api/customer/payments", result.data);
      const url = new URL(response.data.checkoutUrl);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Invalid checkout URL");
      window.location.assign(url.toString());
    } catch (error) {
      setCheckoutError(axios.isAxiosError(error) && typeof error.response?.data?.message === "string" ? error.response.data.message : "Could not continue to payment. Please try again.");
      if (axios.isAxiosError(error) && [401, 403, 409].includes(error.response?.status ?? 0)) onBookingChanged();
      submitting.current = false;
      setPending(false);
    }
  };

  const total = Math.round(Number(booking?.priceAtBooking ?? 0) * 100);
  const items = booking?.items?.length ? booking.items : booking ? [{ serviceId: "original", title: booking.service.title, price: booking.priceAtBooking, durationMinutes: booking.service.durationMinutes }] : [];
  const itemized = items.every((item) => Number.isFinite(Number(item.price)));
  const subtotal = items.reduce((sum, item) => sum + Math.round(Number(item.price) * 100), 0);
  const duration = items.reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0);

  return <Dialog open onOpenChange={(open) => { if (!open && !submitting.current) onClose(); }}>
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg" showCloseButton={!pending}>
      <DialogHeader><DialogTitle>Confirm booking payment</DialogTitle><DialogDescription>Review your services, appointment, and total before continuing to payment.</DialogDescription></DialogHeader>
      {loadError ? <div role="alert" className="space-y-3"><p className="text-sm text-destructive">{loadError}</p><Button variant="outline" onClick={() => { setLoadError(""); setRetry((value) => value + 1); }}>Retry</Button></div> : !booking ? <BookingDetailSkeleton /> : <>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm [&_dt]:text-muted-foreground [&_dd]:min-w-0 [&_dd]:break-words">
          <dt>Technician</dt><dd className="font-medium">{booking.service.technicianProfile.user.name}</dd>
          <dt>Starts</dt><dd><time dateTime={booking.startAt}>{dateTime(booking.startAt)}</time></dd>
          <dt>Ends</dt><dd><time dateTime={booking.endAt}>{dateTime(booking.endAt)}</time></dd>
          {duration > 0 && <><dt>Service duration</dt><dd>{duration} minutes</dd></>}
        </dl>
        <section aria-label="Price breakdown" className="space-y-3 border-y py-4">
          <h3 className="text-sm font-semibold">Services</h3>
          <ul className="space-y-3">{items.map((item, index) => <li key={item.serviceId ?? index} className="flex items-start justify-between gap-4 text-sm">
            <div className="min-w-0"><p className="break-words">{item.title}</p>{item.durationMinutes > 0 && <p className="text-xs text-muted-foreground">{item.durationMinutes} minutes</p>}</div>
            <span className="shrink-0 font-medium">{Number.isFinite(Number(item.price)) ? money(Math.round(Number(item.price) * 100)) : "Included in total"}</span>
          </li>)}</ul>
          <dl className="space-y-2 border-t pt-3 text-sm">
            {itemized && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(subtotal)}</dd></div>}
            {itemized && subtotal !== total && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Booking adjustment</dt><dd>{total < subtotal ? "−" : "+"}{money(Math.abs(total - subtotal))}</dd></div>}
            <div className="flex justify-between gap-4 font-semibold"><dt>Total payable</dt><dd>{money(total)}</dd></div>
          </dl>
        </section>
        {booking.status === "ACCEPTED" ? <p className="text-sm text-red-600">If you don’t confirm payment within 24 hours, your booking request will be cancelled automatically.</p> : <p role="alert" className="text-sm text-destructive">This booking is {booking.status.toLowerCase().replaceAll("_", " ")} and is no longer available for payment.</p>}
        {checkoutError && <p role="alert" className="text-sm text-destructive">{checkoutError}</p>}
        <DialogFooter className="flex-row justify-end">
          <PendingButton pending={pending} pendingText="Opening payment…" disabled={booking.status !== "ACCEPTED"} onClick={startCheckout}>Continue to Payment</PendingButton>
        </DialogFooter>
      </>}
    </DialogContent>
  </Dialog>;
};

export default BookingPaymentDialog;
