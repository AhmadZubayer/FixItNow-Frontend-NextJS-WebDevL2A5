"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";

import SearchField from "@/components/search-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/lib/public-api";

type FilterValues = Record<string, string>;
type FilterErrors = Record<string, string | undefined>;

type ServicesFiltersProps = {
  categories: Category[];
  initial: FilterValues;
  errors: FilterErrors;
};

const selectValue = (value: string | undefined) => value || "all";

const ServicesFilters = ({ categories, initial, errors }: ServicesFiltersProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const paramsRef = useRef(new URLSearchParams(initial));
  const [search, setSearch] = useState(initial.q ?? "");

  const update = useCallback((changes: FilterValues) => {
    const params = new URLSearchParams(paramsRef.current);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    paramsRef.current = params;
    startTransition(() => router.push(`/services?${params.toString()}`));
  }, [router, startTransition]);


  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,3fr)]" aria-label="Service filters">
      <form onSubmit={(event) => { event.preventDefault(); update({ q: search.trim() }); }} role="search">
        <SearchField id="service-search" label="Search services or technicians" className="h-10 rounded-full px-4" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services or technicians..." error={errors.q} />
      </form>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="service-category">Category</Label>
          <Select value={selectValue(initial.categoryId)} onValueChange={(value) => update({ categoryId: value === "all" ? "" : value ?? "", serviceId: "" })}>
            <SelectTrigger id="service-category" className="h-10 w-full rounded-full"><SelectValue>{(value: string) => value === "all" ? "All categories" : categories.find((category) => category.id === value)?.name ?? "All categories"}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
          </Select>
          {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="price-sort">Price</Label>
          <Select value={selectValue(initial.priceSort)} onValueChange={(value) => update({ priceSort: value === "all" ? "" : value ?? "" })}>
            <SelectTrigger id="price-sort" className="h-10 w-full rounded-full"><SelectValue>{(value: string) => value === "asc" ? "Low to high" : value === "desc" ? "High to low" : "Default order"}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">Default order</SelectItem><SelectItem value="asc">Low to high</SelectItem><SelectItem value="desc">High to low</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="rating-sort">Rating</Label>
          <Select value={selectValue(initial.ratingSort)} onValueChange={(value) => update({ ratingSort: value === "all" ? "" : value ?? "" })}>
            <SelectTrigger id="rating-sort" className="h-10 w-full rounded-full"><SelectValue>{(value: string) => value === "desc" ? "High to low" : value === "asc" ? "Low to high" : "Default order"}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">Default order</SelectItem><SelectItem value="desc">High to low</SelectItem><SelectItem value="asc">Low to high</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-3 xl:col-span-2">
        <Button variant="outline" onClick={() => { paramsRef.current = new URLSearchParams(); startTransition(() => router.push("/services")); }}>Clear filters</Button>
        <span role="status" className="text-xs text-muted-foreground">{pending ? "Updating results…" : ""}</span>
      </div>
    </div>
  );
};

export default ServicesFilters;
