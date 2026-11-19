import { WindowsMark } from "@/components/windows-mark";
import { formatBytes } from "@/lib/release";

type Props = {
  version: string;
  size: number;
  href?: string;
  label?: string;
};

export function DownloadButton({
  version,
  size,
  href = "/api/download",
  label = "Download for Windows",
}: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <a
        href={href}
        download
        className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-ink px-6 text-[15px] font-medium text-[#0c0c0d] shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_10px_30px_-12px_rgba(255,255,255,0.35)] transition hover:-translate-y-px hover:bg-white active:translate-y-0"
      >
        <WindowsMark className="size-4" />
        {label}
      </a>
      <p className="font-mono text-[11px] tracking-tight text-muted">
        v{version} · {formatBytes(size)} · x64
      </p>
    </div>
  );
}
