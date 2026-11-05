import { useEffect, useRef, useState, type ReactNode } from "react";

import { burstConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import { playFail, playSuccess } from "../games/driveSounds";
import { NavButton } from "./QuizStep";
import { LawTitle, NextStepButton } from "./StepParts";

/*
 * "משחק ותרגול" step of the personal-space law (Figma "משחק ותרגול חוק 4"): two pictures side by side,
 * and the player taps the one where the children keep a proper personal space. A right pick gets a
 * green ring, a check, confetti and a success sound; a wrong one shakes and shows a hint. The green
 * "next" button moves to the next question; the last one has the yellow "התקדם לשלב הבא" button instead.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (u = px / 19.2 from the 1920px Figma frame).
 * Mobile stacks: title → instruction → pictures → buttons.
 */

type Picture = { src: string; alt: string };

export type SpaceRound = {
  /** The two pictures, in the order they are shown (right, then left). */
  options: [Picture, Picture];
  /** Index of the picture with the proper personal space. */
  correct: 0 | 1;
  /** Shown when the other picture is picked. */
  hint: string;
  /** Shown when the round is solved. */
  praise: string;
};

type SpaceChoiceStepProps = {
  lawNumber: number;
  title: string;
  instruction: ReactNode;
  rounds: SpaceRound[];
  step: number;
  totalSteps: number;
  onNext?: () => void;
  onSolve?: (round: number) => void;
};

export function SpaceChoiceStep({ lawNumber, title, instruction, rounds, step, totalSteps, onNext, onSolve }: SpaceChoiceStepProps) {
  const [round, setRound] = useState(0);
  // Questions answered so far: going back to one shows it answered, and "next" waits for an answer.
  const [done, setDone] = useState<Set<number>>(() => new Set());
  const [hint, setHint] = useState<string | null>(null);
  const [shaking, setShaking] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const current = rounds[round];
  const last = round === rounds.length - 1;
  const solved = done.has(round);

  const choose = (i: number) => {
    if (solved) return;
    if (i === current.correct) {
      setDone((d) => new Set(d).add(round));
      setHint(null);
      setWrong(null);
      playSuccess();
      const r = cardRefs.current[i]?.getBoundingClientRect();
      if (r) burstConfetti({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      onSolve?.(round);
    } else {
      playFail();
      setShaking(i);
      setWrong(i);
      setHint(current.hint);
    }
  };

  const goRound = (to: number) => {
    setHint(null);
    setShaking(null);
    setWrong(null);
    setRound(to);
  };

  useEffect(() => {
    if (shaking === null) return;
    const t = window.setTimeout(() => setShaking(null), 450);
    return () => window.clearTimeout(t);
  }, [shaking]);

  return (
    <div className="flex flex-col gap-6 px-4 pb-10 pt-6 md:gap-8 md:px-8 md:pt-10 lg:flex-row lg:justify-between lg:gap-[calc(var(--u)*2.6)] lg:pb-[calc(var(--u)*1.5)] lg:pl-[calc(var(--u)*1.979)] lg:pr-[calc(var(--u)*3.75)] lg:pt-[calc(var(--u)*2.9)]">
      {/* Text column (right on desktop): the law's title on top, the game's explanation and feedback below */}
      <div className="contents lg:flex lg:min-w-0 lg:max-w-[calc(var(--u)*29.8)] lg:flex-1 lg:flex-col">
        <LawTitle lawNumber={lawNumber} title={title} className="order-1" />
        <div className="order-2 flex flex-col gap-3 text-right lg:mt-auto lg:gap-[calc(var(--u)*1)] lg:pb-[calc(var(--u)*0.4)]">
          {rounds.length > 1 && (
            <p className="text-[15px] text-muted-foreground md:text-[17px] lg:text-[calc(var(--u)*1.04)]">
              שאלה {round + 1} מתוך {rounds.length}
            </p>
          )}
          <p className="text-[17px] leading-normal motion-safe:animate-fade-up motion-safe:[animation-delay:120ms] md:text-[20px] lg:text-[calc(var(--u)*1.25)]">
            {instruction}
          </p>
          <p
            role="status"
            key={`${round}-${solved}-${hint}`}
            className={cn(
              "min-h-[1.5em] text-[18px] font-bold leading-snug motion-safe:animate-fade-up md:text-[22px] lg:text-[calc(var(--u)*1.35)]",
              solved ? "text-primary" : "text-alert",
            )}
          >
            {solved ? (
              <>
                <span aria-hidden="true">🎉 </span>
                {current.praise}
              </>
            ) : (
              hint
            )}
          </p>
        </div>
      </div>

      {/* Game column (left on desktop): the two pictures and the buttons under them */}
      <div className="contents lg:flex lg:w-[calc(var(--u)*53.23)] lg:shrink-0 lg:flex-col lg:gap-[calc(var(--u)*1.51)]">
        <div key={`pictures-${round}`} className="order-3 grid grid-cols-2 gap-3 motion-safe:animate-fade-in-scale md:gap-6 lg:gap-[calc(var(--u)*2.29)]">
          {current.options.map((o, i) => {
            const right = solved && i === current.correct;
            const dim = solved && i !== current.correct;
            return (
              <button
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                type="button"
                aria-label={o.alt}
                aria-pressed={right}
                disabled={solved}
                onClick={() => choose(i)}
                className={cn(
                  "group relative aspect-[489/524] overflow-hidden rounded-[22px] bg-card transition-[transform,box-shadow,opacity,filter] duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring md:rounded-[36px] lg:rounded-[calc(var(--u)*2.6)]",
                  !solved && "cursor-pointer hover:-translate-y-1 hover:shadow-[0_14px_32px_hsl(var(--mist)/0.7)]",
                  right && "ring-4 ring-[#5cb87a] lg:ring-[calc(var(--u)*0.31)]",
                  wrong === i && !solved && "ring-4 ring-alert/60 lg:ring-[calc(var(--u)*0.31)]",
                  shaking === i && "motion-safe:animate-shake",
                )}
              >
                <img src={o.src} alt="" draggable={false} className={cn("absolute inset-0 size-full object-cover transition-[opacity,filter] duration-300", dim && "opacity-45 grayscale-[40%]")} />
                {/* Checklist circle at the top of the picture: empty until picked, a green check on the right one, a red x on a wrong pick */}
                <span
                  aria-hidden="true"
                  key={right ? "right" : wrong === i ? "wrong" : "empty"}
                  className={cn(
                    "absolute left-1/2 top-3 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border-[3px] text-[20px] font-bold leading-none shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-colors duration-200 md:top-5 md:size-12 md:text-[26px] lg:top-[calc(var(--u)*1.25)] lg:size-[calc(var(--u)*3.1)] lg:border-[calc(var(--u)*0.21)] lg:text-[calc(var(--u)*1.75)]",
                    right
                      ? "border-white bg-[#5cb87a] text-white motion-safe:animate-fade-in-scale"
                      : wrong === i && !solved
                        ? "border-white bg-alert text-white motion-safe:animate-fade-in-scale"
                        : "border-white bg-white/70 text-transparent group-hover:bg-white",
                  )}
                >
                  {right ? "✓" : wrong === i && !solved ? "✗" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {/* Buttons: back on the right, next on the left; the last question has only the wide yellow next-step button */}
        <div className="order-5 flex flex-col-reverse gap-3 md:flex-row md:gap-[14px] lg:gap-[calc(var(--u)*0.729)]">
          {round > 0 && !last && (
            <NavButton tone="back" onClick={() => goRound(round - 1)} className="md:max-w-none md:flex-1 lg:w-auto">
              לשאלה הקודמת
            </NavButton>
          )}
          {last ? (
            <NextStepButton step={step} totalSteps={totalSteps} onNext={onNext} disabled={!solved} />
          ) : (
            <NavButton tone="next" onClick={() => goRound(round + 1)} disabled={!solved} className="md:ms-auto md:w-[calc(50%-7px)] md:max-w-none lg:w-[calc(50%-var(--u)*0.365)]">
              לשאלה הבאה
            </NavButton>
          )}
        </div>
      </div>
    </div>
  );
}
