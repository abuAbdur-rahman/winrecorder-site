import { WindowsMark } from "@/components/windows-mark";
import { formatBytes } from "@/lib/release";

type Props = {
  version: string;
  size: number;
  href?: string;
  label?: string;
  align?: "start" | "center";
  showMeta?: boolean;
};

export function DownloadButton({
  version,
  size,
  href = "/api/download",
  label = "Download for Windows",
  align = "center",
  showMeta = true,
}: Props) {
  return (
    <div
      className={`flex flex-col gap-3 ${
        align === "start" ? "items-start" : "items-center"
      }`}
    >
      <a
        href={href}
        download
        className="inline-flex h-12 items-center gap-2.5 rounded-lg bg-ink px-5 text-[14px] font-medium text-bg transition-colors hover:bg-white"
      >
        <WindowsMark className="size-4" />
        {label}
      </a>
      {showMeta ? (
        <p className="font-mono text-[10.5px] tracking-tight text-muted">
          v{version} · {formatBytes(size)} · Windows x64
        </p>
      ) : null}
    </div>
  );
}
