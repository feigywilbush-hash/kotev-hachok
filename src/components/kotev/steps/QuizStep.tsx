import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "../icons";
import { playFail, playSuccess } from "../games/driveSounds";
import { LawTitle, NextStepButton, TiltedPhoto } from "./StepParts";
import { KnockActivity, type DoorEffect } from "./quiz/KnockActivity";

/*
 * "משחק ותרגול" step: a short quiz about respecting a "no entry" in social life.
 * Two kinds of question:
 *  - choice: three answers, the learner picks the one that respects the "no entry". A wrong pick
 *    shakes and is crossed out, the right one gets a check.
 *  - knock: the learner practises knocking politely on the door in the photo.
 * Solving a question unlocks "לשאלה הבאה"; from the second question on, "לשאלה הקודמת" goes back.
 * The last question ends the step with the wide yellow "התקדם לשלב הבא" button instead.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 * Mobile stacks: title → photo → progress → question → activity → buttons.
 */

type Photo = { src: string; alt: string };


export type QuizQuestion =
  | {
      kind: "choice";
      question: string;
      /** Listed right to left as they appear on screen. */
      answers: string[];
      correct: number;
      image: Photo;
    }
  | { kind: "knock"; question: string; instruction: string; image: Photo };

type QuizStepProps = {
  lawNumber: number;
  title: string;
  questions: QuizQuestion[];
  /** Lesson step shown on the last question's "next step" button. */
  step: number;
  totalSteps: number;
  /** Called from that button after the last question is solved. */
  onFinish?: () => void;
  /** Called with the question's index when it is solved. */
  onSolve?: (question: number) => void;
};

type Bubble = { id: number; text: string; x: number; y: number; loud: boolean };

