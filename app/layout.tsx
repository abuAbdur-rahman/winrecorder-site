import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "WinRecorder — fast screen recording for Windows",
    template: "%s · WinRecorder",
  },
  description:
    "Record a window or your whole display to MP4 in one keystroke. No accounts, no watermarks, no background service.",
  applicationName: "WinRecorder",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "WinRecorder",
    title: "WinRecorder — quick screen recording for Windows",
    description:
      "Pick a window or the full display, hit record, get an MP4. A 2.5 MB Windows app with no accounts and no telemetry.",
    images: [{ url: "/media/winrecorder-poster.jpg", width: 1600, height: 900 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WinRecorder — quick screen recording for Windows",
    images: ["/media/winrecorder-poster.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c0d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
