import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import SessionActions from "@/components/session-actions";

export default function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring">
          FixItNow
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" render={<Link href="/services" />}>Services</Button>
          <Suspense fallback={<div className="h-7 w-28 animate-pulse rounded bg-muted" aria-label="Loading account" />}><SessionActions /></Suspense>
        </nav>
      </div>
    </header>
  );
}
