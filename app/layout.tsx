import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import PublicSiteChrome from "@/components/public-site-chrome";
import RouteBreadcrumbs from "@/components/route-breadcrumbs";
import { Toaster } from "sonner";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FixItNow | Home services",
  description: "Find and book trusted home service professionals.",
};

const RootLayout = ({ children }: LayoutProps<"/">) => {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:font-medium focus:shadow-lg">Skip to content</a>
        <Suspense fallback={null}><PublicSiteChrome><SiteHeader /></PublicSiteChrome></Suspense>
        <Suspense fallback={<div className="mx-auto h-7 w-full max-w-7xl px-4 pt-4 sm:px-6" />}>
          <RouteBreadcrumbs />
        </Suspense>
        <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col">{children}</div>
        <Suspense fallback={null}><PublicSiteChrome><SiteFooter /></PublicSiteChrome></Suspense>
        <Toaster richColors={false} position="bottom-right" />
      </body>
    </html>
  );
};

export default RootLayout;
