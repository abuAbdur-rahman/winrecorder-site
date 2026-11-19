type Feature = {
  title: string;
  body: string;
  icon: React.ReactNode;
};

const features: Feature[] = [
  {
    title: "Capture the window you mean",
    body: "Full display, single window, or a dragged region. Audio optional, system sound and microphone captured separately from the frame.",
    icon: (
      <path d="M3 5.5h18v11H3zM8.5 20.5h7M12 16.5v4" />
    ),
  },
  {
    title: "An MP4, not a project file",
    body: "H.264 at 30 or 60 fps, encoded while you record. The clip is on disk the second you hit stop — ready to drag into Slack or Premiere.",
    icon: <path d="m4 6 5 4-5 4zM12 6h8v12h-8z" />,
  },
  {
    title: "A library that stays out of the way",
    body: "Thumbnails, duration and size for every take. Reveal in Explorer, rename or delete without hunting through folders.",
    icon: <path d="M4 5h6l2 2h8v12H4zM4 11h16" />,
  },
  {
    title: "Nothing lurking after you close it",
    body: "A 2.5 MB installer, no background service, no account and no telemetry. Updates are signed and checked from inside Settings.",
    icon: <path d="M12 3v10m0 0 3.5-3.5M12 13 8.5 9.5M5 15v4h14v-4" />,
  },
];

export function Features() {
  return (
    <section id="features" className="px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-2xl">
          <p className="eyebrow">What it does</p>
          <h2 className="display mt-3 text-[clamp(1.8rem,4vw,2.9rem)] font-semibold">
            Built for the thirty seconds between wanting a clip and having one.
          </h2>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group bg-surface p-7 transition-colors hover:bg-surface-2"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="size-6 text-muted transition-colors group-hover:text-ink"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {feature.icon}
              </svg>
              <h3 className="mt-5 text-[15px] font-medium tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-6 text-muted">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
