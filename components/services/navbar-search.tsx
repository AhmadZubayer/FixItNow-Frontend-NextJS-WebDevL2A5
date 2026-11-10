"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const NavbarSearch = ({ className, onSearch }: { className?: string; onSearch?: () => void }) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = pathname === "/services" ? params.get("q") ?? "" : "";

  return (
    <form
      key={`${pathname}?${params.toString()}`}
      role="search"
      className={cn("service-navbar-search relative w-full max-w-72", className)}
      onSubmit={event => {
        event.preventDefault();
        const search = String(new FormData(event.currentTarget).get("q") ?? "").trim();
        const next = new URLSearchParams(pathname === "/services" ? params.toString() : "");
        if (search) next.set("q", search);
        else next.delete("q");
        next.delete("page");
        const queryString = next.toString();
        router.push(queryString ? `/services?${queryString}` : "/services");
        onSearch?.();
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
