import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LawTitle, NextStepButton, TiltedPhoto } from "./StepParts";

/*
 * "הקדמה" step: the law of the lesson, a photo, what it means on the traffic road and on
 * the social road, and a button to the next step.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 * Mobile stacks: title → photo → cards → button. Desktop: photo column on the right.
 */

type IntroStepProps = {
  lawNumber: number;
  title: string;
  image: { src: string; alt: string };
  trafficText: ReactNode;
  /** Shown in red under the traffic text, e.g. the fine. */
  trafficWarning?: ReactNode;
  socialText: ReactNode;
  step: number;
  totalSteps: number;
  onNext?: () => void;
};

function InfoCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "flex flex-col items-start gap-2 rounded-[32px] bg-sidebar/35 px-6 py-8 md:rounded-[48px] md:px-8 md:py-10 lg:min-h-[calc(var(--u)*17.708)] lg:gap-[calc(var(--u)*0.521)] lg:rounded-[calc(var(--u)*3.125)] lg:px-[calc(var(--u)*2.083)] lg:py-[calc(var(--u)*2.604)]",
        className,
      )}
    >
      <div className="w-full">
        <h2 className="flex items-end text-[22px] font-bold leading-normal md:text-[3.385vw] lg:min-h-[calc(var(--u)*2.604)] lg:text-[max(18px,min(1.719vw,calc(var(--u)*1.85)))]">
          {title}
        </h2>
        <div className="mt-2 text-[17px] leading-normal md:text-[2.604vw] lg:mt-[calc(var(--u)*0.521)] lg:text-[max(15px,min(1.198vw,calc(var(--u)*1.32)))]">{children}</div>
      </div>
    </section>
  );
}

export function IntroStep({
  lawNumber,
  title,
  image,
  trafficText,
  trafficWarning,
  socialText,
  step,
  totalSteps,
  onNext,
}: IntroStepProps) {
  return (
    <div className="flex flex-col gap-6 px-4 pb-10 pt-6 md:gap-8 md:px-8 md:pt-10 lg:flex-row lg:items-center lg:gap-[calc(var(--u)*3.906)] lg:py-[calc(var(--u)*1.5)] lg:pl-[2.865vw] lg:pr-[3.542vw]">
      {/* Text column: on mobile its children join the outer column so the photo can sit between them. */}
      <div className="contents lg:order-1 lg:flex lg:min-w-0 lg:flex-1 lg:flex-col">
        <LawTitle lawNumber={lawNumber} title={title} className="order-1" />

        <div className="order-3 flex flex-col gap-4 motion-safe:animate-fade-up motion-safe:[animation-delay:120ms] md:flex-row md:gap-5 lg:mt-[calc(var(--u)*1.615)] lg:gap-[calc(var(--u)*1.458)]">
          <InfoCard title="בכביש התנועה:" className="md:flex-1 lg:flex-none lg:basis-[41.7%]">
            <p>{trafficText}</p>
            {trafficWarning && <p className="mt-[1.4em] text-alert">{trafficWarning}</p>}
          </InfoCard>
          <InfoCard title="בכביש החברתי:" className="md:flex-1 lg:flex-none lg:basis-[55.39%]">
            {socialText}
          </InfoCard>
        </div>

        <NextStepButton step={step} totalSteps={totalSteps} onNext={onNext} className="order-4 lg:mt-[calc(var(--u)*1.719)]" />
      </div>

      <TiltedPhoto
        image={image}
        className="order-2 mx-auto w-full max-w-[320px] md:max-w-[380px] lg:order-none lg:mx-0 lg:w-[calc(var(--u)*25.625)] lg:max-w-none lg:shrink-0"
      />
    </div>
  );
}
