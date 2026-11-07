import { z } from "zod";
import Link from "next/link";

import PaymentStatus from "@/components/payment-status";
import { Button } from "@/components/ui/button";

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ paymentId?: string }> }) {
  const { paymentId } = await searchParams;

  return <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">{paymentId && z.uuid().safeParse(paymentId).success ? <PaymentStatus paymentId={paymentId} /> : <div className="space-y-3"><h1 className="text-2xl font-semibold tracking-tight">Payment status</h1><p className="text-sm text-muted-foreground">The payment reference is missing. Check your booking history for the latest confirmed status.</p><Button render={<Link href="/dashboard/customer" />}>View bookings</Button></div>}</main>;
}
