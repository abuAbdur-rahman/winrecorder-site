import { Download } from "lucide-react";

import { WindowsMark } from "@/components/windows-mark";

export function SiteNav({ version }: { version: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-bg/95 px-5">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3" aria-label="Main navigation">
        <a
          href="#top"
          className="flex h-11 items-center gap-2.5 text-[14px] font-medium tracking-tight"
        >
          <span className="size-2 rounded-full bg-rec" />
          WinRecorder
        </a>

        <div className="ml-6 hidden items-center gap-1 md:flex">
          <a
            className="inline-flex h-11 items-center px-3 text-[13px] text-muted transition-colors hover:text-ink"
            href="#product"
          >
            Product
          </a>
          <a
            className="inline-flex h-11 items-center px-3 text-[13px] text-muted transition-colors hover:text-ink"
            href="#release"
          >
            Release
          </a>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <a
            href="/api/download"
            aria-label={`Download WinRecorder ${version} for Windows`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-3.5 text-[12.5px] font-medium text-bg transition-colors hover:bg-white"
          >
            <Download
              className="size-3.5"
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <span className="hidden min-[390px]:inline">Download</span>
            <WindowsMark className="size-3.5 opacity-65" />
          </a>

          <a
            href="https://github.com/abuAbdur-rahman/winrecorder-site"
            aria-label="View WinRecorder on GitHub"
            title="View source on GitHub"
            className="grid size-10 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-muted hover:text-ink"
          >
            <GitHubMark className="size-[17px]" />
          </a>
        </div>
      </nav>
    </header>
  );
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.36-3.9-1.36-.53-1.35-1.3-1.71-1.3-1.71-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.04 1.77 2.73 1.26 3.4.96.11-.75.41-1.26.74-1.55-2.57-.29-5.27-1.28-5.27-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.05 0 0 .96-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.2-1.49 3.16-1.18 3.16-1.18.62 1.58.23 2.76.11 3.05.73.81 1.18 1.84 1.18 3.1 0 4.42-2.7 5.39-5.28 5.68.42.36.79 1.07.79 2.15v3.19c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}
