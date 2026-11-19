const steps = [
  {
    label: "Install",
    title: "Run the 2.5 MB setup",
    body: "No dependencies, no restart. The build is not code-signed yet, so SmartScreen shows a warning on first run: More info → Run anyway.",
  },
  {
    label: "Record",
    title: "Ctrl + Shift + R",
    body: "Start and stop from anywhere. Pause with Ctrl + Shift + P, or use the on-screen bar. A 0, 3 or 5 second countdown is yours to pick.",
  },
  {
    label: "Keep it",
    title: "The clip is already saved",
    body: "Recordings land in Videos\\WinRecorder. The Library shows every take with its thumbnail — open, reveal, rename or delete.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="px-5 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="eyebrow">How it works</p>
            <h2 className="display mt-3 text-[clamp(1.8rem,4vw,2.9rem)] font-semibold">
              Three steps, none of them a wizard.
            </h2>
          </div>
          <p className="font-mono text-[11px] text-muted">
            tested on Windows 11 24H2 · x64
          </p>
        </div>

        <ol className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map((step, index) => (
            <li key={step.label} className="relative">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-rec">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="h-px flex-1 bg-line" />
                <span className="eyebrow">{step.label}</span>
              </div>
              <h3 className="mt-4 text-[15px] font-medium tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-6 text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
