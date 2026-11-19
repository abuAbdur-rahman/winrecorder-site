"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

const tabs = [
  {
    id: "choose",
    label: "Choose",
    caption:
      "Pick a display, a window or a region. System audio and microphone are optional.",
  },
  {
    id: "record",
    label: "Record",
    caption:
      "Pause, resume and stop from a floating bar you can move anywhere on the desktop.",
  },
  {
    id: "library",
    label: "Library",
    caption:
      "The MP4 is encoded when you stop. Reveal, rename, open or delete it from the library.",
  },
] as const;

export function ProductTour() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [elapsed, setElapsed] = useState(8);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (activeIndex !== 1) return;

    const interval = window.setInterval(() => {
      setElapsed((current) => (current + 1) % 3600);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeIndex]);

  const activate = (index: number, focus = false) => {
    setActiveIndex(index);
    if (focus) tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index + tabs.length - 1) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    activate(nextIndex, true);
  };

  return (
    <section className="relative px-5 pb-10" aria-labelledby="product-tour-title">
      <div className="mx-auto max-w-5xl">
        <h2 id="product-tour-title" className="sr-only">
          See how WinRecorder works
        </h2>

        <div className="flex justify-center">
          <div
            className="inline-flex rounded-xl border border-line bg-surface p-1"
            role="tablist"
            aria-label="Recording steps"
          >
            {tabs.map((tab, index) => {
              const selected = activeIndex === index;
              return (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  id={`tour-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-controls={`tour-panel-${tab.id}`}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => activate(index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  className={`h-11 min-w-24 cursor-pointer rounded-lg px-4 text-[13px] font-medium transition-colors ${
                    selected
                      ? "bg-surface-2 text-ink shadow-[0_1px_0_rgba(255,255,255,0.06)_inset]"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rise rise-4 frame mt-5 overflow-hidden p-1.5">
          <TourPanel tab="choose" activeIndex={activeIndex} index={0}>
            <ChooseScene />
          </TourPanel>
          <TourPanel tab="record" activeIndex={activeIndex} index={1}>
            <RecordScene elapsed={elapsed} />
          </TourPanel>
          <TourPanel tab="library" activeIndex={activeIndex} index={2}>
            <LibraryScene />
          </TourPanel>
        </div>

        <p className="mx-auto mt-4 max-w-xl text-center text-[13px] leading-6 text-muted">
          {tabs[activeIndex].caption}
        </p>
        <p className="mt-2 text-center font-mono text-[10px] tracking-wide text-muted/70 uppercase">
          Interactive product mockup · no media loaded
        </p>
      </div>
    </section>
  );
}

function TourPanel({
  tab,
  activeIndex,
  index,
  children,
}: {
  tab: (typeof tabs)[number]["id"];
  activeIndex: number;
  index: number;
  children: ReactNode;
}) {
  return (
    <div
      id={`tour-panel-${tab}`}
      role="tabpanel"
      aria-labelledby={`tour-tab-${tab}`}
      hidden={activeIndex !== index}
      className="relative min-h-[340px] overflow-hidden rounded-[10px] bg-[#0b0b0c] sm:aspect-video sm:min-h-0"
    >
      {children}
    </div>
  );
}

function ChooseScene() {
  return (
    <div
      className="absolute inset-[5%] flex flex-col gap-4 overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-2xl sm:inset-[8%] sm:gap-5 sm:p-5"
      role="img"
      aria-label="WinRecorder source picker with display, window and region choices"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">New recording</p>
          <p className="mt-0.5 text-[11px] text-muted">Choose what to capture</p>
        </div>
        <span className="rounded-lg bg-rec px-3 py-2 text-[11px] font-semibold text-white">
          Record
        </span>
      </div>

      <div className="grid flex-1 grid-cols-3 gap-2.5 sm:gap-3">
        <SourceCard label="Display" kind="display" />
        <SourceCard label="Window" kind="window" />
        <SourceCard label="Region" kind="region" selected />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-muted">
        <MockToggle label="System audio" enabled />
        <MockToggle label="Microphone" enabled={false} />
      </div>
    </div>
  );
}

function SourceCard({
  label,
  kind,
  selected = false,
}: {
  label: string;
  kind: "display" | "window" | "region";
  selected?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-lg border p-2 text-[11px] font-medium sm:p-2.5 ${
        selected
          ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]"
          : "border-line"
      }`}
    >
      <span className="relative mb-2 block h-20 overflow-hidden rounded-md bg-surface-2 sm:h-auto sm:aspect-video">
        {kind === "display" ? (
          <span className="absolute inset-3 rounded-sm border border-muted/70" />
        ) : null}
        {kind === "window" ? (
          <span className="absolute inset-x-5 inset-y-4 rounded bg-line" />
        ) : null}
        {kind === "region" ? (
          <span className="absolute inset-x-4 inset-y-3 rounded-sm border border-dashed border-rec" />
        ) : null}
      </span>
      {label}
    </div>
  );
}

function MockToggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${enabled ? "text-ink" : ""}`}>
      <span
        className={`relative h-4 w-7 rounded-full ${enabled ? "bg-ink" : "bg-line"}`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 size-3 rounded-full ${
            enabled ? "left-3.5 bg-bg" : "left-0.5 bg-muted"
          }`}
        />
      </span>
      {label}
    </span>
  );
}

function RecordScene({ elapsed }: { elapsed: number }) {
  return (
    <div
      className="absolute inset-0"
      role="img"
      aria-label="A selected screen region being recorded with a movable floating control bar"
    >
      <div className="absolute top-[9%] right-[22%] bottom-[18%] left-[5%] overflow-hidden rounded-lg border border-line bg-surface shadow-2xl sm:right-[24%] sm:left-[6%]">
        <div className="flex h-9 items-center border-b border-line px-4 text-[10px] text-muted">
          Design review
        </div>
        <div className="grid gap-2.5 p-4">
          <span className="h-3 w-2/5 rounded bg-line" />
          <span className="h-2.5 w-4/5 rounded bg-surface-2" />
          <span className="h-2.5 w-3/5 rounded bg-surface-2" />
          <span className="mt-1 h-20 rounded-md bg-surface-2 sm:h-28" />
          <span className="h-2.5 w-2/3 rounded bg-surface-2" />
        </div>
      </div>

      <div className="absolute top-[18%] right-[27%] bottom-[29%] left-[10%] border border-rec shadow-[0_0_0_999px_rgba(0,0,0,0.42)] sm:top-[22%] sm:right-[30%] sm:bottom-[27%] sm:left-[12%]">
        <span className="absolute bottom-full left-0 mb-2 rounded-md bg-ink px-2 py-1 font-mono text-[9px] text-bg">
          1280 × 720
        </span>
      </div>

      <div className="absolute bottom-[6%] left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-white/10 bg-[#333337] py-2 pr-2 pl-4 text-white shadow-2xl">
        <span className="size-2.5 animate-pulse rounded-full bg-rec" />
        <span className="min-w-10 font-mono text-xs tabular-nums">
          {formatTimer(elapsed)}
        </span>
        <span className="h-5 w-px bg-white/20" />
        <span className="relative size-8 rounded-lg bg-white/10" aria-hidden="true">
          <span className="absolute inset-y-2.5 left-2.5 w-0.5 bg-white shadow-[7px_0_white]" />
        </span>
        <span className="relative size-8 rounded-lg bg-white/10" aria-hidden="true">
          <span className="absolute inset-2.5 rounded-[2px] bg-rec" />
        </span>
      </div>
    </div>
  );
}

function LibraryScene() {
  const recordings = [
    ["Design review", "00:42", "18.4 MB"],
    ["Bug repro", "01:15", "31.2 MB"],
    ["Onboarding walkthrough", "03:08", "96.7 MB"],
  ] as const;

  return (
    <div
      className="absolute inset-[5%] flex flex-col overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-2xl sm:inset-[8%] sm:p-5"
      role="img"
      aria-label="WinRecorder library showing recordings with duration and file size"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Library</p>
        <p className="text-[11px] text-muted">3 recordings</p>
      </div>

      <div className="mt-4 grid gap-1">
        {recordings.map(([name, duration, size], index) => (
          <div
            key={name}
            className={`grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-lg p-2.5 sm:grid-cols-[68px_1fr_auto] sm:gap-4 ${
              index === 0 ? "bg-surface-2" : ""
            }`}
          >
            <span className="h-10 rounded-md bg-line sm:h-11" />
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-medium text-ink sm:text-[13px]">
                {name}
              </span>
              <span className="mt-1 flex gap-3 font-mono text-[9px] text-muted sm:text-[10px]">
                <span>{duration}</span>
                <span>{size}</span>
              </span>
            </span>
            <span className="hidden gap-3 text-[10px] text-muted sm:flex">
              <span>Reveal</span>
              <span>Open</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder
    .toString()
    .padStart(2, "0")}`;
}
