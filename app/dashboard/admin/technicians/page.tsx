"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import PendingButton from "@/components/pending-button";
import AdminDataList from "@/components/admin/data-list";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminUser } from "@/lib/admin-types";
import { adminStatusSchema } from "@/validations/admin.validation";

const AdminTechniciansPage = () => {
  const router = useRouter();
  const [technicians, setTechnicians] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await axios.get<AdminUser[]>("/api/admin/users");
      setTechnicians(response.data.filter((user) => user.role === "TECHNICIAN"));
      setError("");
    } catch (failure) {
      if (axios.isAxiosError(failure) && failure.response?.status === 401) {
        router.replace("/auth/login");
        return;
      }
      setError("Could not load technicians. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  const changeStatus = async (technician: AdminUser) => {
    if (pendingId) return;
    const activeStatus = technician.activeStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    const result = adminStatusSchema.safeParse({ activeStatus });
    if (!result.success) return;
    setPendingId(technician.id);
    try {
      await axios.patch(`/api/admin/users/${technician.id}`, result.data);
      toast.success(activeStatus === "BLOCKED" ? "Technician banned." : "Technician unbanned.");
      await load();
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not update technician." : "Could not update technician.");
    } finally {
      setPendingId(null);
    }
  };

  return <AdminDataList title="Technicians" items={technicians} searchText={(technician) => `${technician.name} ${technician.email} ${technician.activeStatus}`} loading={loading} error={error} onRetry={() => { setLoading(true); void load(); }}>
    {(rows) => <div className="overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Joined</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map((technician) => <TableRow key={technician.id}>
              <TableCell className="font-medium">{technician.name}</TableCell>
              <TableCell>{technician.email}</TableCell>
              <TableCell>{new Date(technician.createdAt).toLocaleDateString("en-BD", { timeZone: "Asia/Dhaka" })}</TableCell>
              <TableCell><Badge variant={technician.activeStatus === "BLOCKED" ? "destructive" : "secondary"}>{technician.activeStatus === "BLOCKED" ? "Banned" : "Active"}</Badge></TableCell>
              <TableCell><PendingButton size="sm" variant="outline" pending={pendingId === technician.id} disabled={!!pendingId} onClick={() => changeStatus(technician)}>{technician.activeStatus === "BLOCKED" ? "Unban" : "Ban"}</PendingButton></TableCell>
            </TableRow>)}</TableBody>
          </Table></div>}
  </AdminDataList>;
};

export default AdminTechniciansPage;
