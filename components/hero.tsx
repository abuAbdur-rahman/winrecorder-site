import { DownloadButton } from "@/components/download-button";

type Props = {
  version: string;
  size: number;
  pubDate: string;
};

export function Hero({ version, size, pubDate }: Props) {
  return (
    <section className="glow relative isolate overflow-hidden px-5 pt-28 pb-10 sm:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-linear-to-r from-transparent via-line to-transparent"
      />
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <p className="rise rise-1 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 font-mono text-[11px] text-muted backdrop-blur">
          <span className="size-1.5 rounded-full bg-rec shadow-[0_0_10px_var(--color-rec)]" />
          Pre-release v{version} · Windows 10 &amp; 11
        </p>

        <h1 className="display rise rise-2 mt-7 max-w-4xl text-[clamp(2.6rem,7.2vw,5.1rem)] font-semibold">
          Your screen, recorded
          <br className="hidden sm:block" /> before you lose the moment.
        </h1>

        <p className="rise rise-3 mt-6 max-w-xl text-pretty text-[15px] leading-7 text-muted sm:text-base">
          WinRecorder is a {(size / 1024 / 1024).toFixed(1)} MB Windows app for
          quick captures: pick a window or the full display, hit record, get an
          MP4 in your Videos folder. No accounts, no watermarks, no background
          service.
        </p>

        <div className="rise rise-4 mt-9">
          <DownloadButton version={version} size={size} />
        </div>

        <p className="mt-4 font-mono text-[11px] text-muted">
          {new Date(pubDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          · Signed updates · Free alpha build
        </p>
      </div>
    </section>
  );
}
