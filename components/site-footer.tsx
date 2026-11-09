import Link from "next/link";

const SiteFooter = () => (
  <footer className="mt-auto bg-[#EFEFEF] text-foreground">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p><span className="font-semibold">FixItNow</span> · Trusted home services.</p>
      <nav aria-label="Footer navigation" className="flex flex-wrap gap-4">
        <Link href="/" className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">Home</Link>
        <Link href="/services" className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">Services</Link>
      </nav>
    </div>
  </footer>
);

export default SiteFooter;
