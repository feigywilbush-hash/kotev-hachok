import { cn } from "@/lib/utils";

type LessonProgressProps = {
  steps: string[];
  /** Index of the step the learner is on (0 = first step, on the right). */
  current: number;
  /** How far along the road to the next step the coral line reaches, 0–1. */
  progress?: number;
  /** When set, step names become buttons that open that step. */
  onStepSelect?: (index: number) => void;
  className?: string;
};

const SNAIL_SRC = "./assets/snail.png";

/*
 * Geometry lives in CSS variables: px on mobile/tablet, vw on desktop
 * (vw = px / 19.2 from the 1920px Figma frame).
 *   --snail  snail width            --gap   snail top → track centre
 *   --label  track centre → label   --tail  label centre → bottom
 *   --over   how far the track runs past the first/last dot
 */
const GEOMETRY = cn(
  "[--snail:40px] [--gap:19px] [--label:37px] [--tail:20px] [--over:6px]",
  "md:[--snail:48px] md:[--tail:12px] md:[--over:7px]",
  "lg:[--snail:2.917vw] lg:[--gap:0.99vw] lg:[--label:1.927vw] lg:[--tail:0.573vw] lg:[--over:0.385vw]",
);

/**
 * The "road" at the top of the page: a track with a dot per step, a coral line
 * for what is done, and the snail sitting on the current step. Reads right to left.
 */
export function LessonProgress({ steps, current, progress = 0, onStepSelect, className }: LessonProgressProps) {
  const last = Math.max(steps.length - 1, 1);
  const at = (i: number) => `${(i / last) * 100}%`;
  const done = Math.min(current + progress, last);
  const Label = onStepSelect ? "button" : "span";

  return (
    <div
      className={cn(
        "relative h-[calc(var(--snail)+var(--gap)+var(--label)+var(--tail))] [--track-y:calc(var(--snail)+var(--gap))]",
        GEOMETRY,
        className,
      )}
    >
      {/* track */}
      <div className="absolute -left-[var(--over)] -right-[var(--over)] top-[var(--track-y)] h-2 -translate-y-1/2 rounded-full bg-progress-track md:h-[10px] lg:h-[0.531vw]" />
      {/* completed part */}
      <div
        className="absolute -right-[var(--over)] top-[var(--track-y)] h-1.5 -translate-y-1/2 origin-right rounded-full bg-primary transition-[width] duration-700 ease-out motion-safe:animate-grow-x motion-safe:[animation-delay:150ms] md:h-2 lg:h-[0.422vw]"
        style={{ width: `calc(${at(done)} + var(--over))` }}
      />

      <img
        src={SNAIL_SRC}
        alt=""
        className="absolute top-0 aspect-[56/55] w-[var(--snail)] translate-x-1/2 object-contain transition-[right] duration-700 ease-out motion-safe:animate-bob"
        style={{ right: at(current) }}
      />

      <ol className="contents">
        {steps.map((label, i) => (
          <li key={label} aria-current={i === current ? "step" : undefined} className="group">
            <span
              className="absolute top-[var(--track-y)] size-[12px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary transition-transform duration-200 ease-out group-hover:scale-150 md:size-[14px] lg:size-[0.766vw]"
              style={{ right: at(i) }}
            />
            <Label
              className="absolute top-[calc(var(--track-y)+var(--label))] w-max max-w-[20%] -translate-y-1/2 translate-x-1/2 text-balance text-center text-[13px] leading-tight transition-colors duration-200 group-hover:text-primary focus-visible:text-primary focus-visible:outline-none md:text-[16px] lg:max-w-none lg:text-[1.042vw]"
              style={{ right: at(i) }}
              {...(onStepSelect && { type: "button" as const, onClick: () => onStepSelect(i) })}
            >
              {label}
            </Label>
          </li>
        ))}
      </ol>
    </div>
  );
}
