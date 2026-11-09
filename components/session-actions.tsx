"use client";

import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type User = { name: string; role: "CUSTOMER" | "TECHNICIAN" | "ADMIN" };

const SessionActions = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    axios.get<User>("/api/session/me").then((response) => {
      if (active) setUser(response.data);
    }).catch(() => {
      if (active) setUser(null);
    }).finally(() => {
      if (active) setLoaded(true);
    });
    return () => { active = false; };
  }, [pathname]);

  const logout = async () => {
    if (pending) return;
    setPending(true);
    try {
      await axios.post("/api/session/logout");
      setUser(null);
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
    <nav aria-label="Main navigation" className="col-span-2 row-start-2 flex items-center justify-center gap-1 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:gap-2">
      <Button variant="ghost" render={<Link href="/services" />}>Services &amp; Technicians</Button>
      {loaded && user && <Button variant="ghost" render={<Link href={`/dashboard/${user.role.toLowerCase()}`} />}>Dashboard</Button>}
    </nav>
    <div className="col-start-2 row-start-1 justify-self-end sm:col-start-3">
      {!loaded ? <div className="h-7 w-28 animate-pulse rounded bg-muted" aria-label="Loading account" /> : !user ? <><Button variant="ghost" render={<Link href="/auth/login" />}>Log in</Button><Button render={<Link href="/auth/register" />}>Sign up</Button></> : <DropdownMenu>
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
