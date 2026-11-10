"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { MoreHorizontal, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminDataList from "@/components/admin/data-list";
import PendingButton from "@/components/pending-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Service = { id: string; title: string; technician: string; isApproved: boolean; isActive: boolean };
type Action = "approve" | "reject" | "pause" | "resume" | "delete";

const AdminServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    axios.get<Service[]>("/api/admin/services", { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) { setServices(data); setError(""); }
    }).catch(() => { if (!controller.signal.aborted) setError("Could not load services. Please try again."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);

  const update = async (service: Service, action: Action) => {
    if (pendingId) return;
    setPendingId(service.id);
    setPendingAction(action);
    try {
      const { data } = await axios.patch<Service>(`/api/admin/services/${service.id}`, { action });
      setServices((current) => action === "delete" ? current.filter((item) => item.id !== service.id) : current.map((item) => item.id === service.id ? data : item));
      setDeleting(null);
      toast.success({ approve: "Service approved.", reject: "Service rejected.", pause: "Service paused.", resume: "Service resumed.", delete: "Service deleted." }[action]);
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not update service." : "Could not update service.");
    } finally { setPendingId(null); setPendingAction(null); }
  };

  return <>
    <AdminDataList title="Services" items={services} searchText={(service) => `${service.title} ${service.technician} ${service.isApproved ? "Verified" : "Not verified"} ${service.isActive ? "Active" : "Paused"}`} loading={loading} error={error} onRetry={() => { setLoading(true); setRetry((value) => value + 1); }}>
      {(rows) => <div className="overflow-x-auto"><Table>
        <TableHeader><TableRow><TableHead>Service name</TableHead><TableHead>Offered by</TableHead><TableHead>Verified</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
        <TableBody>{rows.map((service) => <TableRow key={service.id}>
          <TableCell className="min-w-44 whitespace-normal font-medium">{service.title}{service.isApproved && !service.isActive && <Badge variant="secondary" className="ml-2">Paused</Badge>}</TableCell>
          <TableCell>{service.technician}</TableCell>
          <TableCell>{service.isApproved ? <Badge variant="secondary">Verified</Badge> : <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">Not verified</span><PendingButton size="sm" variant="outline" pending={pendingId === service.id && pendingAction === "approve"} disabled={!!pendingId} onClick={() => void update(service, "approve")}>Approve</PendingButton><Button size="sm" variant="ghost" className="text-red-600" disabled={!!pendingId} onClick={() => void update(service, "reject")}>Reject</Button></div>}</TableCell>
          <TableCell className="text-right"><DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${service.title} by ${service.technician}`} disabled={!!pendingId} />}><MoreHorizontal aria-hidden /></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {service.isApproved && (service.isActive ? <DropdownMenuItem onClick={() => void update(service, "pause")}><Pause aria-hidden />Pause</DropdownMenuItem> : <DropdownMenuItem onClick={() => void update(service, "resume")}><Play aria-hidden />Resume</DropdownMenuItem>)}
              {!service.isApproved && <DropdownMenuItem disabled><Pause aria-hidden />Pause</DropdownMenuItem>}
              <DropdownMenuItem className="text-red-600" onClick={() => setDeleting(service)}><Trash2 aria-hidden />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu></TableCell>
        </TableRow>)}</TableBody>
      </Table></div>}
    </AdminDataList>
    <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open && !pendingId) setDeleting(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete service?</AlertDialogTitle><AlertDialogDescription>{deleting?.title} will be removed from service listings. Existing booking and payment records will be preserved.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={!!pendingId}>Cancel</AlertDialogCancel><PendingButton variant="destructive" pending={!!pendingId} onClick={() => { if (deleting) void update(deleting, "delete"); }}>Delete service</PendingButton></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
};

export default AdminServicesPage;
