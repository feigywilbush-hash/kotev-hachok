import { useEffect, useRef, useState, type ReactNode } from "react";

import { burstConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import { playFail, playSuccess } from "../games/driveSounds";
import { NavButton } from "./QuizStep";
import { LawTitle, NextStepButton } from "./StepParts";

/*
 * "משחק ותרגול" step of the hierarchy law: a fixed four-floor pyramid on one side and a row of
 * picture cards on the other. The player drags each card (or taps it, then taps a floor) onto the
 * pyramid; whoever has more authority must sit higher. A card shrinks to fit its floor. When every
 * card is in place: confetti and a success sound. The green "next" button walks through the rounds
 * inside this step: it empties the pyramid and brings in the next round's cards. The last round has the
 * wide yellow "התקדם לשלב הבא" button instead, which moves on to the next step.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 * Mobile stacks: title → instruction → cards → pyramid → button.
 */

export type PyramidCard = {
  id: string;
  image: { src: string; alt: string };
  /** 0 is the most authority; a card must sit above every card with a larger rank. */
  rank: number;
};

export type PyramidRound = {
  cards: PyramidCard[];
  /** Shown when a card is put below someone it should be above (or the other way round). */
  hint: string;
  /** Shown when the round is solved. */
  praise: string;
};

type PyramidStepProps = {
  lawNumber: number;
  title: string;
  instruction: ReactNode;
  rounds: PyramidRound[];
  /** Lesson step shown on the last round's "next step" button. */
  step: number;
  totalSteps: number;
  onNext?: () => void;
  /** Called with the round's index each time a round is solved. */
  onSolve?: (round: number) => void;
};

// Pyramid geometry: the 700×748 Figma frame, stretched 1.2× wider.
const VW = 840;
const VH = 748;
const CX = 420;
/*
 * The blue frame is the triangle (420,59.9) (790.5,694) (49.5,694) drawn with a 16-wide stroke, so
 * its inner edge sits 8 inside those lines (14 inside the outline (420,48) (801,700) (39,700)).
 * The floors fill that outline shrunk by 26 on every side (a 12-wide white margin all round), cut
 * into four equal floors with 12-wide white gaps.
 */
const FLOORS_TOP = 99.5;
const FLOORS_BOTTOM = 674;
const halfWidth = (y: number) => (y - FLOORS_TOP) * 0.5843;
/** The floors, top to bottom (all the same height), and the size of a card sitting on each. */
const FLOORS = [
  { top: FLOORS_TOP, bottom: 234.1, card: 72 },
  { top: 246.1, bottom: 380.7, card: 120 },
  { top: 392.7, bottom: 527.3, card: 124 },
  { top: 539.3, bottom: FLOORS_BOTTOM, card: 124 },
];

const floorPoints = ({ top, bottom }: { top: number; bottom: number }) =>
  [
    [CX - halfWidth(top), top],
    [CX + halfWidth(top), top],
    [CX + halfWidth(bottom), bottom],
    [CX - halfWidth(bottom), bottom],
  ]
    .map((p) => p.join(","))
    .join(" ");

type Drag = { id: string; x0: number; y0: number; dx: number; dy: number; moved: boolean };

export function PyramidStep({ lawNumber, title, instruction, rounds, step, totalSteps, onNext, onSolve }: PyramidStepProps) {
  const [round, setRound] = useState(0);
  /** Card id → floor index, for the cards on the pyramid. */
  const [placed, setPlaced] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [hint, setHint] = useState<{ id: number; text: string } | null>(null);
  const [shaking, setShaking] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const pyramidRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const current = rounds[round];
  const cards = current.cards;
  /** A four-card round shrinks its cards so they still fit one row. */
  const fourCards = cards.length > 3;

  /** The floor under a viewport point, or null when it is off the pyramid. */
  const floorAt = (x: number, y: number) => {
    const r = pyramidRef.current?.getBoundingClientRect();
    if (!r) return null;
    const fx = ((x - r.left) / r.width) * VW;
    const fy = ((y - r.top) / r.height) * VH;
    const i = FLOORS.findIndex((f) => fy >= f.top - 8 && fy <= f.bottom + 8);
    if (i < 0) return null;
    return Math.abs(fx - CX) <= halfWidth(FLOORS[i].bottom) + 30 ? i : null;
  };

  const place = (id: string, floor: number) => {
    const card = cards.find((c) => c.id === id)!;
    // Whoever is already on another floor must stay in the right order with this card.
    const clash = cards.some((o) => {
      const f = placed[o.id];
      if (o.id === id || f === undefined || f === floor) return false;
      return (card.rank < o.rank && floor > f) || (card.rank > o.rank && floor < f);
    });
    setSelected(null);
    if (clash) {
      playFail();
      setShaking(id);
      setHint({ id: Date.now(), text: current.hint });
      setPlaced((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
      return;
    }
    const next = Object.fromEntries(Object.entries(placed).filter(([k, f]) => k !== id && f !== floor));
    next[id] = floor;
    setPlaced(next);
    setHint(null);
    if (cards.every((c) => next[c.id] !== undefined)) {
      setSolved(true);
      playSuccess();
      const r = pyramidRef.current?.getBoundingClientRect();
      if (r) burstConfetti({ x: r.left + r.width / 2, y: r.top + r.height * 0.4 });
      onSolve?.(round);
    }
  };

  const unplace = (id: string) =>
    setPlaced((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });

  /** Empties the pyramid and brings in round `to`'s cards. */
  const goRound = (to: number) => {
    setPlaced({});
    setSolved(false);
    setSelected(null);
    setHint(null);
    setRound(to);
  };
  const nextRound = () => goRound(round + 1);

  // Escape closes the hint popup
  useEffect(() => {
    if (!hint) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setHint(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hint]);

  useEffect(() => {
    if (!shaking) return;
    const t = window.setTimeout(() => setShaking(null), 450);
    return () => window.clearTimeout(t);
  }, [shaking]);

  // The drag listeners live across renders, so they reach the latest state through this ref.
  const actions = useRef({ place, unplace, floorAt });
  actions.current = { place, unplace, floorAt };

  // Dragging: follow the pointer anywhere on the page, drop on release.
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
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!d) return;
      if (!d.moved) {
        // A tap: pick the card, then tap a floor to put it there.
        setSelected((s) => (s === d.id ? null : d.id));
        return;
      }
      const { place, unplace, floorAt } = actions.current;
      const floor = floorAt(e.clientX, e.clientY);
      if (floor === null) unplace(d.id);
      else place(d.id, floor);
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

  const cardBody = (card: PyramidCard, inPyramid: boolean) => {
    const dragging = drag?.id === card.id && drag.moved;
    return (
      <button
        key={card.id}
        type="button"
        aria-label={card.image.alt}
        aria-pressed={selected === card.id}
        onPointerDown={(e) => startDrag(card.id, e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setSelected((s) => (s === card.id ? null : card.id));
          }
        }}
        style={dragging ? { transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.04)` } : undefined}
        className={cn(
          "block size-full touch-none overflow-hidden rounded-[16px] shadow-[0_6px_16px_hsl(var(--mist)/0.45)] transition-[box-shadow,scale] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:rounded-[calc(var(--u)*1.25)]",
          inPyramid ? "cursor-grab" : "cursor-grab hover:scale-[1.03]",
          dragging && "relative z-30 cursor-grabbing shadow-[0_14px_32px_hsl(var(--mist)/0.8)]",
          selected === card.id && "ring-4 ring-brand-sun",
          shaking === card.id && "motion-safe:animate-shake",
        )}
      >
        <img src={card.image.src} alt="" draggable={false} className="size-full rounded-[12px] object-cover lg:rounded-[calc(var(--u)*1.04)]" />
      </button>
    );
  };

  const tray = cards.filter((c) => placed[c.id] === undefined);

  return (
    <div className="flex flex-col gap-6 px-4 pb-10 pt-6 md:gap-8 md:px-8 md:pt-10 lg:flex-row lg:items-start lg:justify-center lg:gap-[calc(var(--u)*2.5)] lg:pb-[calc(var(--u)*1.5)] lg:pl-[calc(var(--u)*4.375)] lg:pr-[calc(var(--u)*3.594)] lg:pt-[calc(var(--u)*2.03)]">
      {/* Text column: on mobile its children join the outer column so the pyramid can sit between them. */}
      <div className="contents lg:order-2 lg:flex lg:w-[calc(var(--u)*41.72)] lg:min-w-0 lg:shrink lg:flex-col lg:self-stretch lg:items-end">
        <LawTitle lawNumber={lawNumber} title={title} className="order-1 lg:self-stretch" />
        <p className="order-2 text-right text-[17px] leading-normal motion-safe:animate-fade-up motion-safe:[animation-delay:120ms] md:text-[20px] lg:-mt-[calc(var(--u)*0.6)] lg:self-stretch lg:text-[calc(var(--u)*1.25)]">
          {instruction}
        </p>

        {/* The cards still waiting to be placed */}
        <div
          key={round}
          className={cn(
            "relative order-3 flex min-h-[120px] flex-wrap justify-start gap-3 motion-safe:animate-fade-up md:min-h-[150px] lg:mb-[calc(var(--u)*1.6)] lg:mt-[calc(var(--u)*2.4)] lg:min-h-[calc(var(--u)*12.6)] lg:w-full lg:gap-[calc(var(--u)*1.04)]",
            fourCards && "lg:gap-[calc(var(--u)*0.78)]",
            // Lift the tray over the pyramid while one of its cards is dragged
            drag && tray.some((c) => c.id === drag.id) && "z-40",
          )}
        >
          {tray.map((card) => (
            <div
              key={card.id}
              className={cn(
                fourCards
                  ? "aspect-square w-[calc((100%-2.25rem)/4)] md:size-[150px] lg:size-auto lg:w-[min(calc(var(--u)*9.84),calc((100%-var(--u)*2.34)/4))]"
                  : "size-[120px] md:size-[150px] lg:aspect-square lg:size-auto lg:w-[min(calc(var(--u)*12.7),calc((100%-var(--u)*2.08)/3))]",
                drag?.id === card.id && "relative z-30",
              )}
            >
              {cardBody(card, false)}
            </div>
          ))}
          {solved && (
            <p
              role="status"
              className="flex items-center gap-2 self-start text-[18px] font-bold text-primary motion-safe:animate-fade-up md:text-[22px] lg:gap-[calc(var(--u)*0.52)] lg:text-[calc(var(--u)*1.46)]"
            >
              <span aria-hidden="true">🎉</span>
              {current.praise}
            </p>
          )}
        </div>

        {/* A wrong placement opens a popup with the round's hint */}
        {hint && (
          <div
            key={hint.id}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 duration-300 motion-safe:animate-in motion-safe:fade-in-0"
            onClick={() => setHint(null)}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="pyramid-hint"
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-[420px] flex-col items-center gap-4 rounded-[24px] bg-card px-6 py-7 text-center shadow-[0_12px_32px_hsl(var(--mist)/0.6)] motion-safe:animate-fade-in-scale md:max-w-[480px] md:gap-5 md:px-8 md:py-9 lg:max-w-[calc(var(--u)*26)] lg:gap-[calc(var(--u)*1.25)] lg:rounded-[calc(var(--u)*1.67)] lg:px-[calc(var(--u)*2.08)] lg:py-[calc(var(--u)*2.08)]"
            >
              <span aria-hidden="true" className="text-[44px] leading-none md:text-[52px] lg:text-[calc(var(--u)*3)]">🤔</span>
              <p id="pyramid-hint" className="text-[18px] font-bold leading-normal text-alert md:text-[22px] lg:text-[calc(var(--u)*1.35)]">
                {hint.text}
              </p>
              <button
                type="button"
                autoFocus
                onClick={() => setHint(null)}
                className="rounded-full bg-brand-sun px-8 py-3 text-[18px] transition-[filter,transform] duration-200 hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] md:text-[20px] lg:px-[calc(var(--u)*2.08)] lg:py-[calc(var(--u)*0.73)] lg:text-[calc(var(--u)*1.15)]"
              >
                הבנתי, ננסה שוב
              </button>
            </div>
          </div>
        )}

        {round === rounds.length - 1 ? (
          // The last round ends the step: one wide "next step" button, as on the other steps.
          <NextStepButton step={step} totalSteps={totalSteps} onNext={onNext} className="order-5 lg:mt-auto" />
        ) : (
        <div className="order-5 flex flex-col-reverse gap-3 self-stretch md:flex-row md:gap-[14px] lg:mt-auto lg:gap-[calc(var(--u)*0.729)]">
          {round > 0 && (
            <NavButton tone="back" onClick={() => goRound(round - 1)} className="md:max-w-none md:flex-1 lg:w-auto">
              לשאלה הקודמת
            </NavButton>
          )}
          <NavButton tone="next" onClick={nextRound} className="md:max-w-none md:flex-1 lg:w-auto">
            לשאלה הבאה
          </NavButton>
        </div>
        )}
      </div>

      {/* The pyramid */}
      <div
        ref={pyramidRef}
        className="relative order-4 mx-auto aspect-[840/748] w-full max-w-[500px] motion-safe:animate-fade-in-scale motion-safe:[animation-delay:80ms] md:max-w-[620px] lg:order-1 lg:mx-0 lg:w-[calc(var(--u)*43.75)] lg:min-w-0 lg:max-w-none lg:shrink"
      >
        <svg viewBox={`0 0 ${VW} ${VH}`} className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <linearGradient id="pyramid-floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#eff0f0" />
              <stop offset="1" stopColor="#f0f7f9" />
            </linearGradient>
          </defs>
          {/* A thick round-joined stroke gives the frame its rounded corners */}
          <polygon points="420,59.9 790.5,694 49.5,694" fill="#ffffff" className="stroke-progress-track" strokeWidth={16} strokeLinejoin="round" />
          {FLOORS.map((f, i) => (
            <polygon
              key={i}
              points={floorPoints(f)}
              fill="url(#pyramid-floor)"
              className={cn("transition-[filter] duration-200", selected && "cursor-pointer hover:brightness-95")}
            />
          ))}
        </svg>

        {/* Tap targets for placing a picked card */}
        {selected &&
          FLOORS.map((f, i) => (
            <button
              key={i}
              type="button"
              aria-label={`קומה ${i + 1} בפירמידה`}
              onClick={() => place(selected, i)}
              className="absolute left-[12%] right-[12%] rounded-[12px] ring-brand-sun/70 hover:ring-4 focus-visible:outline-none focus-visible:ring-4"
              style={{ top: `${(f.top / VH) * 100}%`, height: `${((f.bottom - f.top) / VH) * 100}%` }}
            />
          ))}

        {/* Cards on the pyramid, a little smaller so they fit their floor */}
        {cards.map((card) => {
          const i = placed[card.id];
          if (i === undefined) return null;
          const f = FLOORS[i];
          return (
            <div
              key={card.id}
              className={cn("absolute motion-safe:animate-fade-in-scale", drag?.id === card.id && "z-30")}
              style={{
                left: `${((CX - f.card / 2) / VW) * 100}%`,
                top: `${((f.bottom - 8 - f.card) / VH) * 100}%`,
                width: `${(f.card / VW) * 100}%`,
                aspectRatio: "1",
              }}
            >
              {cardBody(card, true)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
