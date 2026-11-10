import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const BackLink = ({ href, label = "Back" }: { href: string; label?: string }) => (
  <Link href={href} className="inline-flex items-center gap-1 bg-transparent text-sm font-medium text-black underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">
    <ArrowLeft aria-hidden="true" className="size-4" />
    {label}
  </Link>
);

export default BackLink;
