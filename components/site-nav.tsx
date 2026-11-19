import { WindowsMark } from "@/components/windows-mark";

export function SiteNav({ version }: { version: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav className="mx-auto flex h-12 max-w-5xl items-center gap-2 rounded-full border border-line/80 bg-bg/70 pl-4 pr-2 backdrop-blur-xl">
        <a href="#top" className="flex h-11 items-center gap-2 text-[13.5px] font-medium">
          <span className="size-2 rounded-full bg-rec shadow-[0_0_8px_var(--color-rec)]" />
          WinRecorder
        </a>

        <div className="ml-auto hidden items-center gap-1 sm:flex">
          <a className="inline-flex h-11 items-center rounded-full px-3 text-[13px] text-muted transition-colors hover:text-ink" href="#features">
            Features
          </a>
          <a className="inline-flex h-11 items-center rounded-full px-3 text-[13px] text-muted transition-colors hover:text-ink" href="#how">
            How it works
          </a>
          <a className="inline-flex h-11 items-center rounded-full px-3 text-[13px] text-muted transition-colors hover:text-ink" href="#release">
            Release
          </a>
          <a className="inline-flex h-11 items-center rounded-full px-3 text-[13px] text-muted transition-colors hover:text-ink" href="https://github.com/abuAbdur-rahman/winrecorder-site">
            GitHub
          </a>
        </div>

        <a
          href="/api/download"
          className="ml-auto inline-flex h-11 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[12.5px] font-medium text-[#0c0c0d] transition hover:bg-white sm:ml-2"
        >
          <WindowsMark className="size-3.5" />
          <span className="hidden min-[420px]:inline">Download</span>
          <span className="font-mono text-[11px] opacity-60">v{version.split(".")[0]}</span>
        </a>
      </nav>
    </header>
  );
}
