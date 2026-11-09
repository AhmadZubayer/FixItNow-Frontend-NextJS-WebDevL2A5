import Link from "next/link";
import { Wrench } from "lucide-react";

const SiteFooter = () => (
  <footer className="mt-auto bg-[#EFEFEF] text-foreground">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1"><Link href="/" className="inline-flex items-center gap-1.5 font-bold"><Wrench aria-hidden className="size-5 text-[#145b28]" /> FixItNow</Link><span className="border-l border-slate-400 pl-3 text-xs">Trusted home services, on your schedule.</span></p>
      <nav aria-label="Footer navigation" className="flex flex-wrap gap-4">
        <Link href="/" className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">Home</Link>
        <Link href="/services" className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">Services</Link>
        <Link href="/#top-technicians" className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">Technicians</Link>
        <Link href="/#how-it-works" className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">How It Works</Link>
      </nav>
    </div>
  </footer>
);

export default SiteFooter;
