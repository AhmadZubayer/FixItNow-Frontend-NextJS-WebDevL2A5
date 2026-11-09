"use client";

import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import PendingButton from "@/components/pending-button";
import BackLink from "@/components/back-link";
import BookingDetailSkeleton from "@/components/booking-detail-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { paymentSchema } from "@/validations/payment.validation";

type Booking = { id: string; status: string; priceAtBooking: string; service: { title: string } };

const PayPage = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    axios.get<Booking>(`/api/customer/bookings/${id}`).then((response) => {
      if (active) setBooking(response.data);
    }).catch((failure) => {
      if (!active) return;
      if (axios.isAxiosError(failure) && failure.response?.status === 401) router.replace("/auth/login");
      else setError("We could not load this booking.");
    });
    return () => { active = false; };
  }, [id, router]);

  const startCheckout = async () => {
    if (pending) return;
    const result = paymentSchema.safeParse({ bookingId: id, provider: "STRIPE" });
    if (!result.success) {
      toast.error("This booking ID is invalid.");
      return;
    }

    setPending(true);
    try {
      const response = await axios.post<{ checkoutUrl: string }>("/api/customer/payments", result.data);
      const checkoutUrl = new URL(response.data.checkoutUrl);
      if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") throw new Error("Invalid checkout URL");
      window.location.assign(checkoutUrl.toString());
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not start Stripe Checkout." : "Could not start Stripe Checkout.");
      setPending(false);
    }
  };

  return <main className="mx-auto w-full max-w-xl flex-1 space-y-5 px-4 py-8 sm:px-6"><BackLink href="/dashboard/customer" label="Back to bookings" /><h1 className="text-2xl font-semibold tracking-tight">Pay for booking</h1>{error && <Alert variant="destructive"><AlertTitle>Booking unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}{!error && !booking && <BookingDetailSkeleton />}{booking && <div className="space-y-4 rounded-lg border bg-card text-card-foreground p-4"><div><p className="font-medium">{booking.service.title}</p><p className="mt-1 text-sm text-muted-foreground">Amount: ৳{booking.priceAtBooking}</p></div>{booking.status === "ACCEPTED" ? <PendingButton pending={pending} pendingText="Opening Stripe Checkout" onClick={startCheckout}>Continue to Stripe</PendingButton> : <p className="text-sm text-muted-foreground">This booking is {booking.status.toLowerCase().replaceAll("_", " ")} and is not ready for payment.</p>}</div>}<Button variant="ghost" render={<Link href="/dashboard/customer" />}>View bookings</Button></main>;
};

export default PayPage;
