import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  return <main className="mx-auto w-full max-w-xl flex-1 space-y-4 px-4 py-8 sm:px-6"><h1 className="text-2xl font-semibold tracking-tight">Checkout cancelled</h1><p className="text-sm text-muted-foreground">No payment is confirmed by this page. Check your booking before starting another checkout.</p><Button render={<Link href="/dashboard/customer" />}>View bookings</Button></main>;
}
