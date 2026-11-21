export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 px-5 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 text-[11.5px] text-muted">
        <p className="flex items-center gap-2 font-medium text-ink">
          <span className="size-2 rounded-full bg-rec" />
          WinRecorder
        </p>
        <p className="text-right">Local-only · MIT · Windows x64</p>
      </div>
    </footer>
  );
}
