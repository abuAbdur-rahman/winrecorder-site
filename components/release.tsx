import { DownloadButton } from "@/components/download-button";
import { formatBytes } from "@/lib/release";

type Props = {
  version: string;
  pubDate: string;
  notes: string;
  size: number;
  updaterSize: number;
};

export function Release({ version, pubDate, notes, size, updaterSize }: Props) {
  return (
    <section id="release" className="px-5 pb-20 sm:pb-28">
      <div className="mx-auto max-w-5xl">
        <div className="frame grid gap-8 p-7 sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="eyebrow">Latest build</p>
              <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted">
                alpha
              </span>
            </div>
            <h2 className="display mt-3 text-3xl font-semibold">
              v{version}
            </h2>
            <p className="mt-1 font-mono text-[11px] text-muted">
              {new Date(pubDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              · installer {formatBytes(size)} · update payload{" "}
              {formatBytes(updaterSize)}
            </p>
            <p className="mt-4 max-w-lg text-[13.5px] leading-6 text-muted">
              {notes}
            </p>
          </div>
          <div className="sm:pl-6">
            <DownloadButton version={version} size={size} label="Get the installer" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 text-[12.5px] leading-6 text-muted sm:grid-cols-2">
          <div className="frame p-5">
            <p className="font-mono text-[10px] tracking-widest text-muted">
              STABLE LINK
            </p>
            <p className="mt-1.5">
              <a className="underline decoration-line underline-offset-4 hover:text-ink" href="/api/download">
                /api/download
              </a>{" "}
              always redirects to the newest installer, so a shared link never
              goes stale.
            </p>
          </div>
          <div className="frame p-5">
            <p className="font-mono text-[10px] tracking-widest text-muted">
              UPDATES
            </p>
            <p className="mt-1.5">
              The app reads{" "}
              <a className="underline decoration-line underline-offset-4 hover:text-ink" href="/api/latest">
                /api/latest
              </a>{" "}
              and verifies each payload with the public key compiled into the
              binary.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
