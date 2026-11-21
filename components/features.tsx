import { Monitor, ShieldCheck, Video } from "lucide-react";

type Feature = {
  title: string;
  detail: string;
  icon: typeof Monitor;
};

const features: Feature[] = [
  {
    title: "Any screen area",
    detail: "Display, window, or region",
    icon: Monitor,
  },
  {
    title: "MP4 on stop",
    detail: "H.264 · 30 or 60 fps",
    icon: Video,
  },
  {
    title: "Local by default",
    detail: "No account or telemetry",
    icon: ShieldCheck,
  },
];

export function Features() {
  return (
    <section id="features" className="px-5 py-20 sm:py-24">
      <h2 className="sr-only">WinRecorder highlights</h2>
      <div className="mx-auto grid max-w-6xl border-y border-line sm:grid-cols-3">
        {features.map(({ title, detail, icon: Icon }, index) => (
          <article
            key={title}
            className={`flex items-center gap-4 py-6 sm:px-6 ${
              index > 0 ? "border-t border-line sm:border-t-0 sm:border-l" : ""
            }`}
          >
            <Icon
              className="size-5 shrink-0 text-muted"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div>
              <h3 className="text-[14px] font-medium tracking-tight">{title}</h3>
              <p className="mt-0.5 text-[12.5px] text-muted">{detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
