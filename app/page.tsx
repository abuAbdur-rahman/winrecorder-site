import type { Metadata } from "next";
import { connection } from "next/server";

import { Features } from "@/components/features";
import { Hero } from "@/components/hero";
import { ProductTour } from "@/components/product-tour";
import { Release } from "@/components/release";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { readRelease } from "@/lib/release";

export const instant = false;

export const metadata: Metadata = {
  description:
    "Record a window or your whole display to MP4 in one keystroke. No accounts, no watermarks, no background service. Free alpha for Windows 10 and 11.",
  openGraph: {
    title: "WinRecorder — quick screen recording for Windows",
    description:
      "Pick a window or the full display, hit record, get an MP4. A 2.5 MB Windows app with no accounts and no telemetry.",
    images: ["/media/winrecorder-poster.jpg"],
  },
};

export default async function HomePage() {
  await connection();
  const release = await readRelease();

  return (
    <div id="top" className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-[60] -translate-y-20 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-bg focus:translate-y-0"
      >
        Skip to content
      </a>
      <SiteNav version={release.version} />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Hero version={release.version} size={release.installer.size} />
        <ProductTour />
        <Features />
        <Release version={release.version} size={release.installer.size} />
      </main>
      <SiteFooter />
    </div>
  );
}
