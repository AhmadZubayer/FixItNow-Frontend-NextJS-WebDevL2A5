"use client";

import Link from "next/link";
import BackLink from "@/components/back-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TechnicianError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <BackLink href="/services" label="Back to services" />
        <div className="rounded-xl border bg-card p-6 text-card-foreground">
          <Alert variant="destructive">
            <AlertTitle>We could not load this technician profile</AlertTitle>
            <AlertDescription className="mt-2 text-sm leading-relaxed">
              {error?.message ||
                "An unexpected error occurred while loading this technician profile. Please try again or return to services."}
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button onClick={reset} variant="default" className="h-8 px-4">
              Try again
            </Button>
            <Link
              href="/services"
              className={cn(buttonVariants({ variant: "outline" }), "h-8 px-4")}
            >
              Browse all services
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default TechnicianError;