export function QuizStep({ lawNumber, title, questions, step, totalSteps, onFinish, onSolve }: QuizStepProps) {
  const [index, setIndex] = useState(0);
  const [solvedSet, setSolvedSet] = useState<Set<number>>(() => new Set());
  const [wrong, setWrong] = useState<number[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const doorRef = useRef<HTMLDivElement>(null);
  const bubbleId = useRef(0);

  const q = questions[index];
  const last = index === questions.length - 1;
  const solved = solvedSet.has(index);

  const markSolved = () => {
    setSolvedSet((s) => new Set(s).add(index));
    onSolve?.(index);
  };

  const pick = (i: number) => {
    if (q.kind !== "choice" || solved || wrong.includes(i)) return;
    if (i === q.correct) {
      playSuccess();
      markSolved();
    } else {
      playFail();
      setWrong((w) => [...w, i]);
    }
  };

  const go = (to: number) => {
    setIndex(to);
    setWrong([]);
    setBubbles([]);
  };

  const next = () => {
    if (solved) go(index + 1);
  };

  const onDoor = (e: DoorEffect) => {
    const id = ++bubbleId.current;
    const loud = e.action === "hard";
    setBubbles((b) => [...b.slice(-4), { id, text: e.label, x: 30 + Math.random() * 40, y: 22 + Math.random() * 30, loud }]);
    // The door jolts with each knock: a big shake for a hard knock, a small tap otherwise.
    if (e.action === "pause" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const d = loud ? 6 : 2;
    doorRef.current?.animate(
      [{ translate: "0 0" }, { translate: `-${d}px 0` }, { translate: `${d}px 0` }, { translate: `-${d / 2}px 0` }, { translate: "0 0" }],
      { duration: loud ? 400 : 220, easing: "ease-in-out" },
    );
  };

  useEffect(() => {
    if (!bubbles.length) return;
    const t = window.setTimeout(() => setBubbles((b) => b.slice(1)), 1100);
    return () => window.clearTimeout(t);
  }, [bubbles]);

  return (
    <div className="flex flex-col gap-6 px-4 pb-10 pt-6 md:gap-8 md:px-8 md:pt-10 lg:flex-row lg:items-center lg:gap-[calc(var(--u)*2.865)] lg:py-[calc(var(--u)*1.5)] lg:pl-[2.865vw] lg:pr-[4.115vw]">
      {/* Text column: on mobile its children join the outer column so the photo can sit after the title. */}
      <div className="contents lg:order-1 lg:flex lg:min-w-0 lg:flex-1 lg:flex-col">
        {/* Title and question dots share a row on desktop: the dots sit at the far left and shrink
            on narrow windows, always keeping a gap from the title. */}
        <div className="contents lg:flex lg:items-end lg:justify-between lg:gap-[calc(var(--u)*2)]">
          <LawTitle lawNumber={lawNumber} title={title} className="order-1 lg:shrink-0" />

          <QuizProgress
            total={questions.length}
            current={index}
            className="order-3 w-full max-w-[505px] self-end lg:order-2 lg:mb-[calc(var(--u)*1.563)] lg:w-auto lg:min-w-[calc(var(--u)*6)] lg:max-w-none lg:shrink lg:basis-[calc(var(--u)*26.302)]"
          />
        </div>

        <p
          key={`q${index}`}
          className="order-4 whitespace-pre-line text-right text-[19px] font-bold leading-normal motion-safe:animate-fade-up md:text-[22px] lg:mt-[calc(var(--u)*0.859)] lg:text-[calc(var(--u)*1.25)]"
        >
          {q.question}
        </p>

        {q.kind === "choice" ? (
          <div
            key={`a${index}`}
            role="radiogroup"
            aria-label="בחר תשובה"
            className="order-5 flex flex-col gap-3 motion-safe:animate-fade-up motion-safe:[animation-delay:100ms] md:flex-row md:gap-4 lg:mt-[calc(var(--u)*0.964)] lg:h-[calc(var(--u)*14.063)] lg:gap-[calc(var(--u)*0.781)]"
          >
            {q.answers.map((answer, i) => {
              const isRight = solved && i === q.correct;
              const isWrong = wrong.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={isRight}
                  aria-disabled={isWrong || (solved && !isRight)}
                  onClick={() => pick(i)}
                  className={cn(
                    "flex flex-1 items-center gap-4 rounded-[24px] bg-answer px-5 py-4 text-right text-[17px] leading-normal transition-[transform,box-shadow,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-col md:justify-center md:gap-5 md:rounded-[30px] md:px-5 md:pb-8 md:pt-7 md:text-center md:text-[18px] lg:basis-0 lg:gap-[calc(var(--u)*1.042)] lg:rounded-[calc(var(--u)*1.5625)] lg:px-[calc(var(--u)*1.5625)] lg:pb-[calc(var(--u)*2.083)] lg:pt-[calc(var(--u)*1.823)] lg:text-[calc(var(--u)*1.042)]",
                    !solved && !isWrong && "hover:-translate-y-1 hover:shadow-[0_8px_20px_hsl(var(--mist)/0.45)] lg:hover:-translate-y-[calc(var(--u)*0.208)]",
                    isWrong && "opacity-60 motion-safe:animate-shake",
                    solved && !isRight && "opacity-60",
                    isRight && "shadow-[0_0_0_2px_hsl(var(--primary)/0.35)] lg:shadow-[0_0_0_calc(var(--u)*0.104)_hsl(var(--primary)/0.35)]",
                  )}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card md:size-[53px] lg:size-[calc(var(--u)*2.76)]">
                    {isRight && <Check aria-hidden="true" strokeWidth={3} className="size-5 text-primary motion-safe:animate-fade-in-scale md:size-6 lg:size-[calc(var(--u)*1.25)]" />}
                    {isWrong && <X aria-hidden="true" strokeWidth={3} className="size-5 text-alert md:size-6 lg:size-[calc(var(--u)*1.25)]" />}
                  </span>
                  <span>{answer}</span>
                </button>
              );
            })}
            <p role="status" className="sr-only">
              {solved ? "נכון!" : wrong.length ? "לא נכון, נסה תשובה אחרת" : ""}
            </p>
          </div>
        ) : (
          <div key={`k${index}`} className="order-5 motion-safe:animate-fade-up motion-safe:[animation-delay:100ms]">
            <p className="whitespace-pre-line text-right text-[16px] leading-normal md:text-[18px] lg:mt-[calc(var(--u)*0.755)] lg:text-[calc(var(--u)*1.042)]">
              {q.instruction}
            </p>
            <KnockActivity solved={solved} onSolved={markSolved} onEffect={onDoor} className="mt-4 md:mt-5 lg:mt-[calc(var(--u)*1.302)]" />
          </div>
        )}

        {last ? (
          // The last question ends the step: one wide "next step" button, as on the other steps.
          <NextStepButton
            step={step}
            totalSteps={totalSteps}
            onNext={() => solved && onFinish?.()}
            disabled={!solved}
            className={cn("order-6", q.kind === "choice" && "lg:mt-[calc(var(--u)*1.406)]")}
          />
        ) : (
        <div
          className={cn(
            "order-6 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between md:gap-[14px] lg:gap-[calc(var(--u)*0.729)]",
            q.kind === "choice" && "lg:mt-[calc(var(--u)*1.406)]",
          )}
        >
          {index > 0 && (
            <NavButton tone="back" onClick={() => go(index - 1)}>
              לשאלה הקודמת
            </NavButton>
          )}
          <NavButton tone="next" onClick={next} disabled={!solved} className="md:ms-auto">
            לשאלה הבאה
          </NavButton>
        </div>
        )}
      </div>

      <div className="relative order-2 mx-auto w-full max-w-[280px] md:max-w-[340px] lg:order-none lg:mx-0 lg:w-[calc(var(--u)*25.625)] lg:max-w-none lg:shrink-0">
        <div ref={doorRef}>
          <TiltedPhoto key={`photo${index}`} image={q.image} />
        </div>
        {bubbles.map((b) => (
          <span
            key={b.id}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-card/90 px-3 py-1 font-bold shadow-md motion-safe:animate-float-away lg:px-[calc(var(--u)*0.781)] lg:py-[calc(var(--u)*0.26)]",
              b.loud ? "text-[22px] text-alert md:text-[26px] lg:text-[calc(var(--u)*1.667)]" : "text-[16px] text-foreground md:text-[18px] lg:text-[calc(var(--u)*1.25)]",
            )}
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
          >
            {b.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function NavButton({
  tone,
  onClick,
  disabled,
  className,
  children,
}: {
  tone: "next" | "back";
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: string;
}) {
  const back = tone === "back";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-4 rounded-full p-3 transition-[filter,transform,opacity] duration-200 hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100 md:max-w-[479px] md:gap-6 md:p-4 lg:w-[calc(var(--u)*24.948)] lg:max-w-none lg:gap-[calc(var(--u)*1.25)] lg:p-[calc(var(--u)*0.833)]",
        back ? "flex-row-reverse justify-end bg-lime-soft" : "justify-end bg-lime",
        className,
      )}
    >
      <span className="text-[18px] md:text-[24px] lg:text-[calc(var(--u)*1.25)]">{children}</span>
      <span className="flex size-11 items-center justify-center rounded-full bg-card md:size-[53px] lg:size-[calc(var(--u)*2.76)]">
        <ArrowLeftIcon
          className={cn(
            "size-6 text-primary transition-transform duration-300 ease-out lg:size-[calc(var(--u)*1.25)]",
            back
              ? "rotate-180 motion-safe:group-hover:translate-x-1 lg:motion-safe:group-hover:translate-x-[calc(var(--u)*0.26)]"
              : "motion-safe:group-enabled:group-hover:-translate-x-1 lg:motion-safe:group-enabled:group-hover:-translate-x-[calc(var(--u)*0.26)]",
          )}
        />
      </span>
    </button>
  );
}

/** A dot per question on a faint track; the yellow line grows from the right as questions go by. */
function QuizProgress({ total, current, className }: { total: number; current: number; className?: string }) {
  // A dot per question; the yellow line reaches the current question's dot.
  const step = 100 / Math.max(total - 1, 1);
  const reached = current;
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`שאלה ${current + 1} מתוך ${total}`}
      className={cn("relative h-[15px] lg:h-[calc(var(--u)*0.768)]", className)}
    >
      <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-progress-track/[0.31] lg:h-[calc(var(--u)*0.521)]" />
      {/* Dot centres run between the two end dots, so the inner strip is inset by half a dot. */}
      <div className="absolute inset-y-0 left-[7.5px] right-[7.5px] lg:left-[calc(var(--u)*0.384)] lg:right-[calc(var(--u)*0.384)]">
        <div
          className="absolute -right-[4px] top-1/2 h-[3px] w-[calc(var(--done)+8px)] -translate-y-1/2 rounded-full bg-brand-sun transition-[width] duration-500 ease-out lg:-right-[calc(var(--u)*0.19)] lg:h-[calc(var(--u)*0.156)] lg:w-[calc(var(--done)+calc(var(--u)*0.38))]"
          style={{ "--done": `${reached * step}%` } as CSSProperties}
        />
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="absolute top-0 size-[15px] translate-x-1/2 rounded-full bg-brand-sun lg:size-[calc(var(--u)*0.768)]"
            style={{ right: `${i * step}%` }}
          />
        ))}
      </div>
    </div>
  );
}
