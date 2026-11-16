import { RotateCcw } from "lucide-react";

import { burstConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import { playWin } from "../games/driveSounds";
import { ArrowLeftIcon } from "../icons";

/*
 * Pieces shared by every lesson step.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 */

export const softCard = "border border-mist/30";
export const softShadow =
  "shadow-[3px_9px_18px_0_hsl(var(--mist)/0.3)] lg:shadow-[calc(var(--u)*0.26)_calc(var(--u)*0.781)_calc(var(--u)*1.5625)_0_hsl(var(--mist)/0.3)]";

/** "חוק מספר N" in handwriting over the law's name in coral. A long name wraps with tight lines; the padding keeps a one-line name as tall as before. */
export function LawTitle({ lawNumber, title, className }: { lawNumber: number; title: string; className?: string }) {
  return (
    <header className={cn("text-right motion-safe:animate-fade-up", className)}>
      <p className="font-hand text-[42px] leading-normal md:text-[56px] lg:text-[calc(var(--u)*5)]">חוק מספר {lawNumber}</p>
      <h1 className="-mt-6 text-[48px] py-[0.2em] font-bold leading-[1.1] text-primary md:-mt-5 md:text-[64px] lg:-mt-[calc(var(--u)*2.969)] lg:py-[0.15em] lg:text-[calc(var(--u)*5.208)]">
        {title}
      </h1>
    </header>
  );
}

/** Yellow pill: "התקדם לשלב הבא" on the right, an arrow on the left. (step/totalSteps are kept for the callers but no longer shown.) */
export function NextStepButton({
  onNext,
  disabled,
  className,
}: {
  step?: number;
  totalSteps?: number;
  onNext?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // A little celebration on every move to the next step: confetti from the button and a success tune.
        const r = e.currentTarget.getBoundingClientRect();
        burstConfetti({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        playWin();
        onNext?.();
      }}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center justify-between rounded-full bg-brand-sun p-3 text-right transition-[filter,transform] duration-200 hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100 disabled:active:scale-100 motion-safe:animate-fade-up motion-safe:[animation-delay:240ms] md:p-4 lg:p-[calc(var(--u)*0.833)]",
        className,
      )}
    >
      <span className="ps-3 text-[18px] md:ps-4 md:text-[24px] lg:ps-[calc(var(--u)*0.833)] lg:text-[calc(var(--u)*1.25)]">התקדם לשלב הבא</span>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card md:size-[53px] lg:size-[calc(var(--u)*2.76)]">
        <ArrowLeftIcon className="size-6 text-primary transition-transform duration-300 ease-out motion-safe:group-enabled:group-hover:-translate-x-1 lg:size-[calc(var(--u)*1.25)] lg:motion-safe:group-enabled:group-hover:-translate-x-[calc(var(--u)*0.26)]" />
      </span>
    </button>
  );
}

/** Light-green pill under a finished game: "לשחק שוב" and a replay icon, starts the game from its first question. */
export function ReplayButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center justify-between gap-3 rounded-full bg-lime-soft p-3 text-right transition-[filter,transform] duration-200 hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-safe:animate-fade-up motion-safe:[animation-delay:300ms] md:p-4 lg:p-[calc(var(--u)*0.833)]",
        className,
      )}
    >
      <span className="ps-3 text-[18px] md:ps-4 md:text-[24px] lg:ps-[calc(var(--u)*0.833)] lg:text-[calc(var(--u)*1.25)]">לשחק שוב</span>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card md:size-[53px] lg:size-[calc(var(--u)*2.76)]">
        <RotateCcw className="size-6 text-primary transition-transform duration-500 ease-out motion-safe:group-hover:-rotate-180 lg:size-[calc(var(--u)*1.25)]" />
      </span>
    </button>
  );
}

/** A photo in a white card with a tilted blue plate behind it. Width and placement come from className. */
/** `wideOnPhone`: below md the photo is cropped to a landscape frame (and the plate tilts less) so it sits flatter in the page. */
export function TiltedPhoto({ image, wideOnPhone = false, className }: { image: { src: string; alt: string }; wideOnPhone?: boolean; className?: string }) {
  return (
    <figure className={cn("group relative motion-safe:animate-fade-in-scale motion-safe:[animation-delay:80ms]", className)}>
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 translate-y-[9px] rounded-[40px] bg-plate transition-transform duration-500 ease-out motion-safe:group-hover:rotate-[7deg] lg:translate-x-[calc(var(--u)*0.039)] lg:translate-y-[calc(var(--u)*0.729)] lg:rounded-[calc(var(--u)*3.125)]",
          wideOnPhone ? "rotate-[2.5deg] md:rotate-[4.96deg]" : "rotate-[4.96deg]",
          softCard,
          softShadow,
        )}
      />
      <div
        className={cn(
          "relative rounded-[40px] bg-card p-5 transition-transform duration-500 ease-out motion-safe:group-hover:-rotate-1 lg:rounded-[calc(var(--u)*3.125)] lg:p-[calc(var(--u)*1.5625)]",
          softCard,
          softShadow,
        )}
      >
        <img
          src={image.src}
          alt={image.alt}
          className={cn(
            "w-full rounded-[26px] object-cover lg:rounded-[calc(var(--u)*2.083)]",
            wideOnPhone ? "aspect-[4/3] object-[50%_22%] md:aspect-[432/603] md:object-center" : "aspect-[432/603]",
          )}
        />
      </div>
    </figure>
  );
}
