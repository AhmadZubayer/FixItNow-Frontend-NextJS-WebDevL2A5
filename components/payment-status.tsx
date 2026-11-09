"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bookingLabel, type BookingLabel } from "@/lib/booking-label";

type Payment = { status: string; bookingId: string; amount: string; booking: BookingLabel & { status: string } };

export default function PaymentStatus({ paymentId }: { paymentId: string }) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState("");
  const status = payment?.status;

  useEffect(() => {
    let active = true;
    async function checkStatus() {
      try {
        const response = await axios.get<Payment>(`/api/customer/payments/${paymentId}`);
        if (active) { setPayment(response.data); setError(""); }
      } catch {
        if (active) setError("We could not check the payment yet. Open your bookings to check its status.");
      }
    }
    void checkStatus();
    const interval = window.setInterval(() => { if (!status || status === "PENDING") void checkStatus(); }, 3000);
    return () => { active = false; window.clearInterval(interval); };
  }, [paymentId, status]);

  return <div className="space-y-4"><h1 className="text-2xl font-semibold tracking-tight">Payment status</h1>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{!payment && !error && <p className="text-sm text-muted-foreground">Checking the payment record…</p>}{payment && <div className="space-y-2 rounded-lg border bg-card text-card-foreground p-4"><p className="font-medium">{bookingLabel(payment.booking)}</p><p className="text-sm">Amount: ৳{payment.amount}</p><Badge variant={payment.status === "COMPLETED" ? "default" : payment.status === "PENDING" ? "secondary" : "destructive"}>{payment.status.replaceAll("_", " ")}</Badge><p className="text-sm text-muted-foreground">{payment.status === "COMPLETED" && ["PAID", "IN_PROGRESS", "COMPLETED"].includes(payment.booking.status) ? "Stripe payment confirmed by the server." : payment.status === "PENDING" ? "Stripe has returned you to FixItNow. We are waiting for server confirmation." : "This payment was not confirmed. Check your booking before trying again."}</p></div>}<Button render={<Link href="/dashboard/customer" />}>View bookings</Button></div>;
}
