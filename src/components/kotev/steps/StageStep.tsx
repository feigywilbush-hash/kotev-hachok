import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LawTitle, NextStepButton } from "./StepParts";

/*
 * Layout shared by "בכביש התנועה" and "בכביש החברתי": the law's title and a short instruction
 * on the right, a large rounded stage on the left (the driving game, the video), and the
 * next-step button under it.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 * Mobile stacks: title → instruction → stage → button.
 */

type StageStepProps = {
  lawNumber: number;
  title: string;
  instruction: ReactNode;
  /** What fills the stage. Without it the stage shows the grey placeholder from the design. */
  children?: ReactNode;
  step: number;
  totalSteps: number;
  onNext?: () => void;
  /** Bottom spacing of the instruction, so its lines sit where the design puts them. */
  instructionClassName?: string;
  /** Mobile shape of the stage (desktop and tablet follow the design). */
  stageClassName?: string;
  /** Extra classes for the stage + button column on desktop (e.g. a max width for a fixed-ratio video). */
  columnClassName?: string;
  /**
   * "video": on desktop the instruction and the next-step button sit under the title on the right,
   * so the 16:9 video on the left can take the whole height and grow much larger.
   */
  layout?: "game" | "video";
};

export function StageStep({
  lawNumber,
  title,
  instruction,
  children,
  step,
  totalSteps,
  onNext,
  instructionClassName = "lg:pb-[calc(var(--u)*1.042)]",
  stageClassName = "aspect-[4/3]",
  columnClassName,
  layout = "game",
}: StageStepProps) {
  if (layout === "video") {
    return (
      // Desktop: the video on the right; the title and instruction at the top of the left column and
      // the next-step button at its bottom, level with the video's bottom edge.
      <div className="flex flex-col gap-6 px-4 pb-10 pt-6 md:gap-8 md:px-8 md:pt-10 lg:flex-row-reverse lg:items-center lg:gap-[calc(var(--u)*3)] lg:py-[calc(var(--u)*1.5)] lg:pl-[2.448vw] lg:pr-[2.448vw]">
        <div className="contents lg:flex lg:w-[calc(var(--u)*22.813)] lg:shrink-0 lg:flex-col lg:self-stretch">
          <LawTitle lawNumber={lawNumber} title={title} className="order-1" />
          <p className="order-2 text-right text-[17px] leading-normal motion-safe:animate-fade-up motion-safe:[animation-delay:120ms] md:text-[20px] lg:mt-[calc(var(--u)*1.25)] lg:text-[calc(var(--u)*1.042)]">
            {instruction}
          </p>
          <NextStepButton step={step} totalSteps={totalSteps} onNext={onNext} className="order-4 lg:mt-auto" />
        </div>
        {/* The video keeps 16:9 and fills the rest of the row, never taller than the step allows. */}
        <div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:justify-start">
          <div className="relative order-3 aspect-video w-full overflow-hidden rounded-[32px] bg-stage motion-safe:animate-fade-in-scale motion-safe:[animation-delay:80ms] md:rounded-[48px] lg:max-w-[calc(var(--u)*38*16/9)] lg:rounded-[calc(var(--u)*2.604)]">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-10 pt-6 md:gap-8 md:px-8 md:pt-10 lg:flex-row lg:items-stretch lg:gap-[calc(var(--u)*5.781)] lg:py-[calc(var(--u)*1.5)] lg:pl-[2.448vw] lg:pr-[4.427vw]">
      {/* Title and instruction: on mobile its children join the outer column so the stage can follow them. */}
      <div className="contents lg:flex lg:w-[calc(var(--u)*22.813)] lg:shrink-0 lg:flex-col lg:justify-between">
        <LawTitle lawNumber={lawNumber} title={title} className="order-1" />
        <p
          className={cn(
            "order-2 text-right text-[17px] leading-normal motion-safe:animate-fade-up motion-safe:[animation-delay:120ms] md:text-[20px] lg:text-[calc(var(--u)*1.042)]",
            instructionClassName,
          )}
        >
          {instruction}
        </p>
      </div>

      <div className={cn("contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:pt-[calc(var(--u)*2.448)]", columnClassName)}>
        <div
          className={cn(
            "relative order-3 w-full overflow-hidden rounded-[32px] bg-stage motion-safe:animate-fade-in-scale motion-safe:[animation-delay:80ms] md:aspect-[973/545] md:rounded-[48px] lg:aspect-auto lg:h-[calc(var(--u)*28.387)] lg:rounded-[calc(var(--u)*3.125)]",
            stageClassName,
          )}
        >
          {children}
        </div>
        <NextStepButton step={step} totalSteps={totalSteps} onNext={onNext} className="order-4 lg:mt-[calc(var(--u)*1.042)]" />
      </div>
    </div>
  );
}
