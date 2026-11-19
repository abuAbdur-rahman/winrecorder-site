export function SiteFooter({ version }: { version: string }) {
  return (
    <footer className="border-t border-line/70 px-5 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[13px] font-medium">
            <span className="size-2 rounded-full bg-rec" />
            WinRecorder
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted">
            v{version} · MIT-licensed source · built for Windows
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-muted">
          <a className="inline-flex h-11 items-center hover:text-ink" href="https://github.com/abuAbdur-rahman/winrecorder-site">
            Source
          </a>
          <a className="inline-flex h-11 items-center hover:text-ink" href="/api/latest">
            Updater JSON
          </a>
          <a className="inline-flex h-11 items-center hover:text-ink" href="/api/download">
            Installer
          </a>
          <a className="inline-flex h-11 items-center hover:text-ink" href="#release">
            Changelog
          </a>
        </nav>
      </div>

      <div className="mx-auto mt-8 max-w-5xl">
        <div className="hairline" />
        <p className="mt-5 text-[11.5px] leading-5 text-muted">
          WinRecorder records locally and uploads nothing. SmartScreen may warn
          because the alpha builds are unsigned. Windows is a trademark of
          Microsoft Corporation; this project is not affiliated with Microsoft.
        </p>
      </div>
    </footer>
  );
}
