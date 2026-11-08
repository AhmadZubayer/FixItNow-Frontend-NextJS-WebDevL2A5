import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Service } from "@/lib/public-api";

const ServiceCard = ({ service, filterHref, selected = false }: { service: Service; filterHref?: string; selected?: boolean }) => {
  return (
    <Link href={filterHref ?? `/technicians/${service.technicianProfile.id}`} aria-current={selected ? "true" : undefined} className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2">
    <Card size="sm" className={`h-full border bg-[#EFEFEF] transition-colors hover:border-black ${selected ? "border-black" : "border-transparent"}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{service.title}</CardTitle>
          <Badge variant="secondary">{service.category.name}</Badge>
        </div>
        <CardDescription>{service.technicianProfile.user.name} · {service.technicianProfile.location}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="line-clamp-2 text-muted-foreground">{service.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="font-medium">৳{service.price} <span className="ml-2 text-xs font-normal text-muted-foreground">★ {service.technicianProfile.averageRating.toFixed(1)} ({service.technicianProfile.reviewCount})</span></span>
          <span className="text-xs font-medium underline underline-offset-4">{filterHref ? selected ? "Clear selection" : "Show technicians" : "View technician"}</span>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};

export default ServiceCard;
