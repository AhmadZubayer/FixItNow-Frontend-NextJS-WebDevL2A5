"use client";

import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import NavbarSearch from "@/components/services/navbar-search";

type User = { name: string; role: "CUSTOMER" | "TECHNICIAN" | "ADMIN" };

const SessionControls = ({ pathname }: { pathname: string }) => {
  const router = useRouter();
  const [session, setSession] = useState<{ pathname: string; user: User | null } | null>(null);
  const [pending, setPending] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuId = useId();
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeMobileMenu = () => setMobileOpen(false);
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
      closeMobileMenu();
      toast.success("You are logged out.");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Could not log out. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const showSearch = pathname === "/services" || pathname === "/";
  const navigation = (
    <nav aria-label="Main navigation" className={showSearch
      ? "hidden md:flex md:flex-wrap md:items-center md:justify-end md:gap-x-1"
      : "hidden md:col-span-1 md:col-start-2 md:row-start-1 md:flex md:flex-wrap md:items-center md:justify-center md:gap-x-3"}>
      <Link href="/services" className={buttonVariants({ variant: "ghost" })}>Services &amp; Technicians</Link>
      {loaded && user && <Link href={`/dashboard/${user.role.toLowerCase()}`} className={buttonVariants({ variant: "ghost" })}>Dashboard</Link>}
    </nav>
  );
  const account = (
    <div className="col-start-2 row-start-1 flex min-w-0 items-center gap-2 justify-self-end md:col-start-3">
      {!loaded ? <div className="h-7 w-20 animate-pulse rounded bg-muted md:w-28" aria-label="Loading account" /> : !user ? <div className="flex gap-2"><Link href="/auth/login" className={buttonVariants({ variant: "ghost" })}>Sign in</Link><Link href="/auth/register" className={buttonVariants({ className: "max-md:hidden" })}>Sign up</Link></div> : <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" className="max-w-[28vw] md:max-w-48" />}>
          <span className="truncate">{user.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={logout} disabled={pending}>{pending ? "Logging out" : "Log out"}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>}
      <CollapsibleTrigger ref={menuButton} aria-controls={mobileMenuId} aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"} render={<Button variant="ghost" size="icon" className="size-9 md:hidden" />}>
        {mobileOpen ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
      </CollapsibleTrigger>
    </div>
  );

  return <Collapsible className="contents" open={mobileOpen} onOpenChange={setMobileOpen} onKeyDown={(event) => {
    if (event.key === "Escape" && mobileOpen) { closeMobileMenu(); menuButton.current?.focus(); }
  }}>
    {showSearch ? <>
      <NavbarSearch className="desktop-navbar-search hidden justify-self-center md:col-start-2 md:row-start-1 md:block" />
      <div className="contents md:col-start-3 md:row-start-1 md:flex md:items-center md:gap-2">{navigation}{account}</div>
    </> : <>{navigation}{account}</>}
    <CollapsibleContent id={mobileMenuId} className="mobile-navbar-panel col-span-2 col-start-1 row-start-2 min-w-0 overflow-hidden md:hidden">
      <div className="space-y-3 border-t pt-4 pb-1">
        <NavbarSearch className="max-w-none" onSearch={() => { closeMobileMenu(); menuButton.current?.focus(); }} />
        <nav aria-label="Main navigation" className="flex flex-col items-stretch gap-1">
          <Link href="/services" onClick={closeMobileMenu} className={buttonVariants({ variant: "ghost", className: "justify-start" })}>Services &amp; Technicians</Link>
          {loaded && user && <Link href={`/dashboard/${user.role.toLowerCase()}`} onClick={closeMobileMenu} className={buttonVariants({ variant: "ghost", className: "justify-start" })}>Dashboard</Link>}
          {loaded && !user && <Link href="/auth/register" onClick={closeMobileMenu} className={buttonVariants({ variant: "ghost", className: "justify-start" })}>Sign up</Link>}
        </nav>
      </div>
    </CollapsibleContent>
  </Collapsible>;
};

const SessionActions = () => {
  const pathname = usePathname();
  return <SessionControls key={pathname} pathname={pathname} />;
};

export default SessionActions;
