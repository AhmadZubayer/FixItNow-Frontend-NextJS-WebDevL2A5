import Link from "next/link";
import { connection } from "next/server";

import { Button } from "@/components/ui/button";
import EmptyState from "@/components/empty-state";
import ServiceCard from "@/components/service-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCategories, getServices, getTechnicians } from "@/lib/public-api";
import { searchSchema } from "@/validations/search.validation";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ServicesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const raw = await searchParams;
  const values = Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== "" && value !== undefined));
  const result = searchSchema.safeParse(values);
  const categories = await getCategories();
  const filters = result.success ? result.data : null;
  const apiFilters = filters ? Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => key !== "q" && value !== undefined).map(([key, value]) => [key, String(value)]),
  ) : undefined;
  const [services, technicians] = filters ? await Promise.all([
    getServices(apiFilters),
    getTechnicians(Object.fromEntries(Object.entries(apiFilters ?? {}).filter(([key]) => ["categoryId", "location", "minRating"].includes(key)))),
  ]) : [[], []];
  const query = filters?.q?.toLowerCase();
  const visibleServices = query ? services.filter((service) => [service.title, service.description, service.technicianProfile.user.name].some((part) => part.toLowerCase().includes(query))) : services;
  const visibleTechnicians = query ? technicians.filter((technician) => [technician.user.name, technician.bio ?? "", ...technician.skills].some((part) => part.toLowerCase().includes(query))) : technicians;
  const errors = result.success ? {} : result.error.flatten().fieldErrors;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Browse services</h1>
        <p className="text-sm text-muted-foreground">Find available professionals by category, location, rating, and price.</p>
      </div>
      <form action="/services" method="get" className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Service filters">
        <div className="space-y-1"><Label htmlFor="q">Search</Label><Input id="q" name="q" defaultValue={typeof raw.q === "string" ? raw.q : ""} placeholder="Service or technician" aria-invalid={!!errors.q} aria-describedby={errors.q ? "q-error" : undefined} />{errors.q && <p id="q-error" className="text-xs text-destructive">{errors.q[0]}</p>}</div>
        <div className="space-y-1"><Label htmlFor="categoryId">Category</Label><select id="categoryId" name="categoryId" defaultValue={typeof raw.categoryId === "string" ? raw.categoryId : ""} aria-invalid={!!errors.categoryId} aria-describedby={errors.categoryId ? "category-error" : undefined} className="flex h-7 w-full rounded-md border bg-background px-2 text-xs"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errors.categoryId && <p id="category-error" className="text-xs text-destructive">{errors.categoryId[0]}</p>}</div>
        <div className="space-y-1"><Label htmlFor="location">Location</Label><Input id="location" name="location" defaultValue={typeof raw.location === "string" ? raw.location : ""} placeholder="City or area" aria-invalid={!!errors.location} aria-describedby={errors.location ? "location-error" : undefined} />{errors.location && <p id="location-error" className="text-xs text-destructive">{errors.location[0]}</p>}</div>
        <div className="space-y-1"><Label htmlFor="minRating">Minimum rating</Label><select id="minRating" name="minRating" defaultValue={typeof raw.minRating === "string" ? raw.minRating : ""} aria-invalid={!!errors.minRating} aria-describedby={errors.minRating ? "rating-error" : undefined} className="flex h-7 w-full rounded-md border bg-background px-2 text-xs"><option value="">Any rating</option>{[3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating}+ stars</option>)}</select>{errors.minRating && <p id="rating-error" className="text-xs text-destructive">{errors.minRating[0]}</p>}</div>
        <div className="space-y-1"><Label htmlFor="minPrice">Minimum price</Label><Input id="minPrice" name="minPrice" inputMode="decimal" defaultValue={typeof raw.minPrice === "string" ? raw.minPrice : ""} aria-invalid={!!errors.minPrice} aria-describedby={errors.minPrice ? "min-price-error" : undefined} />{errors.minPrice && <p id="min-price-error" className="text-xs text-destructive">{errors.minPrice[0]}</p>}</div>
        <div className="space-y-1"><Label htmlFor="maxPrice">Maximum price</Label><Input id="maxPrice" name="maxPrice" inputMode="decimal" defaultValue={typeof raw.maxPrice === "string" ? raw.maxPrice : ""} aria-invalid={!!errors.maxPrice} aria-describedby={errors.maxPrice ? "max-price-error" : undefined} />{errors.maxPrice && <p id="max-price-error" className="text-xs text-destructive">{errors.maxPrice[0]}</p>}</div>
        <div className="flex items-end gap-2 lg:col-span-2"><Button type="submit">Apply filters</Button><Button variant="ghost" render={<Link href="/services" />}>Clear</Button></div>
      </form>
      {!result.success && <p role="alert" className="text-sm text-destructive">Check the highlighted filters and try again.</p>}
      <section className="space-y-3" aria-labelledby="service-results"><div className="flex items-baseline justify-between"><h2 id="service-results" className="text-lg font-semibold">Services</h2><span className="text-xs text-muted-foreground">{visibleServices.length} results</span></div>{visibleServices.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div> : <EmptyState title="No services found" description="Try a different search or filter." />}</section>
      <section className="space-y-3" aria-labelledby="technician-results"><div className="flex items-baseline justify-between"><h2 id="technician-results" className="text-lg font-semibold">Technicians</h2><span className="text-xs text-muted-foreground">{visibleTechnicians.length} results</span></div>{visibleTechnicians.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visibleTechnicians.map((technician) => <Link key={technician.id} href={`/technicians/${technician.id}`} className="rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"><h3 className="font-medium">{technician.user.name}</h3><p className="mt-1 text-xs text-muted-foreground">{technician.location} · {technician.averageRating.toFixed(1)} rating</p><p className="mt-2 line-clamp-2 text-xs">{technician.bio}</p></Link>)}</div> : <EmptyState title="No technicians found" description="Try a different search or filter." />}</section>
    </main>
  );
}
