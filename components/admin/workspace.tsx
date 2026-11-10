"use client";

import axios from "axios";
import { bookingLabel } from "@/lib/booking-label";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import CategoryForm from "@/components/admin/category-form";
import PendingButton from "@/components/pending-button";
import AdminDataList from "@/components/admin/data-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminBooking, AdminCategory, AdminPaymentSummary, AdminUser } from "@/lib/admin-types";
import { adminStatusSchema } from "@/validations/admin.validation";

type WorkspaceView = "overview" | "users" | "categories" | "bookings";

const AdminWorkspace = ({ view }: { view: WorkspaceView }) => {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [payments, setPayments] = useState<AdminPaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminCategory | null>(null);

  const load = useCallback(async () => {
    try {
      const me = await axios.get<{ role: string }>("/api/session/me");
      if (me.data.role !== "ADMIN") { router.replace(`/dashboard/${me.data.role.toLowerCase()}`); return; }
      const [userResponse, bookingResponse, categoryResponse, paymentResponse] = await Promise.all([
        view === "overview" || view === "users" ? axios.get<AdminUser[]>("/api/admin/users") : Promise.resolve({ data: [] }),
        view === "overview" || view === "bookings" ? axios.get<AdminBooking[]>("/api/admin/bookings") : Promise.resolve({ data: [] }),
        view === "categories" ? axios.get<AdminCategory[]>("/api/admin/categories") : Promise.resolve({ data: [] }),
        view === "overview" ? axios.get<AdminPaymentSummary[]>("/api/admin/payments") : Promise.resolve({ data: [] }),
      ]);
      setUsers(userResponse.data);
      setBookings(bookingResponse.data);
      setCategories(categoryResponse.data);
      setPayments(paymentResponse.data);
      setError("");
    } catch (failure) {
      if (axios.isAxiosError(failure) && failure.response?.status === 401) { router.replace("/auth/login"); return; }
      setError("Could not load the admin workspace. Please try again.");
    } finally { setLoading(false); }
  }, [router, view]);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

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

  const activeBookings = bookings.filter((booking) => ["REQUESTED", "ACCEPTED", "PAID", "IN_PROGRESS"].includes(booking.status)).length;
  const platformRevenue = payments.filter((payment) => payment.status === "COMPLETED").reduce((sum, payment) => sum + Number(payment.platformEarning), 0);

  const retry = () => { setLoading(true); void load(); };
  const state = { loading, error, onRetry: retry };

  if (view === "overview") {
    const metrics = [
      { label: "Users", value: users.length },
      { label: "Technicians", value: users.filter((user) => user.role === "TECHNICIAN").length },
      { label: "Active bookings", value: activeBookings },
      { label: "Platform revenue", value: `৳${platformRevenue.toFixed(2)}` },
    ];
    return <AdminDataList title="Overview" items={metrics} searchText={(metric) => metric.label} showCount={false} paginate={false} {...state}>
      {(rows) => <section className="grid gap-3 sm:grid-cols-4" aria-label="Platform overview">{rows.map((metric) => <div key={metric.label} className="py-3 sm:pr-6"><p className="text-xs text-muted-foreground">{metric.label}</p><p className="mt-2 text-2xl font-semibold">{metric.value}</p></div>)}</section>}
    </AdminDataList>;
  }

  if (view === "users") return <AdminDataList title="Users" items={users} searchText={(user) => `${user.name} ${user.email} ${user.role} ${user.activeStatus}`} {...state}>
    {(rows) => <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{rows.map((user) => <TableRow key={user.id}><TableCell className="font-medium">{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.role}</TableCell><TableCell><Badge variant={user.activeStatus === "BLOCKED" ? "destructive" : "secondary"}>{user.activeStatus}</Badge></TableCell><TableCell><PendingButton size="sm" variant="outline" pending={pendingUserId === user.id} disabled={!!pendingUserId} onClick={() => changeStatus(user)}>{user.activeStatus === "ACTIVE" ? "Block" : "Unblock"}</PendingButton></TableCell></TableRow>)}</TableBody></Table></div>}
  </AdminDataList>;

  if (view === "bookings") return <AdminDataList title="Bookings" items={bookings} searchText={(booking) => `${bookingLabel(booking)} ${booking.customer.name} ${booking.service.technicianProfile.user.name} ${booking.status.replaceAll("_", " ")}`} {...state}>
    {(rows) => <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Customer</TableHead><TableHead>Technician</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{rows.map((booking) => <TableRow key={booking.id}><TableCell>{bookingLabel(booking)}</TableCell><TableCell>{booking.customer.name}</TableCell><TableCell>{booking.service.technicianProfile.user.name}</TableCell><TableCell><Badge variant="secondary">{booking.status.replaceAll("_", " ")}</Badge></TableCell></TableRow>)}</TableBody></Table></div>}
  </AdminDataList>;

  return <div className="space-y-8">
    <AdminDataList title="Categories" items={categories} searchText={(category) => `${category.name} ${category.slug} ${category.description ?? ""} ${category.isActive ? "Active" : "Hidden"}`} {...state}>
      {(rows) => <div className="overflow-x-auto"><Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
        <TableBody>{rows.map((category) => <TableRow key={category.id}>
          <TableCell className="font-medium">{category.name}</TableCell><TableCell>{category.slug}</TableCell><TableCell>{category.isActive ? "Active" : "Hidden"}</TableCell>
          <TableCell><Button size="sm" variant="outline" onClick={() => setEditing(category)}>Edit</Button></TableCell>
        </TableRow>)}</TableBody>
      </Table></div>}
    </AdminDataList>
    {!loading && !error && <section className="max-w-xl space-y-4" aria-label="Category form">
      <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">{editing ? "Edit category" : "Add category"}</h2>{editing && <Button variant="ghost" onClick={() => setEditing(null)}>Add new instead</Button>}</div>
      <CategoryForm key={editing?.id ?? "new"} category={editing ?? undefined} onSaved={() => { setEditing(null); void load(); }} />
    </section>}
  </div>;
};

export default AdminWorkspace;
