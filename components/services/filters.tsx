"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";

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
    <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]" aria-label="Service filters">
        <div className="space-y-1">
          <Label htmlFor="service-category">Category</Label>
          <Select value={selectValue(initial.categoryId)} onValueChange={(value) => update({ categoryId: value === "all" ? "" : value ?? "", serviceId: "", serviceTitle: "" })}>
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
        <Button className="mt-4 justify-self-start" variant="outline" onClick={() => { paramsRef.current = new URLSearchParams(); startTransition(() => router.push("/services")); }}>Clear filters</Button>
        <span role="status" className="sr-only">{pending ? "Updating results…" : ""}</span>
    </div>
  );
};

export default ServicesFilters;
