import axios from "axios";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { MapPin, Star } from "lucide-react";

import BackLink from "@/components/back-link";
import { Badge } from "@/components/ui/badge";
import { getTechnician } from "@/lib/public-api";
import BookingForm from "@/components/booking-form";
import { cn } from "@/lib/utils";

const TechnicianPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ serviceId?: string }>;
}) => {
  await connection();
  const { id } = await params;
  const { serviceId } = await searchParams;
  let technician;

  try {
    technician = await getTechnician(id);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) notFound();
    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column: Technician Info & Customer Reviews */}
        <div className="space-y-6 lg:col-span-5">
          {/* Technician Profile Card */}
          <div className="rounded-xl border bg-card p-6 text-card-foreground">
            <BackLink href="/services" label="Back to services" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight">{technician.user.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{technician.location}</span>
              <span>·</span>
              <span>{technician.experienceYears} years of experience</span>
              <span>·</span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {technician.averageRating.toFixed(1)} ({technician.reviewCount} review{technician.reviewCount === 1 ? "" : "s"})
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{technician.bio}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {technician.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="rounded-full border border-border/40 bg-background/80 px-3 py-1 text-xs font-normal hover:bg-background"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Customer Reviews Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Customer reviews</h2>
            {technician.reviews?.length ? (
              <div className="space-y-3">
                {technician.reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border bg-card p-4 text-card-foreground">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {review.customer.name} · {review.rating}/5
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={cn(
                              "h-4 w-4",
                              index < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">No reviews yet.</div>
            )}
          </section>
        </div>

        {/* Right Column: Provided Services & Book a Service */}
        <div className="space-y-6 lg:col-span-7">
          {/* Provided Services Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Provided services <span className="sr-only">Services and prices</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {technician.services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:border-black"
                >
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">{service.title}</h3>
                    <p className="text-xs text-muted-foreground">{service.category.name}</p>
                  </div>
                  <span className="font-semibold text-sm sm:text-base">৳{service.price}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Book a Service Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Book a service <span className="sr-only">Request a booking</span>
            </h2>
            <div className="rounded-xl border bg-card p-6 text-card-foreground">
              <BookingForm
                services={technician.services}
                slots={technician.availabilitySlots ?? []}
                initialServiceId={serviceId}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default TechnicianPage;
