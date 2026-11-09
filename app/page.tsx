import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight, CalendarDays, CircleEllipsis, Droplets, Hammer, House, PaintRoller,
  Search, ShieldCheck, Snowflake, Sparkles, Star, WashingMachine, Wrench, Zap,
} from "lucide-react";

import EmptyState from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getCategories, getServices, getTechnician, getTechnicians } from "@/lib/public-api";

const categoryTiles = [
  { name: "Home Repair", icon: House, match: /home repair/i },
  { name: "Plumbing", icon: Droplets, match: /plumb/i },
  { name: "Electrical", icon: Zap, match: /electric/i },
  { name: "HVAC", icon: Snowflake, match: /hvac|ac repair|air condition/i },
  { name: "Appliance Repair", icon: WashingMachine, match: /appliance/i },
  { name: "Painting", icon: PaintRoller, match: /paint/i },
  { name: "Carpentry", icon: Hammer, match: /carpent/i },
  { name: "Cleaning", icon: Sparkles, match: /clean/i },
];

const steps = [
  { title: "Choose a Service", detail: "Browse and select what you need." },
  { title: "Book a Time", detail: "Pick a convenient schedule." },
  { title: "Get It Done", detail: "Your technician completes the job." },
];

const content = "mx-auto w-full max-w-[73rem] px-4 sm:px-6";
const sectionTitle = "text-xl font-bold tracking-tight sm:text-2xl";
const sectionLink = "inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[#145b28] hover:underline";

