"use client";

import { usePathname } from "next/navigation";

const PublicSiteChrome = ({ children, mobileHeader = false }: { children: React.ReactNode; mobileHeader?: boolean }) => {
  const pathname = usePathname();
  if (/^\/dashboard\/(admin|technician)(\/|$)/.test(pathname)) {
    return mobileHeader ? <div className="sticky top-0 z-40 md:hidden">{children}</div> : null;
  }
  return children;
};

export default PublicSiteChrome;
