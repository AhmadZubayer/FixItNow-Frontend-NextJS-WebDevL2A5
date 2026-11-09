"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import EmptyState from "@/components/empty-state";
import PageSkeleton from "@/components/page-skeleton";
import PendingButton from "@/components/pending-button";
import SearchField from "@/components/search-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminUser } from "@/lib/admin-types";
import { adminSearchSchema, adminStatusSchema } from "@/validations/admin.validation";

const pageSize = 10;

const AdminTechniciansPage = () => {
  const router = useRouter();
  const [technicians, setTechnicians] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [queryError, setQueryError] = useState("");
  const [page, setPage] = useState(1);
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

  const search = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = adminSearchSchema.safeParse({ q: queryInput });
    if (!result.success) {
      setQueryError(result.error.flatten().fieldErrors.q?.[0] ?? "Invalid search");
      return;
    }
    setQueryError("");
    setQuery(result.data.q);
    setPage(1);
  };

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

  const matching = technicians.filter((technician) => `${technician.name} ${technician.email}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
  const visible = matching.slice((page - 1) * pageSize, page * pageSize);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Technician management</h1><p className="mt-1 text-sm text-muted-foreground">Search technician accounts and manage access.</p></div>
      <form onSubmit={search} className="flex max-w-lg items-end gap-2" noValidate>
        <div className="min-w-0 flex-1"><SearchField id="admin-technician-search" label="Search technicians" value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Name or email" error={queryError} /></div>
        <Button type="submit" variant="outline">Search</Button>
      </form>
      {loading ? <PageSkeleton /> : error ? <div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p><Button variant="outline" onClick={() => { setLoading(true); void load(); }}>Retry</Button></div> : matching.length ? (
        <>
          <div className="overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Joined</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>{visible.map((technician) => <TableRow key={technician.id}>
              <TableCell className="font-medium">{technician.name}</TableCell>
              <TableCell>{technician.email}</TableCell>
              <TableCell>{new Date(technician.createdAt).toLocaleDateString("en-BD", { timeZone: "Asia/Dhaka" })}</TableCell>
              <TableCell><Badge variant={technician.activeStatus === "BLOCKED" ? "destructive" : "secondary"}>{technician.activeStatus === "BLOCKED" ? "Banned" : "Active"}</Badge></TableCell>
              <TableCell><PendingButton size="sm" variant="outline" pending={pendingId === technician.id} disabled={!!pendingId} onClick={() => changeStatus(technician)}>{technician.activeStatus === "BLOCKED" ? "Unban" : "Ban"}</PendingButton></TableCell>
            </TableRow>)}</TableBody>
          </Table></div>
          <div className="flex items-center gap-2 text-sm"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} of {pageCount}</span><Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</Button></div>
        </>
      ) : <EmptyState title="No technicians found" description="Try another name or email." />}
    </main>
  );
};

export default AdminTechniciansPage;
