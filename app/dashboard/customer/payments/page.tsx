"use client";

import axios from "axios";
import PageBreadcrumbs from "@/components/page-breadcrumbs";
import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import PageSkeleton from "@/components/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Payment = { id: string; amount: string; status: string; provider: string; createdAt: string; booking: { service: { title: string } } };

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    axios.get<Payment[]>("/api/customer/payments").then((response) => {
      if (active) setPayments(response.data);
    }).catch(() => {
      if (active) setError("Could not load your payments. Try again later.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6"><div><PageBreadcrumbs items={[{ label: "Bookings", href: "/dashboard/customer" }, { label: "Payments" }]} /><h1 className="mt-3 text-2xl font-semibold tracking-tight">Payment history</h1></div>{loading ? <PageSkeleton /> : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : payments.length ? <Table><TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Amount</TableHead><TableHead>Provider</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{payments.map((payment) => <TableRow key={payment.id}><TableCell>{payment.booking.service.title}</TableCell><TableCell>৳{payment.amount}</TableCell><TableCell>{payment.provider}</TableCell><TableCell><Badge variant={payment.status === "COMPLETED" ? "default" : payment.status === "PENDING" ? "secondary" : "destructive"}>{payment.status.replaceAll("_", " ")}</Badge></TableCell><TableCell>{new Date(payment.createdAt).toLocaleDateString("en-BD", { timeZone: "Asia/Dhaka" })}</TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="No payments yet" description="Payments will appear here after you start Stripe Checkout." />}</main>;
}
