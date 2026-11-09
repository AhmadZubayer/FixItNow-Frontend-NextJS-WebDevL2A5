"use client";

import axios from "axios";
import { useEffect, useState } from "react";

import EmptyState from "@/components/empty-state";
import PageSkeleton from "@/components/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AdminPayment = {
  id: string;
  amount: string;
  method: string | null;
  provider: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  technicianReceived: string;
  platformEarning: string;
  booking: {
    customer: { name: string };
    service: { title: string; technicianProfile: { user: { name: string } } };
  };
};

const money = (value: string) => `৳${Number(value).toFixed(2)}`;

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    axios.get<AdminPayment[]>("/api/admin/payments").then((response) => {
      if (active) {
        setPayments(response.data);
        setError("");
      }
    }).catch(() => {
      if (active) setError("Could not load platform payments. Please try again.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [retry]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform payment history</h1>
        <p className="mt-1 text-sm text-muted-foreground">Completed payments show the 85% technician share and 15% platform share. Other payment states show no realized earnings.</p>
      </div>
      {loading ? <PageSkeleton /> : error ? (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{error}</p>
          <Button variant="outline" onClick={() => { setLoading(true); setRetry((value) => value + 1); }}>Retry</Button>
        </div>
      ) : payments.length ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>No.</TableHead><TableHead>Date & time</TableHead><TableHead>Method</TableHead><TableHead>Customer</TableHead><TableHead>Technician</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Customer paid</TableHead><TableHead className="text-right">Technician received</TableHead><TableHead className="text-right">Platform earning</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.map((payment, index) => (
                <TableRow key={payment.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{new Date(payment.paidAt ?? payment.createdAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}</TableCell>
                  <TableCell>{payment.method ?? payment.provider}</TableCell>
                  <TableCell>{payment.booking.customer.name}</TableCell>
                  <TableCell>{payment.booking.service.technicianProfile.user.name}</TableCell>
                  <TableCell><Badge variant={payment.status === "COMPLETED" ? "default" : "secondary"}>{payment.status.replaceAll("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right">{money(payment.amount)}</TableCell>
                  <TableCell className="text-right">{money(payment.technicianReceived)}</TableCell>
                  <TableCell className="text-right">{money(payment.platformEarning)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : <EmptyState title="No payments yet" description="Platform payments will appear here when customers start checkout." />}
    </main>
  );
};

export default AdminPaymentsPage;
