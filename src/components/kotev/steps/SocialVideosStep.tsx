import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { playFail, playSuccess } from "../games/driveSounds";
import { ArrowLeftIcon } from "../icons";
import { LawTitle, NextStepButton } from "./StepParts";

/*
 * "בכביש החברתי" step made of a few short videos: each video plays in the stage, and when it
 * ends the stage turns into a short activity about it (a choice question, or putting steps in
 * order). Solving the activity opens the next video. Tabs over the stage go back to any part
 * already opened.
 * Layout follows StageStep: the law's title and the part's instruction on the right, the stage
 * and the next-step button on the left. On a phone the activity grows the stage to its own height.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 */

export type SocialActivity =
  | {
      kind: "choice";
      question: string;
      /** Each answer can open with an emoji, shown large. */
      answers: { text: string; icon?: string }[];
      correct: number;
      /** Shown once the right answer is picked. */
      explain: string;
    }
  | {
      kind: "order";
      question: string;
      /** In the right order; shown shuffled. */
      steps: string[];
      explain: string;
    };

export type SocialPart = {
  label: string;
  instruction: string;
  video: { src: string; poster: string; title: string };
  activities: SocialActivity[];
};

type Props = {
  lawNumber: number;
  title: string;
  parts: SocialPart[];
  step: number;
  totalSteps: number;
  onNext?: () => void;
  /** Called with the part's index when its activities are all solved. */
  onSolve?: (part: number) => void;
};

export function SocialVideosStep({ lawNumber, title, parts, step, totalSteps, onNext, onSolve }: Props) {
  const [part, setPart] = useState(0);
  const [opened, setOpened] = useState(1); // parts the learner can go to
  const [solved, setSolved] = useState<Set<number>>(() => new Set());
  const [view, setView] = useState<"video" | "activity">("video");
  const [activity, setActivity] = useState(0);
  const [answered, setAnswered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoplay = useRef(false);

  const p = parts[part];
  const allDone = solved.size === parts.length;

  // Moving on to a new video by a click may start it right away.
  useEffect(() => {
    if (view === "video" && autoplay.current) {
      autoplay.current = false;
      void videoRef.current?.play().catch(() => {});
    }
  }, [part, view]);

  const goPart = (i: number, play = false) => {
    autoplay.current = play;
    setPart(i);
    setActivity(0);
    setAnswered(false);
    setView("video");
  };

  const lastActivity = activity === p.activities.length - 1;
  const finishActivity = () => {
    setAnswered(true);
    if (!lastActivity) return;
    if (!solved.has(part)) {
      setSolved((s) => new Set(s).add(part));
      onSolve?.(part);
      setOpened((o) => Math.max(o, Math.min(parts.length, part + 2)));
    }
  };

  const partDone = solved.has(part) && lastActivity;

  return (
    <div className="flex flex-col gap-6 px-4 pb-10 pt-6 md:gap-8 md:px-8 md:pt-10 lg:flex-row lg:items-stretch lg:gap-[calc(var(--u)*4.5)] lg:py-[calc(var(--u)*1.5)] lg:pl-[2.448vw] lg:pr-[4.427vw]">
      <div className="contents lg:flex lg:w-[calc(var(--u)*22.813)] lg:shrink-0 lg:flex-col lg:justify-between">
        <LawTitle lawNumber={lawNumber} title={title} className="order-1" />
        <div key={part} className="order-2 text-right motion-safe:animate-fade-up lg:pb-[calc(var(--u)*1.667)]">
          <p className="text-[15px] font-bold text-primary md:text-[18px] lg:text-[calc(var(--u)*1.042)]">
            סרטון {part + 1} מתוך {parts.length}: {p.label}
          </p>
          <p className="mt-1 text-[17px] leading-normal md:text-[20px] lg:mt-[calc(var(--u)*0.26)] lg:text-[calc(var(--u)*1.042)]">{p.instruction}</p>
        </div>
      </div>

      <div className="contents lg:mr-auto lg:flex lg:min-w-0 lg:max-w-[calc(var(--u)*50.466)] lg:flex-1 lg:flex-col lg:pt-[calc(var(--u)*1.2)]">
        {/* Parts: open ones can be revisited */}
        <div role="tablist" aria-label="סרטונים" className="order-3 flex gap-2 lg:mb-[calc(var(--u)*0.625)] lg:gap-[calc(var(--u)*0.521)]">
          {parts.map((pt, i) => {
            const locked = i >= opened;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === part}
                disabled={locked}
                onClick={() => goPart(i)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 md:text-[16px] lg:gap-[calc(var(--u)*0.39)] lg:px-[calc(var(--u)*0.833)] lg:py-[calc(var(--u)*0.26)] lg:text-[calc(var(--u)*0.938)]",
                  i === part ? "bg-primary text-primary-foreground" : "bg-sidebar/45 hover:bg-sidebar/70",
                )}
              >
                {solved.has(i) && <Check aria-hidden="true" strokeWidth={3} className="size-4 lg:size-[calc(var(--u)*0.833)]" />}
                סרטון {i + 1}
                <span className="sr-only">: {pt.label}</span>
              </button>
            );
          })}
        </div>

        <div
          className={cn(
            "relative order-4 w-full overflow-hidden rounded-[32px] bg-stage motion-safe:animate-fade-in-scale md:rounded-[48px] lg:aspect-video lg:rounded-[calc(var(--u)*3.125)]",
            view === "video" && "aspect-video",
          )}
        >
          {view === "video" ? (
            <video
              key={p.video.src}
              ref={videoRef}
              src={p.video.src}
              poster={p.video.poster}
              controls
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              onEnded={() => setView("activity")}
              playsInline
              preload="metadata"
              aria-label={p.video.title}
              className="absolute inset-0 size-full bg-foreground object-contain"
            />
          ) : (
            <div className="flex h-full flex-col bg-sidebar/35 px-4 py-5 md:px-8 md:py-7 lg:absolute lg:inset-0 lg:px-[calc(var(--u)*2.5)] lg:py-[calc(var(--u)*1.75)]">
              <ActivityView
                key={`${part}-${activity}`}
                activity={p.activities[activity]}
                onSolved={finishActivity}
                done={solved.has(part) && activity === p.activities.length - 1}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 lg:mt-auto lg:pt-[calc(var(--u)*0.833)]">
                <button
                  type="button"
                  onClick={() => goPart(part, true)}
                  className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[14px] text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-[16px] lg:gap-[calc(var(--u)*0.39)] lg:text-[calc(var(--u)*0.938)]"
                >
                  <RotateCcw aria-hidden="true" className="size-4 lg:size-[calc(var(--u)*0.938)]" />
                  לצפות שוב בסרטון
                </button>
                {answered && !lastActivity && (
                  <PillButton
                    onClick={() => {
                      setActivity(activity + 1);
                      setAnswered(false);
                    }}
                  >
                    לשאלה הבאה
                  </PillButton>
                )}
                {partDone && part + 1 < parts.length && (
                  <PillButton onClick={() => goPart(part + 1, true)}>לסרטון הבא</PillButton>
                )}
                {partDone && part + 1 === parts.length && (
                  <p className="text-[15px] font-bold text-primary md:text-[18px] lg:text-[calc(var(--u)*1.042)]">כל הכבוד! סיימת את כל הסרטונים 🎉</p>
                )}
              </div>
            </div>
          )}
        </div>

        <NextStepButton
          step={step}
          totalSteps={totalSteps}
          onNext={onNext}
          className={cn("order-5 lg:mt-[calc(var(--u)*1.042)]", allDone && "ring-4 ring-primary/30")}
        />
      </div>
    </div>
  );
}

