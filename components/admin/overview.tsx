"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { AreaChart } from "@/components/ui/area-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageSkeleton from "@/components/page-skeleton";
import type { AdminBooking, AdminPaymentSummary, AdminUser } from "@/lib/admin-types";
import { monthChange, summarizeMonth } from "@/lib/admin-overview";

type Health = { success?: boolean; message: string; data?: { server?: string; database?: string } };
type DashboardData = { users: AdminUser[]; bookings: AdminBooking[]; payments: AdminPaymentSummary[]; checkedAt: string };
const money = (value: number) => `৳${value.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AdminOverview = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [health, setHealth] = useState<Health | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const options = { signal: controller.signal, headers: { "Cache-Control": "no-cache" } };

    Promise.all([
      axios.get<AdminUser[]>("/api/admin/users", options),
      axios.get<AdminBooking[]>("/api/admin/bookings", options),
      axios.get<AdminPaymentSummary[]>("/api/admin/payments", options),
    ]).then(([users, bookings, payments]) => {
      if (active) { setData({ users: users.data, bookings: bookings.data, payments: payments.data, checkedAt: new Date().toISOString() }); setError(""); }
    }).catch(() => { if (active) setError("Could not load the overview. Please try again."); });

    axios.get<Health>("/api/admin/health", { ...options, validateStatus: () => true }).then((response) => {
      if (active) setHealth({ ...response.data, success: response.status === 200 && response.data.success === true });
    }).catch(() => { if (active) setHealth({ success: false, message: "Unable to reach the backend. Please try again." }); });

    return () => { active = false; controller.abort(); };
  }, [retry]);

  const refresh = () => { setData(null); setError(""); setHealth(null); setRetry((value) => value + 1); };
  const now = data ? new Date(data.checkedAt) : new Date();
  const month = now.toLocaleDateString("en-BD", { month: "long", year: "numeric", timeZone: "Asia/Dhaka" });
  const earnings = summarizeMonth((data?.payments ?? []).filter((payment) => payment.status === "COMPLETED").map((payment) => ({ date: payment.paidAt ?? payment.createdAt, value: Number(payment.platformEarning) })), now);
  const users = summarizeMonth((data?.users ?? []).map((user) => ({ date: user.createdAt, value: 1 })), now);
  const technicians = summarizeMonth((data?.users ?? []).filter((user) => user.role === "TECHNICIAN").map((user) => ({ date: user.createdAt, value: 1 })), now);
  const bookings = summarizeMonth((data?.bookings ?? []).map((booking) => ({ date: booking.createdAt, value: 1 })), now);

  const summary = (label: string, stats: ReturnType<typeof summarizeMonth>) => <div className="w-full space-y-2">
    <div className="flex flex-wrap items-end justify-between gap-2"><p><span className="text-2xl font-semibold">{stats.total.toLocaleString("en-BD")}</span><span className="ml-2 text-muted-foreground">Total {label.toLowerCase()}</span></p><p className="text-xs text-muted-foreground">{stats.thisMonth} new this month</p></div>
    <p className="text-xs text-muted-foreground">{monthChange(stats.thisMonth, stats.lastMonth)}</p>
  </div>;

  const healthCard = <Card className="min-w-0 lg:col-start-1 lg:row-start-3" aria-labelledby="system-health-heading">
    <CardHeader><h2 id="system-health-heading" className="text-sm font-medium">System Health</h2></CardHeader>
    <CardContent className="space-y-3">
      <p role="status" className="flex items-start gap-2 text-sm"><span aria-hidden className={`mt-1 size-2.5 shrink-0 rounded-full ${health === null ? "animate-pulse bg-slate-400" : health.success ? "bg-green-500" : "bg-red-500"}`} /><span>{health?.message || "Checking backend and database…"}</span></p>
      {health?.data && <dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Backend</dt><dd className="mt-1 capitalize">{health.data.server ?? "Unknown"}</dd></div><div><dt className="text-muted-foreground">Database</dt><dd className="mt-1 capitalize">{health.data.database ?? "Unknown"}</dd></div></dl>}
      {health && !health.success && <Button variant="outline" size="sm" onClick={refresh}>Check again</Button>}
    </CardContent>
  </Card>;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold tracking-tight">Overview</h1><p className="mt-1 text-sm text-muted-foreground">{month} · Monthly activity across four weekly periods</p></div>
    {error ? <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={refresh}>Retry</Button></div> : !data ? <PageSkeleton /> : null}
    <div className="grid min-w-0 gap-5 lg:grid-cols-2" role="region" aria-label="Platform overview">
      {data && <>
        <AreaChart withCard title="Platform Earnings" seriesLabel="Platform earnings (BDT)" description="Completed payments · this month" data={earnings.weeks} className="min-w-0 lg:col-start-1 lg:row-span-2" chartClassName="h-72 lg:h-96" footer={<div className="w-full space-y-4">
          <div><p className="text-xs text-muted-foreground">Total earnings</p><p className="mt-1 text-3xl font-semibold">{money(earnings.total)}</p></div>
          <dl className="grid grid-cols-2 gap-4"><div><dt className="text-xs text-muted-foreground">Today</dt><dd className="mt-1 text-lg font-semibold">{money(earnings.today)}</dd></div><div><dt className="text-xs text-muted-foreground">This month</dt><dd className="mt-1 text-lg font-semibold">{money(earnings.thisMonth)}</dd></div></dl>
          <p className="text-xs text-muted-foreground">{monthChange(earnings.thisMonth, earnings.lastMonth, money)}</p>
        </div>} />
        <AreaChart withCard title="Users" seriesLabel="New users" description="New registrations · this month" data={users.weeks} className="min-w-0 lg:col-start-2 lg:row-start-1" chartClassName="h-28" footer={summary("users", users)} />
        <AreaChart withCard title="Technicians" seriesLabel="New technicians" description="New technician accounts · this month" data={technicians.weeks} className="min-w-0 lg:col-start-2 lg:row-start-2" chartClassName="h-28" footer={summary("technicians", technicians)} />
      </>}
      {healthCard}
      {data && <AreaChart withCard title="Bookings" seriesLabel="New bookings" description="Bookings created · this month" data={bookings.weeks} className="min-w-0 lg:col-start-2 lg:row-start-3" chartClassName="h-28" footer={summary("bookings", bookings)} />}
    </div>
  </div>;
};

export default AdminOverview;
