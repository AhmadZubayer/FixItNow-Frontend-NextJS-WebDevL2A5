"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import SearchField from "@/components/search-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [draft, setDraft] = useState({
    location: initial.location ?? "",
    minPrice: initial.minPrice ?? "",
    maxPrice: initial.maxPrice ?? "",
  });

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

  useEffect(() => {
    if (draft.location === (initial.location ?? "") &&
        draft.minPrice === (initial.minPrice ?? "") &&
        draft.maxPrice === (initial.maxPrice ?? "")) return;
    const timer = setTimeout(() => update(draft), 450);
    return () => clearTimeout(timer);
  }, [draft, initial.location, initial.minPrice, initial.maxPrice, update]);

  return (
    <div className="space-y-4" aria-label="Service filters">
      <form onSubmit={(event) => { event.preventDefault(); update({ q: search.trim() }); }} role="search">
        <SearchField id="service-search" label="Search services or technicians" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services or technicians..." error={errors.q} />
      </form>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="service-category">Category</Label>
          <Select value={selectValue(initial.categoryId)} onValueChange={(value) => update({ categoryId: value === "all" ? "" : value ?? "", serviceId: "" })}>
            <SelectTrigger id="service-category" className="w-full"><SelectValue>{(value: string) => value === "all" ? "All categories" : categories.find((category) => category.id === value)?.name ?? "All categories"}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent>
          </Select>
          {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="price-sort">Price</Label>
          <Select value={selectValue(initial.priceSort)} onValueChange={(value) => update({ priceSort: value === "all" ? "" : value ?? "" })}>
            <SelectTrigger id="price-sort" className="w-full"><SelectValue>{(value: string) => value === "asc" ? "Low to high" : value === "desc" ? "High to low" : "Default order"}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">Default order</SelectItem><SelectItem value="asc">Low to high</SelectItem><SelectItem value="desc">High to low</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="rating-sort">Rating</Label>
          <Select value={selectValue(initial.ratingSort)} onValueChange={(value) => update({ ratingSort: value === "all" ? "" : value ?? "" })}>
            <SelectTrigger id="rating-sort" className="w-full"><SelectValue>{(value: string) => value === "desc" ? "High to low" : value === "asc" ? "Low to high" : "Default order"}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">Default order</SelectItem><SelectItem value="desc">High to low</SelectItem><SelectItem value="asc">Low to high</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="service-location">Location</Label>
          <Input id="service-location" value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder="City or area" aria-invalid={!!errors.location} />
          {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="min-price">Minimum price</Label>
          <Input id="min-price" inputMode="decimal" value={draft.minPrice} onChange={(event) => setDraft((current) => ({ ...current, minPrice: event.target.value }))} aria-invalid={!!errors.minPrice} />
          {errors.minPrice && <p className="text-xs text-destructive">{errors.minPrice}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="max-price">Maximum price</Label>
          <Input id="max-price" inputMode="decimal" value={draft.maxPrice} onChange={(event) => setDraft((current) => ({ ...current, maxPrice: event.target.value }))} aria-invalid={!!errors.maxPrice} />
          {errors.maxPrice && <p className="text-xs text-destructive">{errors.maxPrice}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="minimum-rating">Minimum rating</Label>
          <Select value={selectValue(initial.minRating)} onValueChange={(value) => update({ minRating: value === "all" ? "" : value ?? "" })}>
            <SelectTrigger id="minimum-rating" className="w-full"><SelectValue>{(value: string) => value === "all" ? "Any rating" : `${value}+ stars`}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem value="all">Any rating</SelectItem>{[3, 4, 5].map((rating) => <SelectItem key={rating} value={String(rating)}>{rating}+ stars</SelectItem>)}</SelectContent>
          </Select>
          {errors.minRating && <p className="text-xs text-destructive">{errors.minRating}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => { paramsRef.current = new URLSearchParams(); startTransition(() => router.push("/services")); }}>Clear filters</Button>
        <span role="status" className="text-xs text-muted-foreground">{pending ? "Updating results…" : ""}</span>
      </div>
    </div>
  );
};

export default ServicesFilters;
