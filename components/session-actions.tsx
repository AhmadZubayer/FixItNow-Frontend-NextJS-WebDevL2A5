"use client";

import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type User = { name: string; role: "CUSTOMER" | "TECHNICIAN" | "ADMIN" };

const SessionActions = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<{ pathname: string; user: User | null } | null>(null);
  const [pending, setPending] = useState(false);
  const loaded = session?.pathname === pathname;
  const user = loaded ? session.user : null;

  useEffect(() => {
    let active = true;
    axios.get<User>("/api/session/me").then((response) => {
      if (active) setSession({ pathname, user: response.data });
    }).catch(() => {
      if (active) setSession({ pathname, user: null });
    });
    return () => { active = false; };
  }, [pathname]);

  const logout = async () => {
    if (pending) return;
    setPending(true);
    try {
      await axios.post("/api/session/logout");
      setSession({ pathname, user: null });
      toast.success("You are logged out.");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Could not log out. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return <>
    <nav aria-label="Main navigation" className="col-span-2 row-start-2 flex flex-wrap items-center justify-center gap-x-1 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:gap-x-3">
      {pathname === "/" ? <>
        <Link href="/" aria-current="page" className="border-b-2 border-[#145b28] px-1 py-2 text-xs font-bold text-[#145b28]">Home</Link>
        <Link href="#browse-services" className={buttonVariants({ variant: "ghost" })}>Services</Link>
        <Link href="#top-technicians" className={buttonVariants({ variant: "ghost" })}>Technicians</Link>
        <Link href="#how-it-works" className={buttonVariants({ variant: "ghost" })}>How It Works</Link>
        <Link href="/auth/register?role=technician" className={buttonVariants({ variant: "ghost" })}>Become a Technician</Link>
      </> : <Link href="/services" className={buttonVariants({ variant: "ghost" })}>Services &amp; Technicians</Link>}
      {loaded && user && <Link href={`/dashboard/${user.role.toLowerCase()}`} className={buttonVariants({ variant: "ghost" })}>Dashboard</Link>}
    </nav>
    <div className="col-start-2 row-start-1 justify-self-end sm:col-start-3">
      {!loaded ? <div className="h-7 w-28 animate-pulse rounded bg-muted" aria-label="Loading account" /> : !user ? <div className="flex gap-2"><Link href="/auth/login" className={buttonVariants({ variant: pathname === "/" ? "outline" : "ghost" })}>Sign in</Link><Link href="/auth/register" className={buttonVariants()}>Sign up</Link></div> : <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" className="max-w-36 sm:max-w-48" />}>
          <span className="truncate">{user.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={logout} disabled={pending}>{pending ? "Logging out" : "Log out"}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>}
    </div>
  </>;
};

export default SessionActions;
