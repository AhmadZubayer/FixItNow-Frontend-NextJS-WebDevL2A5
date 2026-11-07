import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Service } from "@/lib/public-api";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <Card size="sm" className="h-full">
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
          <span className="font-medium">৳{service.price}</span>
          <Link href={`/technicians/${service.technicianProfile.id}`} className="text-xs font-medium underline underline-offset-4 hover:text-primary">View technician</Link>
        </div>
      </CardContent>
    </Card>
  );
}
