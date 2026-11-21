import { DownloadButton } from "@/components/download-button";

type Props = {
  version: string;
  size: number;
};

export function Hero({ version, size }: Props) {
  return (
    <section className="px-5 pt-36 pb-12 sm:pt-44 sm:pb-16">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] lg:items-end lg:gap-20">
        <h1 className="display max-w-4xl text-[clamp(3.25rem,8vw,6rem)] font-semibold">
          Record the screen.
          <span className="block text-muted">Keep the MP4.</span>
        </h1>

        <div className="lg:pb-2">
          <p className="max-w-md text-pretty text-base leading-7 text-muted">
            Pick a display, window, or region. The file is ready when you stop.
          </p>
          <div className="mt-7">
            <DownloadButton
              version={version}
              size={size}
              align="start"
              showMeta={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
