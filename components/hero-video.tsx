export function HeroVideo() {
  return (
    <section className="relative px-5 pb-8">
      <div className="mx-auto max-w-5xl">
        <div className="rise rise-4 frame relative overflow-hidden p-1.5">
          <div className="relative overflow-hidden rounded-[10px] bg-black">
            <video
              className="block h-auto w-full"
              poster="/media/winrecorder-poster.jpg"
              autoPlay
              controls
              muted
              loop
              playsInline
              preload="metadata"
              width={1600}
              height={900}
              aria-label="Screen recording of WinRecorder: recording the desktop, then browsing the library and settings"
            >
              <source src="/media/winrecorder-hero.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
        <p className="mt-4 text-center font-mono text-[11px] text-muted">
          17 seconds in the real app — record, floating controls, library,
          settings. No audio.
        </p>
      </div>
    </section>
  );
}
