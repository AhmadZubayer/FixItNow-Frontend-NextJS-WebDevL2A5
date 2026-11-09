import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import SessionActions from "@/components/session-actions";

const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 shadow-sm backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[1fr_auto_1fr] sm:px-6">
        <Link href="/" className="col-start-1 row-start-1 text-base font-semibold tracking-tight focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring">
          FixItNow
        </Link>
        <nav aria-label="Main navigation" className="col-span-2 row-start-2 flex items-center justify-center gap-1 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:gap-2">
          <Button variant="ghost" render={<Link href="/services" />}>Services &amp; Technicians</Button>
        </nav>
        <div className="col-start-2 row-start-1 justify-self-end sm:col-start-3">
          <Suspense fallback={<div className="h-7 w-28 animate-pulse rounded bg-muted" aria-label="Loading account" />}><SessionActions /></Suspense>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
