import { DownloadButton } from "@/components/download-button";
import { formatBytes } from "@/lib/release";

type Props = {
  version: string;
  size: number;
};

export function Release({ version, size }: Props) {
  return (
    <section id="release" className="px-5 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-8 border-t border-line pt-10 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h2 className="display text-[clamp(2rem,4vw,3.25rem)] font-semibold">
            WinRecorder {version}
          </h2>
          <p className="mt-3 font-mono text-[10.5px] text-muted">
            Windows 10 &amp; 11 · x64 · {formatBytes(size)} · Alpha
          </p>
        </div>
        <DownloadButton
          version={version}
          size={size}
          label="Download alpha"
          align="start"
          showMeta={false}
        />
      </div>
    </section>
  );
}
