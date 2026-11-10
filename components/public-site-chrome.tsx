"use client";

import { usePathname } from "next/navigation";

const PublicSiteChrome = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  if (pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/")) return null;
  return children;
};

export default PublicSiteChrome;
