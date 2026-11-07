import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-4 py-12 sm:px-6 sm:py-20">
      <div className="max-w-2xl space-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Home services, on your schedule</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Find a trusted technician for the work that matters.</h1>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          Explore available services, compare professionals, and request a time that works for you.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="lg" render={<Link href="/services" />}>Browse services</Button>
          <Button size="lg" variant="outline" render={<Link href="/auth/register" />}>Join FixItNow</Button>
        </div>
      </div>
      <section aria-label="How FixItNow works" className="grid gap-4 border-t pt-6 text-sm sm:grid-cols-3">
        <div><h2 className="font-medium">Browse</h2><p className="mt-1 text-muted-foreground">Find the right service and technician.</p></div>
        <div><h2 className="font-medium">Book</h2><p className="mt-1 text-muted-foreground">Choose an available time and send a request.</p></div>
        <div><h2 className="font-medium">Track</h2><p className="mt-1 text-muted-foreground">Follow the job from acceptance through completion.</p></div>
      </section>
    </main>
  );
}
