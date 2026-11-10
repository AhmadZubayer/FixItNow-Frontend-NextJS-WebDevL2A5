"use client";

import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, CalendarDays, CreditCard, LayoutDashboard, LogOut, MessageSquare, Tags, UserRound, Users, Wrench, BriefcaseBusiness } from "lucide-react";
import { toast } from "sonner";
import PageBreadcrumbs from "@/components/page-breadcrumbs";
import { routeCrumbs } from "@/components/route-breadcrumbs";
import SiteFooter from "@/components/site-footer";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";

const menus = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
  { label: "Technicians", href: "/dashboard/admin/technicians", icon: Wrench },
  { label: "Services", href: "/dashboard/admin/services", icon: BriefcaseBusiness },
  { label: "Platform Payments", href: "/dashboard/admin/payments", icon: CreditCard },
  { label: "Categories", href: "/dashboard/admin/categories", icon: Tags },
  { label: "Bookings", href: "/dashboard/admin/bookings", icon: CalendarDays },
  { label: "Feedbacks", href: "/dashboard/admin/feedbacks", icon: MessageSquare },
];

const technicianMenus = [
  { label: "Activity", href: "/dashboard/technician", icon: Activity },
  { label: "Earnings", href: "/dashboard/technician/earnings", icon: CreditCard },
  { label: "Booking requests", href: "/dashboard/technician/bookings", icon: CalendarDays },
  { label: "Your profile", href: "/dashboard/technician/profile", icon: UserRound },
  { label: "Availability", href: "/dashboard/technician/availability", icon: CalendarDays },
];

const AdminSidebar = ({ role }: { role: "admin" | "technician" }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    axios.get<{ name: string }>("/api/session/me").then(({ data }) => {
      if (active) setName(data.name);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const logout = async () => {
    if (pending) return;
    setPending(true);
    try {
      await axios.post("/api/session/logout");
      router.replace("/");
      router.refresh();
      toast.success("You are logged out.");
    } catch {
      toast.error("Could not log out. Please try again.");
    } finally { setPending(false); }
  };

  return <Sidebar>
    <SidebarHeader className="gap-4 p-4">
      <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
        <Wrench aria-hidden className="size-6 text-[#145b28]" />FixItNow
      </Link>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup><SidebarGroupContent>
        <nav aria-label={role === "admin" ? "Admin navigation" : "Technician navigation"}><SidebarMenu>
          {(role === "admin" ? menus : technicianMenus).map(({ label, href, icon: Icon }) => {
            const active = href === `/dashboard/${role}` ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return <SidebarMenuItem key={href}>
              <SidebarMenuButton isActive={active} className="h-10 text-sm data-active:bg-[#9AE600] data-active:text-black data-active:hover:bg-[#9AE600]" render={<Link href={href} aria-current={active ? "page" : undefined} onClick={() => setOpenMobile(false)} />}>
                <Icon aria-hidden /><span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>;
          })}
        </SidebarMenu></nav>
      </SidebarGroupContent></SidebarGroup>
    </SidebarContent>
    <SidebarFooter className="gap-2 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name || "Loading account…"}</p>
        <p className="text-xs text-muted-foreground">{role === "admin" ? "Admin" : "Technician"}</p>
      </div>
      <SidebarMenu><SidebarMenuItem>
        <SidebarMenuButton size="sm" onClick={logout} disabled={pending} className="w-fit text-red-600 hover:bg-red-50 hover:text-red-700 [&_svg]:size-3.5"><LogOut aria-hidden /><span>{pending ? "Logging out…" : "Log out"}</span></SidebarMenuButton>
      </SidebarMenuItem></SidebarMenu>
    </SidebarFooter>
  </Sidebar>;
};

const AdminDashboardShell = ({ children, role = "admin" }: { children: React.ReactNode; role?: "admin" | "technician" }) => {
  const pathname = usePathname();
  const isOverview = pathname === "/dashboard/admin";
  return <SidebarProvider className="flex-1 bg-background">
    <AdminSidebar role={role} />
    <SidebarInset className="min-w-0 bg-background">
      <main className={`w-full min-w-0 flex-1 px-4 sm:px-8 ${isOverview ? "py-3" : "py-5 sm:py-6"}`}>
        <div className={`mx-auto w-full max-w-7xl min-w-0 ${isOverview ? "space-y-3" : "space-y-8"}`}>
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <PageBreadcrumbs items={routeCrumbs(pathname)} />
          </div>
          {children}
        </div>
      </main>
      <div className={isOverview ? "mt-auto [&_footer>div]:py-3" : "mt-auto"}><SiteFooter /></div>
    </SidebarInset>
  </SidebarProvider>;
};

export default AdminDashboardShell;
