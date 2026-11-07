import Link from "next/link";
import { connection } from "next/server";

import { Button } from "@/components/ui/button";
import EmptyState from "@/components/empty-state";
import ServiceCard from "@/components/service-card";
import { getServices, getTechnicians } from "@/lib/public-api";

export default async function Home() {
  await connection();
  const [services, technicians] = await Promise.all([getServices(), getTechnicians()]);
  const featuredTechnicians = [...technicians].sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount).slice(0, 3);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6 sm:py-16">
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
      <section className="space-y-4" aria-labelledby="featured-services">
        <div className="flex items-baseline justify-between gap-3"><h2 id="featured-services" className="text-xl font-semibold tracking-tight">Available services</h2><Link href="/services" className="text-xs underline underline-offset-4">View all</Link></div>
        {services.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.slice(0, 3).map((service) => <ServiceCard key={service.id} service={service} />)}</div> : <EmptyState title="No services yet" description="Check back when technicians add their services." />}
      </section>
      <section className="space-y-4" aria-labelledby="featured-technicians">
        <h2 id="featured-technicians" className="text-xl font-semibold tracking-tight">Top rated technicians</h2>
        {featuredTechnicians.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{featuredTechnicians.map((technician) => <Link key={technician.id} href={`/technicians/${technician.id}`} className="rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"><h3 className="font-medium">{technician.user.name}</h3><p className="mt-1 text-xs text-muted-foreground">{technician.location} · {technician.averageRating.toFixed(1)} rating from {technician.reviewCount} reviews</p></Link>)}</div> : <EmptyState title="No technicians yet" description="Technician profiles will appear here when available." />}
      </section>
    </main>
  );
}
