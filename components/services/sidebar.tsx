"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ListFilter, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar } from "@/components/ui/sidebar";

type Props = {
  titles: string[];
  initial: Record<string, string>;
  selectedTitle?: string;
  selectedServiceId?: string;
  children: ReactNode;
};

const ServicesList = ({ titles, initial, selectedTitle, selectedServiceId }: Omit<Props, "children">) => {
  const isMobile = useIsMobile();
  const { openMobile, setOpenMobile } = useSidebar();
  const hrefFor = (title: string) => {
    const params = new URLSearchParams(initial);
    params.delete("page");
    params.delete("serviceId");
    if (title) params.set("serviceTitle", title);
    else params.delete("serviceTitle");
    const query = params.toString();
    return `/services${query ? `?${query}` : ""}`;
  };

  return <>
    <Button variant="outline" className="md:hidden" aria-expanded={openMobile} onClick={() => setOpenMobile(!openMobile)}>
      <ListFilter aria-hidden />View services list
    </Button>
    <Sidebar collapsible={isMobile ? "offcanvas" : "none"} className="hidden min-h-48 shrink-0 border-r bg-background md:sticky md:top-24 md:flex md:h-[calc(100svh-13rem)] md:w-60" aria-label="Available services">
      <SidebarHeader className="flex-row items-center justify-between px-4 py-3 md:px-2 md:pt-0">
        <h2 className="text-lg font-semibold">Services</h2>
        <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Close services list" onClick={() => setOpenMobile(false)}><X aria-hidden /></Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup><SidebarGroupContent>
          <nav aria-label="Filter by service"><SidebarMenu>
            {["", ...titles].map((title) => {
              const active = title ? selectedTitle === title.toLowerCase() : !selectedTitle && !selectedServiceId;
              return <SidebarMenuItem key={title || "all"}>
                <SidebarMenuButton isActive={active} className="h-auto min-h-10 items-start rounded-xl px-4 py-2 text-sm whitespace-normal data-active:bg-[#9AE600]/30 data-active:font-semibold data-active:hover:bg-[#9AE600]/30" render={<Link href={hrefFor(title)} aria-current={active ? "page" : undefined} onClick={() => setOpenMobile(false)} />}>
                  {title || "All"}
                </SidebarMenuButton>
              </SidebarMenuItem>;
            })}
          </SidebarMenu></nav>
        </SidebarGroupContent></SidebarGroup>
      </SidebarContent>
    </Sidebar>
  </>;
};

const ServicesSidebar = ({ children, ...props }: Props) => <SidebarProvider defaultOpen className="min-h-0 flex-col items-start gap-5 md:flex-row md:gap-8">
  <ServicesList {...props} />
  <div className="w-full min-w-0 flex-1">{children}</div>
</SidebarProvider>;

export default ServicesSidebar;
