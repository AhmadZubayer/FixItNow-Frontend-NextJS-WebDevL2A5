"use client";

import { usePathname } from "next/navigation";

import PageBreadcrumbs from "@/components/page-breadcrumbs";

type Crumb = { label: string; href?: string };

export const routeCrumbs = (pathname: string): Crumb[] => {
  if (pathname === "/") return [{ label: "Home" }];

  const parts = pathname.split("/").filter(Boolean);
  const home: Crumb = { label: "Home", href: "/" };

  if (parts[0] === "services") {
    return parts.length === 1
      ? [home, { label: "Services & Technicians" }]
      : [home, { label: "Services & Technicians", href: "/services" }, { label: "Service details" }];
  }
  if (parts[0] === "technicians") {
    return [home, { label: "Services & Technicians", href: "/services" }, { label: "Technician profile" }];
  }
  if (parts[0] === "auth") {
    return [home, { label: parts[1] === "register" ? "Create account" : "Log in" }];
  }
  if (parts[0] === "payment") {
    return [home, { label: parts[1] === "success" ? "Payment success" : "Payment cancelled" }];
  }
  if (parts[0] === "dashboard") {
    const role = parts[1] as "admin" | "customer" | "technician" | undefined;
    const workspace = role === "admin" ? "Admin workspace" : role === "technician" ? "Technician workspace" : "Customer workspace";
    if (!role || parts.length === 2) return [home, { label: workspace }];
    const parent: Crumb = { label: workspace, href: `/dashboard/${role}` };
    if (role === "admin") {
      const labels: Record<string, string> = { users: "Users", technicians: "Technicians", payments: "Platform Payments", categories: "Categories", bookings: "Bookings", feedbacks: "Feedbacks" };
      return [home, parent, { label: labels[parts[2]] ?? "Overview" }];
    }
    if (parts[2] === "payments") return [home, parent, { label: "Payments" }];
    if (parts[2] === "technicians") return [home, parent, { label: "Technicians" }];
    if (parts[2] === "bookings" && parts.length === 3) return [home, parent, { label: "Booking requests" }];
    if (parts[2] === "bookings") return [home, parent, { label: parts.at(-1) === "pay" ? "Pay for booking" : "Leave a review" }];
  }

  const last = parts.at(-1) ?? "Page";
  return [home, { label: last.charAt(0).toUpperCase() + last.slice(1).replaceAll("-", " ") }];
};

const RouteBreadcrumbs = () => {
  const pathname = usePathname();
  if (pathname === "/" || pathname.startsWith("/dashboard") || pathname.startsWith("/auth/")) return null;
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
      <PageBreadcrumbs items={routeCrumbs(pathname)} />
    </div>
  );
};

export default RouteBreadcrumbs;
