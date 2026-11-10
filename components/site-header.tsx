import Link from "next/link";
import { Suspense } from "react";
import { Wrench } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import SessionActions from "@/components/session-actions";

const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 shadow-sm backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-4 py-3 md:grid-cols-[1fr_auto_1fr] md:gap-x-3 md:px-6 md:has-[.desktop-navbar-search]:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Link href="/" className="col-start-1 row-start-1 inline-flex w-fit items-center gap-2 text-lg font-bold tracking-tight focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring">
          <Wrench aria-hidden className="size-6 text-[#145b28]" /> FixItNow
        </Link>
        <Suspense fallback={<>
          <nav aria-label="Main navigation" className="hidden md:col-span-1 md:col-start-2 md:row-start-1 md:flex md:items-center md:justify-center md:gap-2">
            <Link href="/services" className={buttonVariants({ variant: "ghost" })}>Services &amp; Technicians</Link>
          </nav>
          <div className="col-start-2 row-start-1 flex items-center gap-2 justify-self-end md:col-start-3"><div className="h-7 w-20 animate-pulse rounded bg-muted md:w-28" aria-label="Loading account" /><div className="size-9 animate-pulse rounded bg-muted md:hidden" aria-label="Loading navigation" /></div>
        </>}><SessionActions /></Suspense>
      </div>
    </header>
  );
};

export default SiteHeader;
