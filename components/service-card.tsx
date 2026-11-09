import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Service } from "@/lib/public-api";

const ServiceCard = ({ service, filterHref, selected = false }: { service: Service; filterHref?: string; selected?: boolean }) => {
  return (
    <Link href={filterHref ?? `/technicians/${service.technicianProfile.id}`} aria-current={selected ? "true" : undefined} className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2">
    <Card className={`h-full min-h-52 rounded-2xl border bg-[#EFEFEF] text-base transition-colors hover:border-black ${selected ? "border-black" : "border-transparent"}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold tracking-tight">{service.title}</CardTitle>
          <Badge variant="secondary" className="h-auto px-3 py-1 text-xs">{service.category.name}</Badge>
        </div>
        <CardDescription className="text-sm">{service.technicianProfile.user.name} · {service.technicianProfile.location}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-lg font-semibold">৳{service.price} <span className="ml-2 text-sm font-normal text-muted-foreground">★ {service.technicianProfile.averageRating.toFixed(1)} ({service.technicianProfile.reviewCount})</span></span>
          <span className="shrink-0 rounded-xl bg-[#9AE600] px-3 py-2 text-xs font-semibold text-black">{filterHref ? selected ? "Clear selection" : "Show technicians" : "View technician"}</span>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};

export default ServiceCard;
