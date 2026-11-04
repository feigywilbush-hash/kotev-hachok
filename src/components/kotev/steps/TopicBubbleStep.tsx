import { useEffect, useRef, useState, type ReactNode } from "react";

import { burstConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import { playFail, playSuccess } from "../games/driveSounds";
import { NavButton } from "./QuizStep";
import { LawTitle, NextStepButton } from "./StepParts";

/*
 * "משחק ותרגול" step of the joining-a-group law (Figma "משחק ותרגול חוק 3/4/5"): two friends talk on a
 * bench and their speech bubble shows the topic. A third boy wants to join; his bubble is empty. The
 * player drags one of the three picture cards into his bubble (or taps a card): the right one belongs to
 * the friends' topic. A right pick stays in his bubble with confetti and a success sound; a wrong one
 * shakes, goes back and shows a hint. The green "next" button moves to the next round (a new topic);
 * the last round has the yellow "התקדם לשלב הבא" button instead.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 * Mobile stacks: title → instruction → scene → cards → buttons.
 */

type Picture = { src: string; alt: string };

export type TopicOption = { id: string; image: Picture };

export type TopicRound = {
  /** What the friends talk about: shown in their speech bubble. */
  topic: Picture;
  /** Three pictures; `correct` is the id of the one that fits the topic. */
  options: TopicOption[];
  correct: string;
  /** Shown when a picture that doesn't fit is dropped. */
  hint: string;
  /** Shown when the round is solved. */
  praise: string;
};

type TopicBubbleStepProps = {
  lawNumber: number;
  title: string;
  instruction: ReactNode;
  /** The bench scene (its friends' bubble is drawn in the picture) and the joining boy's empty bubble. */
  scene: Picture;
  bubble: string;
  rounds: TopicRound[];
  step: number;
  totalSteps: number;
  onNext?: () => void;
  onSolve?: (round: number) => void;
};

/*
 * Places on the 682×545 scene from the Figma frame, in percent: the topic picture inside the friends'
 * bubble, the boy's empty bubble, and the dropped picture inside that bubble's oval.
 */
const TOPIC_BOX = { left: 22.14, top: 8.26, width: 18.77, height: 16.88 };
const BUBBLE_BOX = { left: 53.81, top: 2.94, width: 26.83, height: 25.32 };
const ANSWER_BOX = { left: 57.6, top: 5.3, width: 19.4, height: 15.6 };

type Drag = { id: string; x0: number; y0: number; dx: number; dy: number; moved: boolean };

const pct = (b: { left: number; top: number; width: number; height: number }) => ({
  left: `${b.left}%`,
  top: `${b.top}%`,
  width: `${b.width}%`,
  height: `${b.height}%`,
});

export function TopicBubbleStep({ lawNumber, title, instruction, scene, bubble, rounds, step, totalSteps, onNext, onSolve }: TopicBubbleStepProps) {
  const [round, setRound] = useState(0);
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [shaking, setShaking] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const current = rounds[round];
  const last = round === rounds.length - 1;

  /** True when a viewport point is on the scene (the whole picture counts, so small hands still hit it). */
  const onScene = (x: number, y: number) => {
    const r = sceneRef.current?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  const choose = (id: string) => {
    if (solved) return;
    if (id === current.correct) {
      setSolved(true);
      setHint(null);
      playSuccess();
      const r = bubbleRef.current?.getBoundingClientRect();
      if (r) burstConfetti({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      onSolve?.(round);
    } else {
      playFail();
      setShaking(id);
      setHint(current.hint);
    }
  };

  const goRound = (to: number) => {
    setSolved(false);
    setHint(null);
    setShaking(null);
    setRound(to);
  };

  useEffect(() => {
    if (!shaking) return;
    const t = window.setTimeout(() => setShaking(null), 450);
    return () => window.clearTimeout(t);
  }, [shaking]);

  // The drag listeners live across renders, so they reach the latest state through this ref.
  const actions = useRef({ choose, onScene });
  actions.current = { choose, onScene };

  const dragging = drag !== null;
  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.x0;
      const dy = e.clientY - d.y0;
      const next = { ...d, dx, dy, moved: d.moved || Math.hypot(dx, dy) > 6 };
      dragRef.current = next;
      setDrag(next);
      setOver(next.moved && actions.current.onScene(e.clientX, e.clientY));
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      setOver(false);
      if (!d) return;
      // A tap picks the card too; a drag counts only when it lands on the scene.
      if (!d.moved || actions.current.onScene(e.clientX, e.clientY)) actions.current.choose(d.id);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging]);

  const startDrag = (id: string, e: React.PointerEvent) => {
    if (solved) return;
    e.preventDefault();
    const d = { id, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, moved: false };
    dragRef.current = d;
    setDrag(d);
  };

  const answer = current.options.find((o) => o.id === current.correct)!;

  return (
    <div className="flex flex-col gap-6 px-4 pb-10 pt-6 md:gap-8 md:px-8 md:pt-10 lg:flex-row lg:justify-between lg:gap-[calc(var(--u)*2.6)] lg:pb-[calc(var(--u)*1.5)] lg:pl-[calc(var(--u)*1.979)] lg:pr-[calc(var(--u)*3.75)] lg:pt-[calc(var(--u)*2.9)]">
      {/* Text column (right on desktop): the law's title on top, the game's explanation and feedback below */}
      <div className="contents lg:flex lg:min-w-0 lg:max-w-[calc(var(--u)*29.8)] lg:flex-1 lg:flex-col">
        <LawTitle lawNumber={lawNumber} title={title} className="order-1" />
        <div className="order-2 flex flex-col gap-3 text-right lg:mt-auto lg:gap-[calc(var(--u)*1)] lg:pb-[calc(var(--u)*0.4)]">
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

      {/* Game column (left on desktop): the scene, the picture cards beside it, and the buttons under them */}
      <div className="contents lg:flex lg:w-[calc(var(--u)*47.9)] lg:shrink-0 lg:flex-col lg:gap-[calc(var(--u)*3.4)]">
        <div className="contents lg:flex lg:items-stretch lg:gap-[calc(var(--u)*1.98)]">
          {/* The picture cards: a row on mobile, a column beside the scene on desktop */}
          <div
            key={`cards-${round}`}
            // Lift the cards over the scene while one of them is dragged onto it
            className={cn("relative order-4 grid grid-cols-3 gap-3 motion-safe:animate-fade-up md:gap-4 lg:order-none lg:flex lg:w-[calc(var(--u)*9.43)] lg:shrink-0 lg:flex-col lg:justify-between lg:gap-0", drag && "z-40")}
          >
            {current.options.map((o) => {
              const used = solved && o.id === current.correct;
              const isDragged = drag?.id === o.id && drag.moved;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-label={o.image.alt}
                  disabled={solved}
                  onPointerDown={(e) => startDrag(o.id, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      choose(o.id);
                    }
                  }}
                  style={isDragged ? { transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.05)` } : undefined}
                  className={cn(
                    "relative flex aspect-[181/170] touch-none items-center justify-center rounded-[22px] bg-card p-2 shadow-[4px_8px_50px_rgba(186,160,160,0.08),0_4px_14px_hsl(var(--mist)/0.35)] transition-[box-shadow,scale,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:rounded-[28px] lg:aspect-auto lg:h-[calc(var(--u)*8.85)] lg:rounded-[calc(var(--u)*1.5625)] lg:p-[calc(var(--u)*0.45)]",
                    solved ? "cursor-default" : "cursor-grab hover:scale-[1.03]",
                    isDragged && "z-30 cursor-grabbing shadow-[0_14px_32px_hsl(var(--mist)/0.8)]",
                    used && "opacity-30",
                    shaking === o.id && "motion-safe:animate-shake",
                  )}
                >
                  <img src={o.image.src} alt="" draggable={false} className="max-h-full max-w-full object-contain" />
                </button>
              );
            })}
          </div>

          {/* The scene */}
          <div
            ref={sceneRef}
            className={cn(
              "relative order-3 aspect-[682/545] w-full overflow-hidden rounded-[32px] motion-safe:animate-fade-in-scale md:rounded-[48px] lg:order-none lg:w-[calc(var(--u)*35.52)] lg:shrink-0 lg:rounded-[calc(var(--u)*3.125)]",
              over && "ring-4 ring-brand-sun",
            )}
          >
            <img src={scene.src} alt={scene.alt} draggable={false} className="absolute inset-0 size-full object-cover" />
            <img
              key={`topic-${round}`}
              src={current.topic.src}
              alt={current.topic.alt}
              draggable={false}
              className="absolute object-contain motion-safe:animate-fade-in-scale"
              style={pct(TOPIC_BOX)}
            />
            <div ref={bubbleRef} className="pointer-events-none absolute" style={pct(BUBBLE_BOX)}>
              <img src={bubble} alt="" draggable={false} className={cn("size-full object-fill transition-transform duration-200", over && "scale-105")} />
            </div>
            {solved && (
              <img
                src={answer.image.src}
                alt={answer.image.alt}
                draggable={false}
                className="absolute object-contain motion-safe:animate-fade-in-scale"
                style={pct(ANSWER_BOX)}
              />
            )}
          </div>
        </div>

        {/* Buttons: back on the right, next (or the yellow next-step button) on the left */}
        <div className="order-5 flex flex-col-reverse gap-3 md:flex-row md:gap-[14px] lg:gap-[calc(var(--u)*0.729)]">
          {round > 0 && (
            <NavButton tone="back" onClick={() => goRound(round - 1)} className="md:max-w-none md:flex-1 lg:w-auto">
              לשאלה הקודמת
            </NavButton>
          )}
          {last ? (
            <NextStepButton step={step} totalSteps={totalSteps} onNext={onNext} className="md:ms-auto md:w-[calc(50%-7px)] lg:w-[calc(50%-var(--u)*0.365)]" />
          ) : (
            <NavButton tone="next" onClick={() => goRound(round + 1)} className="md:ms-auto md:w-[calc(50%-7px)] md:max-w-none lg:w-[calc(50%-var(--u)*0.365)]">
              לשאלה הבאה
            </NavButton>
          )}
        </div>
      </div>
    </div>
  );
}