const Home = async () => {
  await connection();
  const [services, technicians, categories] = await Promise.all([getServices(), getTechnicians(), getCategories()]);
  const featuredTechnicians = [...technicians].sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount).slice(0, 3);
  const profiles = await Promise.allSettled(featuredTechnicians.filter(({ reviewCount }) => reviewCount > 0).map(({ id }) => getTechnician(id)));
  const reviews = profiles.flatMap((profile) => profile.status === "fulfilled" ? profile.value.reviews ?? [] : [])
    .filter(({ comment }) => comment?.trim())
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 2);
  const topRated = featuredTechnicians.find(({ reviewCount }) => reviewCount > 0);

  return (
    <main className="flex-1 bg-[#fcfdfc]">
      <section className="overflow-hidden bg-[radial-gradient(ellipse_at_right_bottom,#e0f3e8,transparent_68%),linear-gradient(120deg,#f3f8f4,#f9fafb)]">
        <div className={`${content} grid items-center gap-4 pt-8 sm:pt-10 lg:grid-cols-[1fr_1.13fr] lg:gap-0 lg:pt-0`}>
          <div className="relative z-10 space-y-4 lg:py-8">
            <p className="inline-block rounded-full bg-[#deeee3] px-3 py-1 text-xs font-semibold uppercase text-[#174c34]">Trusted home services, on your schedule</p>
            <h1 className="max-w-xl text-4xl leading-[1.06] font-bold tracking-tight xl:text-[2.6rem]">Find a trusted technician for the work that <span className="text-[#328d0a] underline decoration-[#9AE600] decoration-2 underline-offset-5">matters.</span></h1>
            <p className="max-w-lg text-sm leading-relaxed text-slate-700 sm:text-base">Explore home services, compare professionals, book a time that works for you, and get the job done right.</p>
            <div className="flex flex-wrap gap-3 py-1">
              <Link href="/services" className={buttonVariants({ size: "lg", className: "h-10 bg-[#125b13]! px-5 font-semibold text-white! hover:bg-[#0c4810]!" })}><Search /> Browse Services</Link>
              <Link href="/auth/register" className={buttonVariants({ size: "lg", variant: "outline", className: "h-10 bg-white px-5 font-semibold" })}>Join FixItNow</Link>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs font-semibold">
              <li className="flex items-center gap-2"><ShieldCheck className="size-5 text-[#145b28]" /> Technician Profiles</li>
              <li className="flex items-center gap-2"><CalendarDays className="size-5 text-[#145b28]" /> Flexible Scheduling</li>
              <li className="flex items-center gap-2"><Star className="size-5 text-[#145b28]" /> Customer Reviews</li>
            </ul>
          </div>
          <div className="relative isolate mx-auto w-full max-w-[39rem]">
            <Image src="/home-repair-illustration.svg" alt="" width={620} height={345} preload className="h-auto w-full" />
            {topRated && <div className="absolute top-[13%] right-[8%] flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-sm"><Star className="size-5 fill-[#328d0a] text-[#328d0a]" aria-hidden /><div><p className="text-sm font-bold">{topRated.averageRating.toFixed(1)} / 5</p><p className="text-[10px]">Top technician rating</p></div></div>}
            <div className="absolute bottom-[16%] left-[4%] flex items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-sm"><Wrench className="size-5 text-[#145b28]" aria-hidden /><div><p className="text-sm font-bold">{categories.length}</p><p className="text-[10px]">Service categories</p></div></div>
          </div>
        </div>
      </section>

      <div className={`${content} space-y-7 py-6 sm:space-y-8`}>
        <section id="browse-services" aria-labelledby="browse-title" className="scroll-mt-28 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="browse-title" className={sectionTitle}>Browse Services</h2><Link href="/services" className={sectionLink}>View all services <ArrowRight className="size-4" /></Link></div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
            {categoryTiles.map(({ name, icon: Icon, match }, index) => {
              const category = categories.find(({ name }) => match.test(name));
              const href = category ? `/services?categoryId=${encodeURIComponent(category.id)}` : `/services?q=${encodeURIComponent(name)}`;
              return <Link key={name} href={href} className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-center text-xs font-semibold shadow-xs transition-colors hover:bg-[#eafbd1] ${index === 0 ? "border-[#ddf4b9] bg-[#effbd8]" : "bg-[#f6f8f7]"}`}><Icon className="size-6 text-[#145b28]" aria-hidden />{name}</Link>;
            })}
            <Link href="/services" className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border bg-[#f6f8f7] px-1 py-2 text-center text-xs font-semibold shadow-xs hover:bg-[#eafbd1]"><CircleEllipsis className="size-6 text-[#145b28]" aria-hidden />More Services</Link>
          </div>
        </section>

        <section id="how-it-works" aria-labelledby="steps-title" className="grid scroll-mt-28 gap-4 rounded-2xl bg-[#f1f4f3] p-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <h2 id="steps-title" className={sectionTitle}>How It Works</h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {steps.map(({ title, detail }, index) => <li key={title} className="flex items-center gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#ddf8aa] font-bold">{index + 1}</span><div className="flex-1"><h3 className="text-sm font-bold">{title}</h3><p className="text-xs text-slate-700">{detail}</p></div>{index < steps.length - 1 && <ArrowRight className="hidden size-4 shrink-0 text-[#267354] xl:block" aria-hidden />}</li>)}
          </ol>
        </section>

        <section aria-labelledby="featured-services" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="featured-services" className={sectionTitle}>Available Services</h2><Link href="/services" className={sectionLink}>View all <ArrowRight className="size-4" /></Link></div>
          {services.length ? <div className="grid gap-3 md:grid-cols-3">{services.slice(0, 3).map((service) => {
            const Icon = categoryTiles.find(({ match }) => match.test(service.category.name))?.icon ?? Wrench;
            return (
              <article key={service.id} className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-xl border bg-white p-2 shadow-sm lg:grid-cols-[6rem_minmax(0,1fr)]">
                <div className="grid min-h-26 place-items-center rounded-lg bg-[radial-gradient(circle,#e6f7bb,#c6e2d6)]"><Icon className="size-9 text-[#175839]" aria-hidden /></div>
                <div className="flex min-w-0 flex-col gap-1 py-1">
                  <div className="flex flex-wrap items-start gap-x-2 gap-y-1"><h3 className="min-w-0 text-sm font-bold [overflow-wrap:anywhere]">{service.title}</h3><span className="rounded-full bg-[#e9f1ed] px-2 py-0.5 text-[10px]">{service.category.name}</span></div>
                  <p className="text-xs text-slate-600">{service.technicianProfile.user.name} · {service.technicianProfile.location}</p>
                  <p className="line-clamp-2 text-xs text-slate-600">{service.description}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-2"><span className="text-sm font-bold">৳{service.price}</span><span className="text-xs text-slate-700"><span className="text-amber-600">★</span> {service.technicianProfile.averageRating.toFixed(1)}</span><Link href={`/technicians/${service.technicianProfile.id}?serviceId=${service.id}`} className="rounded-full bg-[#9AE600] px-2.5 py-1.5 text-xs font-bold hover:bg-[#85ca00] lg:ml-auto">View Technician<span className="sr-only"> for {service.title}</span></Link></div>
                </div>
              </article>
            );
          })}</div> : <EmptyState title="No services yet" description="Check back when technicians add their services." />}
        </section>

        <section id="top-technicians" aria-labelledby="featured-technicians" className="scroll-mt-28 space-y-3">
          <h2 id="featured-technicians" className={sectionTitle}>Top Rated Technicians</h2>
          {featuredTechnicians.length ? <div className="grid gap-3 md:grid-cols-3">{featuredTechnicians.map((technician) => (
            <Link key={technician.id} href={`/technicians/${technician.id}`} className="group flex min-w-0 flex-wrap items-center gap-3 rounded-xl border bg-[#EFEFEF] p-3 transition-colors hover:bg-[#9AE600]">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#dcece3] text-[#145b28]"><Wrench className="size-5" aria-hidden /></span>
              <div className="min-w-0 flex-1"><h3 className="text-sm font-bold [overflow-wrap:anywhere]">{technician.user.name}</h3><p className="mt-1 text-xs text-slate-700"><span className="text-amber-700">★</span> {technician.location} · {technician.averageRating.toFixed(1)} ({technician.reviewCount})</p></div>
              <span className="rounded-md bg-[#e8f9cc] px-2 py-1.5 text-xs font-semibold">View Profile</span>
            </Link>
          ))}</div> : <EmptyState title="No technicians yet" description="Technician profiles will appear here when available." />}
        </section>
      </div>

      <section aria-labelledby="reviews-title" className="bg-[linear-gradient(105deg,#ebf7e6,#f5f8f8_44%,#e8f6e7)] py-5">
        <div className={`${content} grid gap-4 md:grid-cols-[1fr_3.8fr] md:items-center`}>
          <div><h2 id="reviews-title" className={sectionTitle}>What Our Customers Say</h2><p className="mt-2 text-sm text-slate-700">Reviews from people who booked through FixItNow.</p></div>
          {reviews.length ? <div className="grid gap-3 sm:grid-cols-2">{reviews.map((review) => (
            <figure key={review.id} className="flex h-full flex-col rounded-xl border bg-white p-4 shadow-xs">
              <blockquote className="flex gap-2 text-sm font-medium"><span className="text-3xl leading-6 font-bold text-[#145b28]" aria-hidden>“</span><p>{review.comment}</p></blockquote>
              <figcaption className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 text-xs font-semibold"><span>{review.customer.name}</span><span><span aria-hidden className="text-amber-600">{"★".repeat(Math.max(0, Math.min(5, Math.floor(review.rating))))}</span> {review.rating.toFixed(1)} / 5</span></figcaption>
            </figure>
          ))}</div> : <p className="text-sm text-slate-700">Customer reviews will appear here after completed jobs.</p>}
        </div>
      </section>

      <div className={`${content} py-6`}>
        <section aria-labelledby="booking-cta" className="relative isolate flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl bg-linear-to-br from-[#19533e] to-[#08361e] p-5 text-white sm:px-8">
          <Wrench className="pointer-events-none absolute -right-4 -bottom-9 -z-10 size-36 text-white/12" aria-hidden />
          <div className="flex items-center gap-4"><House className="size-9 shrink-0" aria-hidden /><div><h2 id="booking-cta" className={sectionTitle}>Need a Technician Today?</h2><p className="mt-1 text-sm text-white/85">Find home services and book a time that works for you.</p></div></div>
          <div className="flex flex-wrap gap-2"><Link href="/services" className={buttonVariants({ size: "lg", className: "bg-[#9AE600]! font-semibold text-black! hover:bg-[#85ca00]!" })}>Browse Services <ArrowRight /></Link><Link href="/auth/register?role=technician" className={buttonVariants({ size: "lg", variant: "outline", className: "border-white/70 bg-transparent font-semibold text-white hover:bg-white hover:text-[#123d2c]" })}>Become a Technician</Link></div>
        </section>
      </div>
    </main>
  );
};

export default Home;
