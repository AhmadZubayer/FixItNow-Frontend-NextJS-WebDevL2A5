"use client";

import axios from "axios";
import { useEffect, useState } from "react";

import AdminDataList from "@/components/admin/data-list";
import { Badge } from "@/components/ui/badge";
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

    return <AdminDataList title="Platform Payments" items={payments} searchText={(payment) => `${payment.booking.customer.name} ${payment.booking.service.technicianProfile.user.name} ${payment.booking.service.title} ${payment.method ?? payment.provider} ${payment.status.replaceAll("_", " ")} ${payment.amount}`} loading={loading} error={error} onRetry={() => { setLoading(true); setRetry((value) => value + 1); }}>
    {(rows, offset) => <div className="overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>No.</TableHead><TableHead>Date & time</TableHead><TableHead>Method</TableHead><TableHead>Customer</TableHead><TableHead>Technician</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Customer paid</TableHead><TableHead className="text-right">Technician received</TableHead><TableHead className="text-right">Platform earning</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((payment, index) => (
                <TableRow key={payment.id}>
                  <TableCell>{offset + index + 1}</TableCell>
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
          </Table></div>}
  </AdminDataList>;
};

export default AdminPaymentsPage;
