"use client";
import { usePathname } from "next/navigation";
import AdminDashboardShell from "@/components/admin/dashboard-shell";
import PageBreadcrumbs from "@/components/page-breadcrumbs";
import { routeCrumbs } from "@/components/route-breadcrumbs";
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const role = pathname.split("/")[2];
  if (role === "admin" || role === "technician") return <AdminDashboardShell role={role}>{children}</AdminDashboardShell>;
  return <div className="flex flex-1 flex-col bg-background">
    <div className="mx-auto w-full max-w-7xl min-w-0 px-4 pt-4 pb-6 sm:px-6"><PageBreadcrumbs items={routeCrumbs(pathname)} /></div>
    <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 pb-10 sm:px-6">{children}</main>
  </div>;
};
export default DashboardLayout;
