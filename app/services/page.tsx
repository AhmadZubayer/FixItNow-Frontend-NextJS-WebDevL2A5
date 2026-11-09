import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import EmptyState from "@/components/empty-state";
import BackLink from "@/components/back-link";
import ServiceCard from "@/components/service-card";
import ServicesFilters from "@/components/services/filters";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { getCategories, getServices, getTechniciansPage } from "@/lib/public-api";
import { searchSchema } from "@/validations/search.validation";

type SearchParams = Record<string, string | string[] | undefined>;

const ServicesPage = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  await connection();
  const raw = await searchParams;
  const initial = Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== ""));
  const result = searchSchema.safeParse(initial);
  const filters = result.success ? result.data : null;
  const serviceParams = filters ? Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => !["serviceId", "page"].includes(key) && value !== undefined).map(([key, value]) => [key, String(value)]),
  ) : {};
  const technicianParams = filters ? Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]),
  ) : {};
  technicianParams.limit = "9";
  technicianParams.page = String(filters?.page ?? 1);

  const [categories, services, technicianPage] = await Promise.all([
    getCategories(),
    filters ? getServices(serviceParams) : Promise.resolve([]),
    filters ? getTechniciansPage(technicianParams) : Promise.resolve({ technicians: [], meta: { page: 1, limit: 9, total: 0 } }),
  ]);
  const technicians = technicianPage.technicians;
  const pageCount = Math.max(1, Math.ceil(technicianPage.meta.total / 9));
  const page = technicianPage.meta.page;
  const visiblePages = Array.from({ length: Math.min(5, pageCount) }, (_, index) =>
    Math.min(Math.max(1, page - 2), Math.max(1, pageCount - 4)) + index);
  const errors = result.success ? {} : Object.fromEntries(Object.entries(result.error.flatten().fieldErrors).map(([key, messages]) => [key, messages?.[0]]));

  const hrefWith = (changes: Record<string, string>) => {
    const params = new URLSearchParams(initial);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    return `/services?${params.toString()}`;
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 bg-white px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <BackLink href="/" />
        </div>
      <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="space-y-4 border-b pb-5 lg:border-r lg:border-b-0 lg:pr-6" aria-label="Service categories">
          <h2 className="text-lg font-semibold">Services</h2>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Filter by category">
            <Link href={hrefWith({ categoryId: "", serviceId: "", page: "" })} aria-current={!filters?.categoryId ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm whitespace-nowrap hover:bg-[#EFEFEF] ${!filters?.categoryId ? "bg-[#9AE600]/30 font-semibold" : ""}`}>All</Link>
            {categories.map((category) => (
              <Link key={category.id} href={hrefWith({ categoryId: category.id, serviceId: "", page: "" })} aria-current={filters?.categoryId === category.id ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm whitespace-nowrap hover:bg-[#EFEFEF] ${filters?.categoryId === category.id ? "bg-[#9AE600]/30 font-semibold" : ""}`}>{category.name}</Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 space-y-8">
          <div className="space-y-4">
            <div><h1 className="text-3xl font-semibold tracking-tight">Technicians</h1><p className="mt-1 text-sm text-muted-foreground">Browse services and find an available professional.</p></div>
            <ServicesFilters key={new URLSearchParams(initial).toString()} categories={categories} initial={initial} errors={errors} />
            {!result.success && <p role="alert" className="text-sm text-destructive">Check the highlighted filters and try again.</p>}
          </div>
          <section className="space-y-3" aria-labelledby="service-results">
            <div className="flex items-baseline justify-between"><h2 id="service-results" className="text-lg font-semibold">Services</h2><span className="text-xs text-muted-foreground">{services.length} results</span></div>
            {services.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{services.map((service) => <ServiceCard key={service.id} service={service} filterHref={hrefWith({ serviceId: filters?.serviceId === service.id ? "" : service.id, page: "" })} selected={filters?.serviceId === service.id} />)}</div> : <EmptyState title="No services found" description="Try a different search or filter." />}
          </section>
          <section className="space-y-3" aria-labelledby="technician-results">
            <div className="flex items-baseline justify-between"><h2 id="technician-results" className="text-lg font-semibold">Technicians</h2><span className="text-xs text-muted-foreground">{technicianPage.meta.total} results</span></div>
            {filters?.serviceId && <p className="text-sm text-muted-foreground">Showing technicians for the selected service. Select that service again to clear it.</p>}
            {technicians.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{technicians.map((technician) => (
              <Link key={technician.id} href={`/technicians/${technician.id}${filters?.serviceId ? `?serviceId=${encodeURIComponent(filters.serviceId)}` : ""}`} className="flex min-h-44 flex-col gap-3 rounded-xl border border-transparent bg-[#EFEFEF] p-4 transition-colors hover:border-black focus-visible:border-black focus-visible:outline-2 focus-visible:outline-offset-2">
                <div className="flex items-start gap-3">
                  {technician.profilePhoto ? <Image src={technician.profilePhoto} alt="" width={48} height={48} unoptimized className="size-12 rounded-full object-cover" /> : <div aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-white font-semibold">{technician.user.name.charAt(0)}</div>}
                  <div><h3 className="font-semibold">{technician.user.name}</h3><p className="text-xs text-muted-foreground">{technician.location}</p></div>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{technician.bio || "Professional home services."}</p>
                <div className="mt-auto flex items-center justify-between gap-2 text-sm"><span>★ {technician.averageRating.toFixed(1)} ({technician.reviewCount})</span><span className="font-semibold">{technician.services.length ? `From ৳${Math.min(...technician.services.map((service) => Number(service.price))).toFixed(0)}` : "View profile"}</span></div>
              </Link>
            ))}</div> : <EmptyState title="No technicians found" description="Try a different search or filter." />}
            {technicianPage.meta.total > 0 && <Pagination className="pt-4"><PaginationContent>
              {page > 1 && <PaginationItem><PaginationPrevious href={hrefWith({ page: String(page - 1) })} /></PaginationItem>}
              {visiblePages.map((number) => <PaginationItem key={number}><PaginationLink href={hrefWith({ page: String(number) })} isActive={number === page}>{number}</PaginationLink></PaginationItem>)}
              {page < pageCount && <PaginationItem><PaginationNext href={hrefWith({ page: String(page + 1) })} /></PaginationItem>}
            </PaginationContent></Pagination>}
          </section>
        </div>
      </div>
    </main>
  );
};

export default ServicesPage;
