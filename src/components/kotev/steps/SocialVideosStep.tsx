import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { playFail, playSuccess } from "../games/driveSounds";
import { NavButton } from "./QuizStep";
import { LawTitle, NextStepButton } from "./StepParts";

/*
 * "בכביש החברתי" step made of a few short videos: each video plays in the stage, and when it
 * ends the stage turns into a short activity about it (a choice question, or putting steps in
 * order). Buttons under the stage move to the next question or video, as in the quiz step.
 * Layout follows StageStep: the law's title and the part's instruction on the right, the stage
 * and the next-step button on the left. On a phone the activity grows the stage to its own height.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 */

export type SocialActivity =
  | {
      kind: "choice";
      question: string;
      /** Each answer can open with an emoji, shown large, or a picture: picture answers show as
       *  cards side by side, the picture above the text. */
      answers: { text: string; icon?: string; image?: string; /** CSS object-position, so a tall card keeps the picture's subject in view. */ imageFocus?: string }[];
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
  const [solved, setSolved] = useState<Set<number>>(() => new Set());
  // Activities answered, as "part-activity", so going back shows them already solved.
  const [doneActs, setDoneActs] = useState<Set<string>>(() => new Set());
  const [view, setView] = useState<"video" | "activity">("video");
  const [activity, setActivity] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoplay = useRef(false);

  const p = parts[part];
  const answered = doneActs.has(`${part}-${activity}`);

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
    setView("video");
  };

  const lastActivity = activity === p.activities.length - 1;
  const finishActivity = () => {
    setDoneActs((d) => new Set(d).add(`${part}-${activity}`));
    if (!lastActivity) return;
    if (!solved.has(part)) {
      setSolved((s) => new Set(s).add(part));
      onSolve?.(part);
    }
  };

  const partDone = solved.has(part) && lastActivity;
  const lastPart = part === parts.length - 1;
  const goActivity = (i: number) => {
    setActivity(i);
    setView("activity");
  };

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

        <div
          className={cn(
            "relative order-4 w-full motion-safe:animate-fade-in-scale lg:aspect-video",
            // The video sits in a rounded stage; the questions sit straight on the page.
            view === "video" && "aspect-video overflow-hidden rounded-[32px] bg-stage md:rounded-[48px] lg:rounded-[calc(var(--u)*3.125)]",
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
            <div className="flex h-full flex-col py-2 lg:absolute lg:inset-0 lg:py-[calc(var(--u)*0.5)]">
              <ActivityView
                key={`${part}-${activity}`}
                activity={p.activities[activity]}
                onSolved={finishActivity}
                done={answered}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 lg:mt-auto lg:pt-[calc(var(--u)*0.833)]">
                {partDone && lastPart && (
                  <p className="text-[15px] font-bold text-primary md:text-[18px] lg:text-[calc(var(--u)*1.042)]">כל הכבוד! סיימת את כל הסרטונים 🎉</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom buttons, as in the quiz: "לשאלה הבאה" moves from the video to its questions and
            between them, "לסרטון הבא" opens the next video, and the last question of the last video
            ends the step with the wide "התקדם לשלב הבא" button. */}
        {lastPart && view === "activity" && lastActivity ? (
          <NextStepButton
            step={step}
            totalSteps={totalSteps}
            onNext={onNext}
            disabled={!partDone}
            className="order-5 lg:mt-[calc(var(--u)*1.042)]"
          />
        ) : (
          <div className="order-5 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between md:gap-[14px] lg:mt-[calc(var(--u)*1.042)] lg:gap-[calc(var(--u)*0.729)]">
            {view === "activity" && activity > 0 && (
              <NavButton tone="back" onClick={() => goActivity(activity - 1)} className="md:max-w-none md:flex-1 lg:w-auto">
                לשאלה הקודמת
              </NavButton>
            )}
            {/* From the first question, back goes to the video it is about. */}
            {view === "activity" && activity === 0 && (
              <NavButton tone="back" onClick={() => goPart(part)} className="md:max-w-none md:flex-1 lg:w-auto">
                לסרטון הקודם
              </NavButton>
            )}
            {view === "video" && part > 0 && (
              <NavButton tone="back" onClick={() => goPart(part - 1)} className="md:max-w-none md:flex-1 lg:w-auto">
                לסרטון הקודם
              </NavButton>
            )}
            {view === "video" ? (
              <NavButton tone="next" onClick={() => goActivity(0)} className="md:ms-auto md:max-w-none md:flex-1 lg:w-auto">
                לשאלה הבאה
              </NavButton>
            ) : lastActivity ? (
              <NavButton tone="next" onClick={() => goPart(part + 1, true)} disabled={!partDone} className="md:ms-auto md:max-w-none md:flex-1 lg:w-auto">
                לסרטון הבא
              </NavButton>
            ) : (
              <NavButton tone="next" onClick={() => goActivity(activity + 1)} disabled={!answered} className="md:ms-auto md:max-w-none md:flex-1 lg:w-auto">
                לשאלה הבאה
              </NavButton>
            )}
          </div>
        )}
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

// In vw: 18px on a 390px phone, 22px at 768, 28px at 1920.
const QUESTION = "text-right text-[4.6vw] font-bold leading-snug md:text-[2.865vw] lg:text-[1.458vw]";
const EXPLAIN =
  "mt-3 rounded-[16px] bg-card px-4 shadow-[0_4px_14px_hsl(var(--mist)/0.4)] py-2 text-right text-[15px] leading-snug motion-safe:animate-fade-up md:text-[17px] lg:mt-[calc(var(--u)*0.833)] lg:rounded-[calc(var(--u)*0.833)] lg:px-[calc(var(--u)*1.042)] lg:py-[calc(var(--u)*0.521)] lg:text-[calc(var(--u)*0.99)]";

function ChoiceActivity({ activity, onSolved, done }: { activity: Extract<SocialActivity, { kind: "choice" }>; onSolved: () => void; done: boolean }) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [right, setRight] = useState(done);
  const icons = activity.answers.some((a) => a.icon);
  const pictures = activity.answers.some((a) => a.image);

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
    // On desktop, picture answers stretch to fill the height the stage leaves them.
    <div className={cn("motion-safe:animate-fade-up", pictures && "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col")}>
      <p className={QUESTION}>{activity.question}</p>
      <div
        role="radiogroup"
        aria-label="בחר תשובה"
        className={cn(
          "mt-3 flex gap-2 lg:mt-[calc(var(--u)*0.833)] lg:gap-[calc(var(--u)*0.625)]",
          pictures ? "grid grid-cols-1 sm:grid-cols-3 lg:min-h-0 lg:flex-1" : icons ? "flex-row" : "flex-col",
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
                "flex items-center gap-3 rounded-[18px] bg-card px-3 shadow-[0_4px_14px_hsl(var(--mist)/0.4)] py-2 text-right text-[15px] leading-snug transition-[transform,box-shadow,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-[17px] lg:gap-[calc(var(--u)*0.729)] lg:rounded-[calc(var(--u)*1.042)] lg:px-[calc(var(--u)*0.833)] lg:py-[calc(var(--u)*0.521)] lg:text-[calc(var(--u)*0.99)]",
                icons && "flex-1 flex-col justify-center gap-1 text-center lg:gap-[calc(var(--u)*0.26)]",
                pictures && "relative flex-col items-stretch gap-2 p-2 lg:gap-[calc(var(--u)*0.417)] lg:p-[calc(var(--u)*0.417)]",
                !right && !isWrong && "hover:-translate-y-0.5 hover:shadow-[0_6px_16px_hsl(var(--mist)/0.45)]",
                isWrong && "opacity-55 motion-safe:animate-shake",
                right && !isRight && "opacity-55",
                isRight && "shadow-[0_0_0_2px_hsl(var(--primary)/0.45)]",
              )}
            >
              {a.image && (
                <img
                  src={a.image}
                  alt=""
                  style={a.imageFocus ? { objectPosition: a.imageFocus } : undefined}
                  draggable={false}
                  className="aspect-[4/3] w-full rounded-[12px] object-cover lg:aspect-auto lg:min-h-0 lg:flex-1 lg:rounded-[calc(var(--u)*0.729)]"
                />
              )}
              {/* With a picture, the mark sits on the picture's corner and the text under it. */}
              <span className={cn("flex items-center gap-3 lg:gap-[calc(var(--u)*0.729)]", !pictures && "contents")}>
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full bg-answer lg:size-[calc(var(--u)*1.875)]",
                    pictures && "absolute right-4 top-4 bg-card shadow-md lg:right-[calc(var(--u)*0.833)] lg:top-[calc(var(--u)*0.833)]",
                  )}
                >
                  {isRight && <Check aria-hidden="true" strokeWidth={3} className="size-4 text-primary lg:size-[calc(var(--u)*1.042)]" />}
                  {isWrong && <X aria-hidden="true" strokeWidth={3} className="size-4 text-alert lg:size-[calc(var(--u)*1.042)]" />}
                </span>
              {a.icon && (
                <span aria-hidden="true" className="text-[26px] leading-none md:text-[34px] lg:text-[calc(var(--u)*2.1)]">
                  {a.icon}
                </span>
              )}
                <span className={cn(pictures && "w-full text-center")}>{a.text}</span>
              </span>
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
                "flex items-center gap-3 rounded-[18px] bg-card px-3 shadow-[0_4px_14px_hsl(var(--mist)/0.4)] py-2 text-right text-[15px] leading-snug transition-[transform,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-[17px] lg:gap-[calc(var(--u)*0.625)] lg:rounded-[calc(var(--u)*1.042)] lg:px-[calc(var(--u)*0.833)] lg:py-[calc(var(--u)*0.469)] lg:text-[calc(var(--u)*0.99)]",
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

function shuffle(a: number[]) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  // Never start already in order.
  return r.every((v, i) => v === i) ? [...r.slice(1), r[0]] : r;
}
