"use client";

import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type User = { name: string; role: "CUSTOMER" | "TECHNICIAN" | "ADMIN" };

export default function SessionActions() {
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

  async function logout() {
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
  }

  if (!loaded) return <div className="h-7 w-28 animate-pulse rounded bg-muted" aria-label="Loading account" />;

  if (!user) return <><Button variant="ghost" render={<Link href="/auth/login" />}>Log in</Button><Button render={<Link href="/auth/register" />}>Sign up</Button></>;

  return <><Button variant="ghost" render={<Link href={`/dashboard/${user.role.toLowerCase()}`} />}>Dashboard</Button><Button variant="outline" onClick={logout} disabled={pending}>{pending ? "Logging out" : "Log out"}</Button></>;
}
