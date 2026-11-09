"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

const NavbarSearch = () => {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.get("q") ?? "";

  return (
    <form
      key={params.toString()}
      role="search"
      className="service-navbar-search relative col-span-2 row-start-2 w-full max-w-72 justify-self-center sm:col-span-1 sm:col-start-2 sm:row-start-1"
      onSubmit={event => {
        event.preventDefault();
        const search = String(new FormData(event.currentTarget).get("q") ?? "").trim();
        const next = new URLSearchParams(params.toString());
        if (search) next.set("q", search);
        else next.delete("q");
        next.delete("page");
        const queryString = next.toString();
        router.push(queryString ? `/services?${queryString}` : "/services");
      }}
    >
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        aria-label="Search services or technicians"
        placeholder="Search services or technicians"
        defaultValue={query}
        maxLength={100}
        className="h-8 rounded-full pr-3 pl-8 text-sm"
      />
    </form>
  );
};

export default NavbarSearch;