function ActivityView({ activity, onSolved, done }: { activity: SocialActivity; onSolved: () => void; done: boolean }) {
  return activity.kind === "choice" ? (
    <ChoiceActivity activity={activity} onSolved={onSolved} done={done} />
  ) : (
    <OrderActivity activity={activity} onSolved={onSolved} done={done} />
  );
}

const QUESTION = "text-right text-[17px] font-bold leading-snug md:text-[21px] lg:text-[calc(var(--u)*1.25)]";
const EXPLAIN =
  "mt-3 rounded-[16px] bg-card px-4 py-2 text-right text-[15px] leading-snug motion-safe:animate-fade-up md:text-[17px] lg:mt-[calc(var(--u)*0.833)] lg:rounded-[calc(var(--u)*0.833)] lg:px-[calc(var(--u)*1.042)] lg:py-[calc(var(--u)*0.521)] lg:text-[calc(var(--u)*0.99)]";

function ChoiceActivity({ activity, onSolved, done }: { activity: Extract<SocialActivity, { kind: "choice" }>; onSolved: () => void; done: boolean }) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [right, setRight] = useState(done);
  const icons = activity.answers.some((a) => a.icon);

  const pick = (i: number) => {
    if (right || wrong.includes(i)) return;
    if (i === activity.correct) {
      setRight(true);
      playSuccess();
      onSolved();
    } else {
      setWrong((w) => [...w, i]);
      playFail();
    }
  };

  return (
    <div className="motion-safe:animate-fade-up">
      <p className={QUESTION}>{activity.question}</p>
      <div
        role="radiogroup"
        aria-label="בחר תשובה"
        className={cn(
          "mt-3 flex gap-2 lg:mt-[calc(var(--u)*0.833)] lg:gap-[calc(var(--u)*0.625)]",
          icons ? "flex-row" : "flex-col",
        )}
      >
        {activity.answers.map((a, i) => {
          const isRight = right && i === activity.correct;
          const isWrong = wrong.includes(i);
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isRight}
              onClick={() => pick(i)}
              className={cn(
                "flex items-center gap-3 rounded-[18px] bg-card px-3 py-2 text-right text-[15px] leading-snug transition-[transform,box-shadow,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-[17px] lg:gap-[calc(var(--u)*0.729)] lg:rounded-[calc(var(--u)*1.042)] lg:px-[calc(var(--u)*0.833)] lg:py-[calc(var(--u)*0.521)] lg:text-[calc(var(--u)*0.99)]",
                icons && "flex-1 flex-col justify-center gap-1 text-center lg:gap-[calc(var(--u)*0.26)]",
                !right && !isWrong && "hover:-translate-y-0.5 hover:shadow-[0_6px_16px_hsl(var(--mist)/0.45)]",
                isWrong && "opacity-55 motion-safe:animate-shake",
                right && !isRight && "opacity-55",
                isRight && "shadow-[0_0_0_2px_hsl(var(--primary)/0.45)]",
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-answer lg:size-[calc(var(--u)*1.875)]">
                {isRight && <Check aria-hidden="true" strokeWidth={3} className="size-4 text-primary lg:size-[calc(var(--u)*1.042)]" />}
                {isWrong && <X aria-hidden="true" strokeWidth={3} className="size-4 text-alert lg:size-[calc(var(--u)*1.042)]" />}
              </span>
              {a.icon && (
                <span aria-hidden="true" className="text-[26px] leading-none md:text-[34px] lg:text-[calc(var(--u)*2.1)]">
                  {a.icon}
                </span>
              )}
              <span>{a.text}</span>
            </button>
          );
        })}
      </div>
      <p role="status" className={cn(right ? EXPLAIN : "sr-only")}>
        {right ? `נכון! ${activity.explain}` : wrong.length ? "לא בדיוק, נסו תשובה אחרת" : ""}
      </p>
    </div>
  );
}

