"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import CategoryForm from "@/components/admin/category-form";
import EmptyState from "@/components/empty-state";
import PageSkeleton from "@/components/page-skeleton";
import PendingButton from "@/components/pending-button";
import SearchField from "@/components/search-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminBooking, AdminCategory, AdminUser } from "@/lib/admin-types";
import { adminSearchSchema, adminStatusSchema } from "@/validations/admin.validation";

const pageSize = 10;

const AdminDashboard = () => {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [queryError, setQueryError] = useState("");
  const [page, setPage] = useState(1);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCategory | null>(null);

  const load = useCallback(async () => {
    try {
      const me = await axios.get<{ role: string }>("/api/session/me");
      if (me.data.role !== "ADMIN") { router.replace(`/dashboard/${me.data.role.toLowerCase()}`); return; }
      const [userResponse, bookingResponse, categoryResponse] = await Promise.all([
        axios.get<AdminUser[]>("/api/admin/users"),
        axios.get<AdminBooking[]>("/api/admin/bookings"),
        axios.get<AdminCategory[]>("/api/admin/categories"),
      ]);
      setUsers(userResponse.data);
      setBookings(bookingResponse.data);
      setCategories(categoryResponse.data);
      setError("");
    } catch (failure) {
      if (axios.isAxiosError(failure) && failure.response?.status === 401) { router.replace("/auth/login"); return; }
      setError("Could not load the admin workspace. Please try again.");
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  const search = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = adminSearchSchema.safeParse({ q: queryInput });
    if (!result.success) { setQueryError(result.error.flatten().fieldErrors.q?.[0] ?? "Invalid search"); return; }
    setQueryError("");
    setQuery(result.data.q);
    setPage(1);
  };

  const changeStatus = async (user: AdminUser) => {
    if (pendingUserId) return;
    const status = user.activeStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    const result = adminStatusSchema.safeParse({ activeStatus: status });
    if (!result.success) return;
    setPendingUserId(user.id);
    try {
      await axios.patch(`/api/admin/users/${user.id}`, result.data);
      toast.success(status === "BLOCKED" ? "User blocked." : "User unblocked.");
      await load();
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not update user." : "Could not update user.");
    } finally { setPendingUserId(null); }
  };

  const visibleUsers = users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visibleUsers.length / pageSize));
  const paidValue = bookings.filter((booking) => ["PAID", "IN_PROGRESS", "COMPLETED"].includes(booking.status)).reduce((sum, booking) => sum + Number(booking.priceAtBooking), 0);

  return <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6"><div><h1 className="text-2xl font-semibold tracking-tight">Admin workspace</h1><p className="mt-1 text-sm text-muted-foreground">Review platform activity, users, and service categories.</p></div><Button variant="outline" render={<Link href="/dashboard/admin/payments" />}>Platform payments</Button><Button variant="outline" render={<Link href="/dashboard/admin/technicians" />}>Manage technicians</Button>{loading ? <PageSkeleton /> : error ? <p role="alert" className="text-sm text-destructive">{error} <Button variant="link" type="button" className="underline underline-offset-4" onClick={() => { setLoading(true); void load(); }}>Retry</Button></p> : <><section className="grid gap-3 sm:grid-cols-4" aria-label="Platform overview">{[["Users", users.length], ["Technicians", users.filter((user) => user.role === "TECHNICIAN").length], ["Bookings", bookings.length], ["Paid job value", `à§³${paidValue.toFixed(2)}`]].map(([label, value]) => <div key={label} className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</section><section className="space-y-4" aria-labelledby="users-heading"><div><h2 id="users-heading" className="text-lg font-semibold">Users</h2><p className="text-xs text-muted-foreground">{visibleUsers.length} matching users</p></div><form onSubmit={search} noValidate className="flex max-w-lg items-end gap-2"><div className="min-w-0 flex-1"><SearchField id="admin-user-search" label="Search users" value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Name, email, or role" error={queryError} /></div><Button type="submit" variant="outline">Search</Button></form>{visibleUsers.length ? <><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{visibleUsers.slice((page - 1) * pageSize, page * pageSize).map((user) => <TableRow key={user.id}><TableCell className="font-medium">{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.role}</TableCell><TableCell><Badge variant={user.activeStatus === "BLOCKED" ? "destructive" : "secondary"}>{user.activeStatus}</Badge></TableCell><TableCell><PendingButton size="sm" variant="outline" pending={pendingUserId === user.id} disabled={!!pendingUserId} onClick={() => changeStatus(user)}>{user.activeStatus === "ACTIVE" ? "Block" : "Unblock"}</PendingButton></TableCell></TableRow>)}</TableBody></Table></div><div className="flex items-center gap-2 text-sm"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</Button></div></> : <EmptyState title="No matching users" description="Try another search term." />}</section><section className="space-y-4" aria-labelledby="categories-heading"><div className="flex items-center justify-between"><h2 id="categories-heading" className="text-lg font-semibold">Categories</h2>{editing && <Button variant="ghost" onClick={() => setEditing(null)}>Add new instead</Button>}</div><div className="grid gap-2 sm:grid-cols-2">{categories.map((category) => <div key={category.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"><div><p className="text-sm font-medium">{category.name}</p><p className="text-xs text-muted-foreground">{category.slug} Â· {category.isActive ? "Active" : "Hidden"}</p></div><Button size="sm" variant="outline" onClick={() => setEditing(category)}>Edit</Button></div>)}</div><CategoryForm key={editing?.id ?? "new"} category={editing ?? undefined} onSaved={() => { setEditing(null); void load(); }} /></section><section className="space-y-3" aria-labelledby="recent-bookings-heading"><h2 id="recent-bookings-heading" className="text-lg font-semibold">Recent bookings</h2>{bookings.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Customer</TableHead><TableHead>Technician</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{bookings.slice(0, 10).map((booking) => <TableRow key={booking.id}><TableCell>{booking.service.title}</TableCell><TableCell>{booking.customer.name}</TableCell><TableCell>{booking.service.technicianProfile.user.name}</TableCell><TableCell><Badge variant="secondary">{booking.status.replaceAll("_", " ")}</Badge></TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState title="No bookings" description="Platform bookings will appear here." />}</section></>}</main>;
};

export default AdminDashboard;
