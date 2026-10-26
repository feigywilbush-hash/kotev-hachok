import { useEffect, useRef, useState, type ReactNode } from "react";

import { burstConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import { playFail, playSuccess } from "../games/driveSounds";
import { NavButton } from "./QuizStep";
import { LawTitle } from "./StepParts";

/*
 * "משחק ותרגול" step of the hierarchy law: a fixed four-floor pyramid on one side and a row of
 * picture cards on the other. The player drags each card (or taps it, then taps a floor) onto the
 * pyramid; whoever has more authority must sit higher. A card shrinks to fit its floor. When every
 * card is in place: confetti and a success sound. The green "next" button walks through the rounds
 * inside this step: it empties the pyramid and brings in the next round's cards, and only after the last
 * round moves on to the next step.
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
  onNext?: () => void;
  /** Called with the round's index each time a round is solved. */
  onSolve?: (round: number) => void;
};

// Pyramid geometry: the 700×748 Figma frame, stretched 1.2× wider.
const VW = 840;
const VH = 748;
const CX = 420;
/*
 * The blue frame is the triangle (420,48) (801,700) (39,700) drawn with a 28-wide stroke, so its
 * inner edge sits 14 inside those lines. The floors fill the same triangle shrunk by 26 on every
 * side (a 12-wide white margin all round), cut into four equal floors with 12-wide white gaps.
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

export function PyramidStep({ lawNumber, title, instruction, rounds, onNext, onSolve }: PyramidStepProps) {
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

  /** The "next" button walks through the rounds; after the last one it moves on to the next step. */
  /** Empties the pyramid and brings in round `to`'s cards. */
  const goRound = (to: number) => {
    setPlaced({});
    setSolved(false);
    setSelected(null);
    setHint(null);
    setRound(to);
  };
  const nextRound = () => (round >= rounds.length - 1 ? onNext?.() : goRound(round + 1));

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
      <div className="contents lg:order-2 lg:flex lg:w-[calc(var(--u)*41.72)] lg:shrink-0 lg:flex-col lg:items-end">
        <LawTitle lawNumber={lawNumber} title={title} className="order-1 lg:self-stretch" />
        <p className="order-2 text-right text-[17px] leading-normal motion-safe:animate-fade-up motion-safe:[animation-delay:120ms] md:text-[20px] lg:-mt-[calc(var(--u)*0.6)] lg:self-stretch lg:text-[calc(var(--u)*1.25)]">
          {instruction}
        </p>

        {/* The cards still waiting to be placed */}
        <div
          key={round}
          className={cn(
            "relative order-3 flex min-h-[120px] flex-wrap justify-start gap-3 motion-safe:animate-fade-up md:min-h-[150px] lg:mt-[calc(var(--u)*2.4)] lg:min-h-[calc(var(--u)*12.6)] lg:w-full lg:gap-[calc(var(--u)*1.04)]",
            // Lift the tray over the pyramid while one of its cards is dragged
            drag && tray.some((c) => c.id === drag.id) && "z-40",
          )}
        >
          {tray.map((card) => (
            <div key={card.id} className={cn("size-[120px] md:size-[150px] lg:size-[calc(var(--u)*12.7)]", drag?.id === card.id && "relative z-30")}>
              {cardBody(card, false)}
            </div>
          ))}
          {solved && (
            <p
              role="status"
              className="self-center rounded-full bg-primary px-5 py-2 text-[16px] font-bold text-primary-foreground motion-safe:animate-fade-up md:text-[20px] lg:px-[calc(var(--u)*1.25)] lg:py-[calc(var(--u)*0.52)] lg:text-[calc(var(--u)*1.25)]"
            >
              {current.praise}
            </p>
          )}
        </div>

        <p aria-live="polite" className="order-3 -mt-3 min-h-[1.5em] text-right text-[15px] font-bold text-alert md:text-[18px] lg:mt-[calc(var(--u)*0.6)] lg:self-stretch lg:text-[calc(var(--u)*1.04)]">
          {hint && <span key={hint.id} className="motion-safe:animate-fade-up">{hint.text}</span>}
        </p>

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
      </div>

      {/* The pyramid */}
      <div
        ref={pyramidRef}
        className="relative order-4 mx-auto aspect-[840/748] w-full max-w-[500px] motion-safe:animate-fade-in-scale motion-safe:[animation-delay:80ms] md:max-w-[620px] lg:order-1 lg:mx-0 lg:w-[calc(var(--u)*43.75)] lg:max-w-none lg:shrink-0"
      >
        <svg viewBox={`0 0 ${VW} ${VH}`} className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <linearGradient id="pyramid-floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#eff0f0" />
              <stop offset="1" stopColor="#f0f7f9" />
            </linearGradient>
          </defs>
          {/* A thick round-joined stroke gives the frame its rounded corners */}
          <polygon points="420,48 801,700 39,700" fill="#ffffff" className="stroke-surface" strokeWidth={28} strokeLinejoin="round" />
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
