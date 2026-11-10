"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PageBreadcrumbs from "@/components/page-breadcrumbs";
import { routeCrumbs } from "@/components/route-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import AdminDashboardShell from "@/components/admin/dashboard-shell";

type TabItem = {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
};

const roleTabs: Record<string, TabItem[]> = {
  customer: [
    {
      label: "Bookings",
      href: "/dashboard/customer",
      match: (pathname: string) =>
        pathname === "/dashboard/customer" ||
        pathname.startsWith("/dashboard/customer/bookings"),
    },
    {
      label: "Payments",
      href: "/dashboard/customer/payments",
      match: (pathname: string) => pathname.startsWith("/dashboard/customer/payments"),
    },
  ],
  technician: [
    {
      label: "Overview & Services",
      href: "/dashboard/technician",
      match: (pathname: string) => pathname === "/dashboard/technician",
    },
    {
      label: "Booking requests",
      href: "/dashboard/technician/bookings",
      match: (pathname: string) => pathname.startsWith("/dashboard/technician/bookings"),
    },
  ],
  admin: [
    {
      label: "Overview & Users",
      href: "/dashboard/admin",
      match: (pathname: string) => pathname === "/dashboard/admin",
    },
    {
      label: "Technicians",
      href: "/dashboard/admin/technicians",
      match: (pathname: string) => pathname.startsWith("/dashboard/admin/technicians"),
    },
    {
      label: "Platform payments",
      href: "/dashboard/admin/payments",
      match: (pathname: string) => pathname.startsWith("/dashboard/admin/payments"),
    },
  ],
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();

  const roleSegment = pathname.split("/")[2] as "customer" | "technician" | "admin" | undefined;
  const tabs = (roleSegment && roleTabs[roleSegment]) ?? [];
  const currentTab = tabs.find((tab) => tab.match(pathname)) ?? tabs[0];
  const activeValue = currentTab?.href ?? pathname;

  if (roleSegment === "admin") return <AdminDashboardShell>{children}</AdminDashboardShell>;

  return (
    <div className="flex flex-1 flex-col bg-muted [--card:#fff]">
      {/* 1. Directly under shared navbar: Tabs for dashboard navigation */}
      {tabs.length > 0 && (
        <div className="border-b bg-background/60 backdrop-blur-xs">
          <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-2.5 sm:px-6">
            <div className="w-full min-w-0 overflow-x-auto">
              <Tabs value={activeValue} className="w-full min-w-0">
                <TabsList className="h-10 bg-muted/80 p-1">
                  {tabs.map((tab) => {
                    const isActive = tab.href === activeValue;
                    return (
                      <TabsTrigger
                        key={tab.href}
                        value={tab.href}
                        nativeButton={false}
                        onClick={() => router.push(tab.href)}
                        style={
                          isActive
                            ? { backgroundColor: "#9AE600", color: "#000000" }
                            : undefined
                        }
                        className={cn(
                          "h-8 px-4 text-xs font-medium transition-all sm:text-sm",
                          isActive
                            ? "!bg-[#9AE600] !text-black font-semibold shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        render={<Link href={tab.href} />}
                      >
                        {tab.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      )}

      {/* 2. Breadcrumbs between tab bar and main content card */}
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 pt-4 pb-2 sm:px-6">
        <PageBreadcrumbs items={routeCrumbs(pathname)} />
      </div>

      {/* 3. Selected tab's content inside main shadcn Card below breadcrumbs */}
      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 pb-8 sm:px-6">
        <Card className="w-full min-w-0 overflow-hidden rounded-xl border bg-card p-6 text-card-foreground shadow-xs sm:p-8">
          <div className="w-full min-w-0">{children}</div>
        </Card>
      </main>
    </div>
  );
};

export default DashboardLayout;
