import Link from "next/link";
import { Suspense } from "react";
import { Wrench } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import SessionActions from "@/components/session-actions";

const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 shadow-sm backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[1fr_auto_1fr] sm:px-6">
        <Link href="/" className="col-start-1 row-start-1 inline-flex w-fit items-center gap-2 text-lg font-bold tracking-tight focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring">
          <Wrench aria-hidden className="size-6 text-[#145b28]" /> FixItNow
        </Link>
        <Suspense fallback={<>
          <nav aria-label="Main navigation" className="col-span-2 row-start-2 flex items-center justify-center gap-1 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:gap-2">
            <Link href="/services" className={buttonVariants({ variant: "ghost" })}>Services &amp; Technicians</Link>
          </nav>
          <div className="col-start-2 row-start-1 justify-self-end sm:col-start-3"><div className="h-7 w-28 animate-pulse rounded bg-muted" aria-label="Loading account" /></div>
        </>}><SessionActions /></Suspense>
      </div>
    </header>
  );
};

export default SiteHeader;
