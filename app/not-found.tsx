import Link from "next/link";
import BackLink from "@/components/back-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NotFound = () => {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center text-card-foreground shadow-xs">
        <div className="mb-4 flex justify-start">
          <BackLink href="/services" label="Back to services" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">404</h1>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">Technician or page not found</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          The requested technician profile or page does not exist or has been removed.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/services"
            className={cn(
              buttonVariants({ size: "default" }),
              "h-8 px-4 bg-[#9AE600] font-medium text-black hover:bg-[#88cc00]"
            )}
          >
            Browse services
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "default" }), "h-8 px-4")}
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