/** Tap the steps in the right order; each right tap gets its number, a wrong one shakes with a hint. */
function OrderActivity({ activity, onSolved, done }: { activity: Extract<SocialActivity, { kind: "order" }>; onSolved: () => void; done: boolean }) {
  const [shuffled] = useState(() => shuffle(activity.steps.map((_, i) => i)));
  const [placed, setPlaced] = useState(done ? activity.steps.length : 0);
  const [shake, setShake] = useState<number | null>(null);
  const [hint, setHint] = useState("");
  const complete = placed === activity.steps.length;

  const pick = (i: number) => {
    if (complete || i < placed) return;
    if (i === placed) {
      const next = placed + 1;
      setPlaced(next);
      setHint("");
      if (next === activity.steps.length) {
        playSuccess();
        onSolved();
      }
    } else {
      setShake(i);
      setHint(`לא עכשיו. מה בא קודם? רמז: "${activity.steps[placed]}"`);
      playFail();
      window.setTimeout(() => setShake(null), 450);
    }
  };

  return (
    <div className="motion-safe:animate-fade-up">
      <p className={QUESTION}>{activity.question}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:mt-[calc(var(--u)*0.833)] lg:gap-[calc(var(--u)*0.521)]">
        {shuffled.map((i) => {
          const n = i < placed ? i + 1 : null;
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              aria-label={n ? `${n}. ${activity.steps[i]}` : activity.steps[i]}
              className={cn(
                "flex items-center gap-3 rounded-[18px] bg-card px-3 py-2 text-right text-[15px] leading-snug transition-[transform,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-[17px] lg:gap-[calc(var(--u)*0.625)] lg:rounded-[calc(var(--u)*1.042)] lg:px-[calc(var(--u)*0.833)] lg:py-[calc(var(--u)*0.469)] lg:text-[calc(var(--u)*0.99)]",
                n ? "bg-brand-sun/45" : "hover:-translate-y-0.5 hover:shadow-[0_6px_16px_hsl(var(--mist)/0.45)]",
                shake === i && "motion-safe:animate-shake",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-[16px] font-bold lg:size-[calc(var(--u)*1.875)] lg:text-[calc(var(--u)*1.042)]",
                  n ? "bg-primary text-primary-foreground motion-safe:animate-fade-in-scale" : "bg-answer",
                )}
              >
                {n ?? ""}
              </span>
              <span>{activity.steps[i]}</span>
            </button>
          );
        })}
      </div>
      <p role="status" className={cn(complete || hint ? EXPLAIN : "sr-only", hint && !complete && "text-alert")}>
        {complete ? `מצוין! ${activity.explain}` : hint}
      </p>
    </div>
  );
}

function PillButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2 rounded-full bg-lime py-1.5 pe-1.5 ps-4 text-[15px] transition-[filter,transform] duration-200 hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-safe:animate-fade-up md:text-[18px] lg:gap-[calc(var(--u)*0.625)] lg:py-[calc(var(--u)*0.365)] lg:pe-[calc(var(--u)*0.365)] lg:ps-[calc(var(--u)*1.042)] lg:text-[calc(var(--u)*1.042)]"
    >
      {children}
      <span className="flex size-8 items-center justify-center rounded-full bg-card lg:size-[calc(var(--u)*2.083)]">
        <ArrowLeftIcon className="size-4 text-primary transition-transform duration-300 motion-safe:group-hover:-translate-x-0.5 lg:size-[calc(var(--u)*1.042)]" />
      </span>
    </button>
  );
}

function shuffle(a: number[]) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  // Never start already in order.
  return r.every((v, i) => v === i) ? [...r.slice(1), r[0]] : r;
}
