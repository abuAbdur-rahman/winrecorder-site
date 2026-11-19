import type { Metadata } from "next";
import { connection } from "next/server";

import { Features } from "@/components/features";
import { Hero } from "@/components/hero";
import { HeroVideo } from "@/components/hero-video";
import { HowItWorks } from "@/components/how-it-works";
import { Release } from "@/components/release";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { readRelease } from "@/lib/release";

export const instant = false;

export const metadata: Metadata = {
  title: "WinRecorder — fast screen recording for Windows",
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
        <Hero
          version={release.version}
          size={release.installer.size}
          pubDate={release.pubDate}
        />
        <HeroVideo />
        <Features />
        <HowItWorks />
        <Release
          version={release.version}
          pubDate={release.pubDate}
          notes={release.notes}
          size={release.installer.size}
          updaterSize={release.updater.size}
        />
      </main>
      <SiteFooter version={release.version} />
    </div>
  );
}
