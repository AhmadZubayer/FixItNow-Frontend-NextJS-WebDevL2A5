"use client";

import { usePathname } from "next/navigation";
import PageBreadcrumbs from "@/components/page-breadcrumbs";
import { routeCrumbs } from "@/components/route-breadcrumbs";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <div className="auth-background flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
        <PageBreadcrumbs items={routeCrumbs(pathname)} />
      </div>
      {children}
    </div>
  );
};

export default AuthLayout;
