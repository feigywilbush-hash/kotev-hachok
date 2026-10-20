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

/** "חוק מספר N" in handwriting over the law's name in coral. */
export function LawTitle({ lawNumber, title, className }: { lawNumber: number; title: string; className?: string }) {
  return (
    <header className={cn("text-right motion-safe:animate-fade-up", className)}>
      <p className="font-hand text-[36px] leading-normal md:text-[56px] lg:text-[calc(var(--u)*5)]">חוק מספר {lawNumber}</p>
      <h1 className="-mt-3 text-[48px] font-bold leading-normal text-primary md:-mt-5 md:text-[64px] lg:-mt-[calc(var(--u)*2.969)] lg:text-[calc(var(--u)*5.208)] lg:leading-[1.4]">
        {title}
      </h1>
    </header>
  );
}

/** Yellow pill: step counter on the right, "התקדם לשלב הבא" and an arrow on the left. */
export function NextStepButton({
  step,
  totalSteps,
  onNext,
  disabled,
  className,
}: {
  step: number;
  totalSteps: number;
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
      <span className="flex w-12 justify-center text-[18px] md:w-16 md:text-[24px] lg:w-[calc(var(--u)*3.333)] lg:text-[calc(var(--u)*1.25)]">
        {step}/{totalSteps}
      </span>
      <span className="flex items-center gap-3 md:gap-6 lg:gap-[calc(var(--u)*1.25)]">
        <span className="text-[18px] md:text-[24px] lg:text-[calc(var(--u)*1.25)]">התקדם לשלב הבא</span>
        <span className="flex size-11 items-center justify-center rounded-full bg-card md:size-[53px] lg:size-[calc(var(--u)*2.76)]">
          <ArrowLeftIcon className="size-6 text-primary transition-transform duration-300 ease-out motion-safe:group-enabled:group-hover:-translate-x-1 lg:size-[calc(var(--u)*1.25)] lg:motion-safe:group-enabled:group-hover:-translate-x-[calc(var(--u)*0.26)]" />
        </span>
      </span>
    </button>
  );
}

/** A photo in a white card with a tilted blue plate behind it. Width and placement come from className. */
export function TiltedPhoto({ image, className }: { image: { src: string; alt: string }; className?: string }) {
  return (
    <figure className={cn("group relative motion-safe:animate-fade-in-scale motion-safe:[animation-delay:80ms]", className)}>
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 translate-y-[9px] rotate-[4.96deg] rounded-[40px] bg-plate transition-transform duration-500 ease-out motion-safe:group-hover:rotate-[7deg] lg:translate-x-[calc(var(--u)*0.039)] lg:translate-y-[calc(var(--u)*0.729)] lg:rounded-[calc(var(--u)*3.125)]",
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
        <img src={image.src} alt={image.alt} className="aspect-[432/603] w-full rounded-[26px] object-cover lg:rounded-[calc(var(--u)*2.083)]" />
      </div>
    </figure>
  );
}
