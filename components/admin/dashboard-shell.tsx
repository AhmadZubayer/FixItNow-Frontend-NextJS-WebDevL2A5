"use client";

import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, CreditCard, LayoutDashboard, LogOut, MessageSquare, Tags, Users, Wrench } from "lucide-react";
import { toast } from "sonner";
import PageBreadcrumbs from "@/components/page-breadcrumbs";
import { routeCrumbs } from "@/components/route-breadcrumbs";
import SiteFooter from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarSeparator, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";

const menus = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
  { label: "Technicians", href: "/dashboard/admin/technicians", icon: Wrench },
  { label: "Platform Payments", href: "/dashboard/admin/payments", icon: CreditCard },
  { label: "Categories", href: "/dashboard/admin/categories", icon: Tags },
  { label: "Bookings", href: "/dashboard/admin/bookings", icon: CalendarDays },
  { label: "Feedbacks", href: "/dashboard/admin/feedbacks", icon: MessageSquare },
];

const AdminSidebar = () => {
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
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name || "Loading account…"}</p>
        <p className="text-xs text-muted-foreground">Admin</p>
      </div>
    </SidebarHeader>
    <SidebarSeparator />
    <SidebarContent>
      <SidebarGroup><SidebarGroupContent>
        <nav aria-label="Admin navigation"><SidebarMenu>
          {menus.map(({ label, href, icon: Icon }) => {
            const active = href === "/dashboard/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return <SidebarMenuItem key={href}>
              <SidebarMenuButton isActive={active} className="h-10 text-sm" render={<Link href={href} aria-current={active ? "page" : undefined} onClick={() => setOpenMobile(false)} />}>
                <Icon aria-hidden /><span>{label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>;
          })}
        </SidebarMenu></nav>
      </SidebarGroupContent></SidebarGroup>
    </SidebarContent>
    <SidebarFooter><SidebarMenu><SidebarMenuItem>
      <SidebarMenuButton onClick={logout} disabled={pending} className="h-10 text-sm"><LogOut aria-hidden /><span>{pending ? "Logging out…" : "Log out"}</span></SidebarMenuButton>
    </SidebarMenuItem></SidebarMenu></SidebarFooter>
  </Sidebar>;
};

const AdminDashboardShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  return <SidebarProvider className="flex-1 bg-muted [--card:#fff]">
    <AdminSidebar />
    <SidebarInset className="min-w-0 bg-muted">
      <header className="flex min-h-14 items-center gap-3 border-b bg-background px-4 sm:px-6">
        <SidebarTrigger />
        <PageBreadcrumbs items={routeCrumbs(pathname)} />
      </header>
      <main className="w-full min-w-0 flex-1 p-4 sm:p-6">
        <Card className="mx-auto w-full max-w-7xl min-w-0 overflow-hidden bg-card p-4 sm:p-6">{children}</Card>
      </main>
      <SiteFooter />
    </SidebarInset>
  </SidebarProvider>;
};

export default AdminDashboardShell;
