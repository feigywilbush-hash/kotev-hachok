import { useCallback, useEffect, useRef, useState } from "react";

import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { Panel, PanelButton } from "./NoEntryDriveGame";
import { playBlink, playChoice, playFail, playHorn, playSuccess, playWin, setDriveMuted, setEngine, startDriveMusic, stopDriveMusic } from "./driveSounds";

const MUTE_KEY = "kotev-drive-muted";

/*
 * Driving game for the "הצטרפות לקבוצה" law, seen from above: the player's car stands at the
 * side of the road while cars pass in the lane beside it. The player checks the road (busy?
 * fast?), signals, and pulls into the lane only when there is a safe gap. Pulling out too soon
 * ends in a near miss: the car behind brakes and honks and the player's car goes back to the
 * side, so there is never a crash. Four rounds, each with different traffic; the traffic loops,
 * so a missed gap always comes back.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 */

type Phase = "ready" | "parked" | "nosing" | "wrong" | "merging" | "joined" | "done";
type Reason = "nosignal" | "beside" | "fast" | "close";

type Spawn = { v: number; gap: number };
type Round = { name: string; cruise: number; script: Spawn[]; praise: string };

const repeat = (n: number, s: Spawn) => Array.from({ length: n }, () => s);

/** Speeds in m/s, gaps in seconds until the next car. */
const ROUNDS: Round[] = [
  { name: "כביש שקט", cruise: 6, script: [{ v: 6, gap: 5.5 }, { v: 6, gap: 7 }], praise: "כל הכבוד! בדקת, איתתת והצטרפת בזמן" },
  {
    name: "כביש עמוס ומהיר",
    cruise: 11,
    script: [...repeat(6, { v: 11, gap: 1.15 }), { v: 11, gap: 7.5 }],
    praise: "יפה! חיכית שהמכוניות המהירות יעברו",
  },
  {
    name: "פקק איטי",
    cruise: 4.5,
    script: [...repeat(5, { v: 4.5, gap: 1.8 }), { v: 4.5, gap: 8 }],
    praise: "מצוין! נתת זכות קדימה וחיכית שהכביש יתפנה",
  },
  {
    name: "כביש מעורב",
    cruise: 8,
    script: [...repeat(3, { v: 11, gap: 1.6 }), { v: 5, gap: 5.5 }, { v: 8, gap: 1.5 }, { v: 8, gap: 6.5 }],
    praise: "אלוף! בחרת בדיוק את הרגע הנכון",
  },
];

const HINTS: Record<Reason, { title: string; text: string }> = {
  nosignal: { title: "רגע!", text: "לפני שיוצאים לנתיב מאותתים, כדי שהנהגים ידעו שאתה רוצה להשתלב." },
  beside: { title: "כמעט תאונה!", text: "מכונית נסעה בדיוק לידך. חכה שתעבור ושהכביש יתפנה." },
  fast: { title: "כמעט תאונה!", text: "המכונית שמאחור נוסעת מהר ותגיע אליך תוך רגע. חכה שתעבור ושיהיה רווח גדול." },
  close: { title: "כמעט תאונה!", text: "המכונית שמאחור קרובה מדי. תן לה זכות קדימה, וצא כשהכביש מתפנה." },
};

// World, in meters. x grows in the driving direction (to the right); the player's car stands at x = 0.
const VIEW = 36; // meters across the canvas
const CAR_AT = 0.8; // where the player's car stands, as a share of the width
const LEFT = -VIEW * CAR_AT;
const RIGHT = VIEW * (1 - CAR_AT);
const L = 4.4; // car length
const CW = 1.95; // car width
const LANE = 3.4;
const SHOULDER = 2.9;
const SPAWN_X = LEFT - 6;
const SAFE_TIME = 2; // seconds the car behind must still be away from the player's car
const FAST = 9; // m/s from which a car counts as fast in the hint
const MERGE_TIME = 1.6;
const NOSE = 0.38; // how far into the lane the car gets on a too-early try

const COLORS = {
  grass: "#d6ebc6",
  tree: "#8cc77a",
  treeDark: "#6fae5e",
  walk: "#eceef0",
  walkLine: "#dfe3e6",
  road: "#6c7075",
  shoulder: "#80848a",
  line: "#f3f4f5",
  curbRed: "#e0574c",
  curbWhite: "#ffffff",
  me: "#f07a5f",
  glass: "#3c4a5c",
  head: "#fff5c8",
  tail: "#b8322a",
  tailOn: "#ff3b30",
  blink: "#ffab1f",
};
const PAINT = ["#4f86e8", "#ffffff", "#5cb87a", "#9b7ce0", "#3fb6c0", "#f2c94c", "#e8eef3"];

type Car = { id: number; x: number; v: number; target: number; color: string; braking: boolean };
type Sim = {
  time: number;
  round: number;
  cars: Car[];
  oncoming: { x: number; v: number; color: string }[];
  nextId: number;
  spawnIn: number;
  spawnIdx: number;
  oncomingIn: number;
  /** The player's car: x along the road, m from 0 (side of the road) to 1 (middle of the lane). */
  me: { x: number; v: number; m: number };
  signal: boolean;
  blinkClock: number;
  nose: number; // time into a too-early try
  mergeT: number;
  completed: number;
  mistakes: number;
  roundIn: number | null; // countdown to the next round after joining
  fade: number; // a short fade-in at the start of each round
  doneIn: number | null;
};

const freshSim = (): Sim => ({
  time: 0,
  round: 0,
  cars: [],
  oncoming: [],
  nextId: 1,
  spawnIn: 0,
  spawnIdx: 0,
  oncomingIn: 1,
  me: { x: 0, v: 0, m: 0 },
  signal: false,
  blinkClock: 0,
  nose: 0,
  mergeT: 0,
  completed: 0,
  mistakes: 0,
  roundIn: null,
  doneIn: null,
  fade: 0,
});

const seeded = (i: number, n: number) => {
  const v = Math.sin((i + 1) * 9301 + n * 49297) * 233280;
  return v - Math.floor(v);
};
const TREES = Array.from({ length: 16 }, (_, i) => ({ x: LEFT + (i % 8) * (VIEW / 8) + seeded(i, 1) * 3, top: i < 8, r: 1.3 + seeded(i, 2) * 0.8 }));

/** Is the lane beside the player's car safe to pull into right now? */
function check(sim: Sim): Reason | null {
  let behind: Car | null = null;
  for (const c of sim.cars) {
    if (Math.abs(c.x) < L + 1.5) return "beside";
    if (c.x < 0 && (!behind || c.x > behind.x)) behind = c;
  }
  if (!behind) return null;
  const d = -behind.x - L;
  if (d / Math.max(behind.v, 0.1) < SAFE_TIME) return behind.v >= FAST ? "fast" : "close";
  return null;
}

/** Cars in the lane, plus the player's car once it is far enough into the lane to block it. */
function traffic(sim: Sim, dt: number) {
  const r = ROUNDS[sim.round];
  sim.spawnIn -= dt;
  const last = sim.cars.reduce<Car | null>((a, c) => (!a || c.x < a.x ? c : a), null);
  if (sim.spawnIn <= 0 && (!last || last.x > SPAWN_X + L + 3)) {
    const s = r.script[sim.spawnIdx % r.script.length];
    sim.cars.push({ id: sim.nextId++, x: SPAWN_X, v: s.v, target: s.v, color: PAINT[sim.nextId % PAINT.length], braking: false });
    sim.spawnIn = s.gap;
    sim.spawnIdx += 1;
  }

  const meBlocks = sim.me.m > 0.22;
  sim.cars.sort((a, b) => b.x - a.x);
  sim.cars.forEach((c, i) => {
    let lead: { x: number; v: number } | null = i > 0 ? sim.cars[i - 1] : null;
    if (meBlocks && sim.me.x > c.x && (!lead || sim.me.x < lead.x)) lead = sim.me;
    let want = c.target;
    if (lead) {
      const gap = lead.x - c.x - L;
      const safe = 1.2 + c.v * 0.5;
      if (gap < safe) want = Math.min(want, Math.max(0, lead.v * (gap / safe) - (safe - gap) * 0.6));
    }
    const before = c.v;
    c.v += want > c.v ? Math.min(want - c.v, 3 * dt) : -Math.min(c.v - want, 12 * dt);
    c.x += c.v * dt;
    if (lead && c.x > lead.x - L - 0.6) {
      c.x = lead.x - L - 0.6;
      c.v = Math.min(c.v, lead.v);
    }
    c.braking = before - c.v > 2 * dt;
  });
  sim.cars = sim.cars.filter((c) => c.x < RIGHT + 8);

  // The other side of the road, just for life.
  sim.oncomingIn -= dt;
  if (sim.oncomingIn <= 0) {
    sim.oncoming.push({ x: RIGHT + 6, v: 7 + seeded(sim.nextId, 3) * 3, color: PAINT[(sim.nextId * 3) % PAINT.length] });
    sim.nextId += 1;
    sim.oncomingIn = 2.5 + seeded(sim.nextId, 4) * 4;
  }
  sim.oncoming.forEach((o) => (o.x -= o.v * dt));
  sim.oncoming = sim.oncoming.filter((o) => o.x > LEFT - 8);
}

/** A new round: fresh traffic, already flowing, and the player's car back at the side of the road. */
function startRound(sim: Sim, index: number) {
  sim.round = index;
  sim.cars = [];
  sim.spawnIn = 0;
  sim.spawnIdx = 0;
  sim.me = { x: 0, v: 0, m: 0 };
  sim.signal = false;
  sim.fade = 0.45;
  for (let t = 0; t < 9; t += 0.05) traffic(sim, 0.05);
}

export function MergeDriveGame({
  onComplete,
  onScore,
  className,
}: {
  onComplete?: () => void;
  /** Called with the round's index each time the player joins the traffic safely. */
  onScore?: (round: number) => void;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim>(null as unknown as Sim);
  if (!simRef.current) {
    simRef.current = freshSim();
    startRound(simRef.current, 0);
  }
  const phaseRef = useRef<Phase>("ready");
  const reasonRef = useRef<Reason>("close");
  const visibleRef = useRef(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;

  const [phase, setPhaseState] = useState<Phase>("ready");
  const [round, setRound] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [signal, setSignal] = useState(false);
  const [reason, setReason] = useState<Reason>("close");
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setDriveMuted(muted);
    try {
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* storage unavailable: the choice just isn't remembered */
    }
  }, [muted]);

  useEffect(() => () => stopDriveMusic(), []);

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const flash = useCallback((text: string) => setToast((t) => ({ id: (t?.id ?? 0) + 1, text })), []);

  const start = useCallback(() => {
    const sim = freshSim();
    startRound(sim, 0);
    simRef.current = sim;
    setRound(0);
    setCompleted(0);
    setMistakes(0);
    setSignal(false);
    startDriveMusic();
    setPhase("parked");
    flash(`סיבוב 1 מתוך ${ROUNDS.length}: ${ROUNDS[0].name}`);
  }, [flash, setPhase]);

  const signalOn = useCallback(() => {
    const sim = simRef.current;
    if (phaseRef.current !== "parked" || sim.signal) return;
    playChoice();
    sim.signal = true;
    sim.blinkClock = 0;
    setSignal(true);
  }, []);

  const pullOut = useCallback(() => {
    const sim = simRef.current;
    if (phaseRef.current !== "parked") return;
    playChoice();
    const why = sim.signal ? check(sim) : "nosignal";
    if (why) {
      sim.mistakes += 1;
      setMistakes(sim.mistakes);
      reasonRef.current = why;
      setReason(why);
      if (why === "nosignal") {
        playFail();
        setPhase("wrong");
      } else {
        sim.nose = 0;
        playHorn();
        setPhase("nosing");
      }
      return;
    }
    sim.mergeT = 0;
    setPhase("merging");
  }, [setPhase]);

  // Main loop: advance the simulation and draw.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;

    let W = 0;
    let H = 0;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([e]) => (visibleRef.current = e.isIntersecting));
    io.observe(wrap);


    const update = (dt: number) => {
      const sim = simRef.current;
      const phase = phaseRef.current;
      sim.time += dt;
      sim.fade = Math.max(0, sim.fade - dt);
      if (phase === "wrong" || phase === "done") return;

      if (sim.signal) {
        const before = Math.floor(sim.blinkClock * 3);
        sim.blinkClock += dt;
        const now = Math.floor(sim.blinkClock * 3);
        if (now !== before) playBlink(now % 2 === 0);
      }

      const me = sim.me;
      if (phase === "nosing") {
        sim.nose += dt;
        const t = sim.nose;
        me.m = t < 0.35 ? (t / 0.35) * NOSE : t < 0.75 ? NOSE : Math.max(0, NOSE * (1 - (t - 0.75) / 0.5));
        if (t > 1.35) {
          me.m = 0;
          playFail();
          setPhase("wrong");
        }
      } else if (phase === "merging" || phase === "joined") {
        const cruise = ROUNDS[sim.round].cruise;
        me.v += Math.min(cruise - me.v, (phase === "merging" ? 3.2 : 4) * dt);
        me.x += me.v * dt;
        if (phase === "merging") {
          sim.mergeT += dt;
          const t = Math.min(1, sim.mergeT / MERGE_TIME);
          me.m = t * t * (3 - 2 * t);
          if (t >= 1) {
            sim.signal = false;
            setSignal(false);
            sim.completed += 1;
            setCompleted(sim.completed);
            onScoreRef.current?.(sim.round);
            playSuccess();
            flash(ROUNDS[sim.round].praise);
            setPhase("joined");
            sim.roundIn = 2.2;
          }
        }
      }
      setEngine(phase === "merging" || phase === "joined" ? Math.min(1, me.v / 8) : 0.15);

      traffic(sim, dt);

      if (sim.roundIn !== null) {
        sim.roundIn -= dt;
        if (sim.roundIn <= 0) {
          sim.roundIn = null;
          if (sim.round + 1 < ROUNDS.length) {
            startRound(sim, sim.round + 1);
            setRound(sim.round);
            setPhase("parked");
            flash(`סיבוב ${sim.round + 1} מתוך ${ROUNDS.length}: ${ROUNDS[sim.round].name}`);
          } else {
            sim.doneIn = 0.1;
          }
        }
      }
      if (sim.doneIn !== null) {
        sim.doneIn -= dt;
        if (sim.doneIn <= 0) {
          sim.doneIn = null;
          stopDriveMusic();
          playWin();
          setPhase("done");
          onCompleteRef.current?.();
        }
      }
    };

    const draw = () => {
      const sim = simRef.current;
      // Phones: a little closer in, and the road higher up so the buttons don't cover it.
      const narrow = W < 640;
      const view = narrow ? 30 : VIEW;
      const k = W / view;
      const X = (x: number) => (x + view * CAR_AT) * k;
      // Across the road, top to bottom: grass, walk, oncoming lane, our lane, the side of the road, curb, walk, grass.
      const roadH = (LANE * 2 + SHOULDER) * k;
      const roadTop = Math.round(H * (narrow ? 0.4 : 0.5) - roadH / 2 - 0.2 * k);
      const laneOn = roadTop + LANE * k; // top edge of our lane
      const shoulderTop = laneOn + LANE * k;
      const roadBottom = shoulderTop + SHOULDER * k;
      const laneY = laneOn + (LANE * k) / 2;
      const sideY = shoulderTop + (SHOULDER * k) / 2 - 0.1 * k;
      const walk = 2.2 * k;

      ctx.fillStyle = COLORS.grass;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.walk;
      ctx.fillRect(0, roadTop - walk, W, walk);
      ctx.fillRect(0, roadBottom, W, walk);
      ctx.strokeStyle = COLORS.walkLine;
      ctx.lineWidth = 1;
      for (let x = Math.ceil(LEFT); x < RIGHT; x += 1.5) {
        ctx.beginPath();
        ctx.moveTo(X(x), roadTop - walk);
        ctx.lineTo(X(x), roadTop);
        ctx.moveTo(X(x), roadBottom);
        ctx.lineTo(X(x), roadBottom + walk);
        ctx.stroke();
      }

      ctx.fillStyle = COLORS.road;
      ctx.fillRect(0, roadTop, W, roadBottom - roadTop);
      ctx.fillStyle = COLORS.shoulder;
      ctx.fillRect(0, shoulderTop, W, roadBottom - shoulderTop);
      // Dashed middle line, solid edge line between our lane and the side of the road.
      ctx.fillStyle = COLORS.line;
      for (let x = Math.floor(LEFT / 4) * 4; x < RIGHT; x += 4) ctx.fillRect(X(x), laneOn - 0.06 * k, 2 * k, 0.12 * k);
      ctx.fillRect(0, shoulderTop - 0.06 * k, W, 0.12 * k);
      // Red and white curb, as in the pictures.
      const curb = 0.28 * k;
      for (let x = Math.floor(LEFT); x < RIGHT; x += 1) {
        ctx.fillStyle = Math.abs(Math.round(x)) % 2 ? COLORS.curbRed : COLORS.curbWhite;
        ctx.fillRect(X(x), roadBottom - curb, k + 0.5, curb);
        ctx.fillRect(X(x), roadTop, k + 0.5, curb);
      }

      TREES.forEach((t) => {
        const cy = t.top ? roadTop - walk - t.r * k * 0.75 : roadBottom + walk + t.r * k * 0.75;
        ctx.beginPath();
        ctx.arc(X(t.x), cy, t.r * k, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.treeDark;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(X(t.x) - t.r * k * 0.12, cy - t.r * k * 0.12, t.r * k * 0.82, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.tree;
        ctx.fill();
      });

      const drawCar = (x: number, y: number, color: string, dir: 1 | -1, opts: { braking?: boolean; blink?: boolean; v?: number; me?: boolean } = {}) => {
        const len = L * k;
        const wid = CW * k;
        const cx = X(x);
        ctx.save();
        ctx.translate(cx, y);
        ctx.scale(dir, 1);
        // Speed lines behind fast cars
        if ((opts.v ?? 0) > 7.5) {
          ctx.strokeStyle = "rgba(255,255,255,0.45)";
          ctx.lineWidth = Math.max(1, 0.08 * k);
          ctx.lineCap = "round";
          const n = (opts.v ?? 0) > 9.5 ? 3 : 2;
          for (let i = 0; i < n; i++) {
            const off = (i - (n - 1) / 2) * wid * 0.32;
            const ln = (0.8 + ((sim.time * 7 + i) % 1) * 0.6) * k;
            ctx.beginPath();
            ctx.moveTo(-len / 2 - 0.35 * k, off);
            ctx.lineTo(-len / 2 - 0.35 * k - ln, off);
            ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(20,25,30,0.22)";
        ctx.beginPath();
        ctx.roundRect(-len / 2 + 0.1 * k, -wid / 2 + 0.18 * k, len, wid, wid * 0.3);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(-len / 2, -wid / 2, len, wid, wid * 0.3);
        ctx.fill();
        ctx.strokeStyle = "rgba(30,40,50,0.25)";
        ctx.lineWidth = Math.max(1, 0.04 * k);
        ctx.stroke();
        // Windshield (front), rear window and a lighter roof
        ctx.fillStyle = COLORS.glass;
        ctx.beginPath();
        ctx.moveTo(len * 0.1, -wid * 0.36);
        ctx.lineTo(len * 0.26, -wid * 0.42);
        ctx.lineTo(len * 0.26, wid * 0.42);
        ctx.lineTo(len * 0.1, wid * 0.36);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-len * 0.24, -wid * 0.36);
        ctx.lineTo(-len * 0.34, -wid * 0.4);
        ctx.lineTo(-len * 0.34, wid * 0.4);
        ctx.lineTo(-len * 0.24, wid * 0.36);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.beginPath();
        ctx.roundRect(-len * 0.22, -wid * 0.34, len * 0.3, wid * 0.68, wid * 0.12);
        ctx.fill();
        // Lights
        ctx.fillStyle = COLORS.head;
        ctx.fillRect(len / 2 - 0.12 * k, -wid * 0.42, 0.1 * k, wid * 0.2);
        ctx.fillRect(len / 2 - 0.12 * k, wid * 0.22, 0.1 * k, wid * 0.2);
        ctx.fillStyle = opts.braking ? COLORS.tailOn : COLORS.tail;
        if (opts.braking) {
          ctx.shadowColor = COLORS.tailOn;
          ctx.shadowBlur = 0.5 * k;
        }
        ctx.fillRect(-len / 2 + 0.02 * k, -wid * 0.42, 0.12 * k, wid * 0.2);
        ctx.fillRect(-len / 2 + 0.02 * k, wid * 0.22, 0.12 * k, wid * 0.2);
        ctx.shadowBlur = 0;
        // Turn signal on the side toward the lane (the top side when driving right)
        if (opts.blink) {
          ctx.fillStyle = COLORS.blink;
          ctx.shadowColor = COLORS.blink;
          ctx.shadowBlur = 0.7 * k;
          ctx.beginPath();
          ctx.arc(len / 2 - 0.2 * k, -wid / 2 + 0.05 * k, 0.2 * k, 0, Math.PI * 2);
          ctx.arc(-len / 2 + 0.2 * k, -wid / 2 + 0.05 * k, 0.2 * k, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        // The player's cap on the roof, to tell his car apart
        if (opts.me) {
          ctx.fillStyle = "#2c5fb3";
          ctx.beginPath();
          ctx.arc(-len * 0.07, 0, wid * 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(-len * 0.07, 0, wid * 0.2, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
        }
        ctx.restore();
      };

      sim.oncoming.forEach((o) => drawCar(o.x, roadTop + (LANE * k) / 2, o.color, -1, { v: o.v }));
      sim.cars.forEach((c) => drawCar(c.x, laneY, c.color, 1, { braking: c.braking, v: c.v }));

      const me = sim.me;
      const meY = sideY + (laneY - sideY) * me.m;
      const blinkOn = sim.signal && Math.floor(sim.blinkClock * 3) % 2 === 0;
      drawCar(me.x, meY, COLORS.me, 1, { blink: blinkOn, v: me.v, me: true });

      // "אתה" over the player's car while it waits
      const phase = phaseRef.current;
      if (phase === "parked" || phase === "ready") {
        const fs = Math.max(11, 0.62 * k);
        ctx.font = `700 ${fs}px Polin, system-ui, sans-serif`;
        const label = "אתה";
        const tw = ctx.measureText(label).width;
        const bx = X(me.x);
        const by = meY + (CW * k) / 2 + fs * 1.05 + Math.sin(sim.time * 3) * 2;
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.beginPath();
        ctx.roundRect(bx - tw / 2 - fs * 0.5, by - fs * 0.75, tw + fs, fs * 1.5, fs * 0.75);
        ctx.fill();
        ctx.fillStyle = COLORS.me;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, bx, by + fs * 0.05);
      }
      if (sim.fade > 0) {
        ctx.fillStyle = `rgba(250,251,251,${Math.min(1, sim.fade / 0.45)})`;
        ctx.fillRect(0, 0, W, H);
      }
    };

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visibleRef.current && W > 0) {
        update(dt);
        draw();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [flash, setPhase]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const tryAgain = () => {
    if (reasonRef.current !== "nosignal") {
      simRef.current.signal = true;
      setSignal(true);
    }
    setPhase("parked");
  };

  return (
    <div ref={wrapRef} className={cn("relative size-full select-none overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="כביש במבט מלמעלה: מכוניות נוסעות בנתיב, והרכב שלך עומד בצד הכביש ומחכה להשתלב"
        className="absolute inset-0 size-full"
      />

      {/* Progress: one dot per round */}
      {phase !== "ready" && (
        <div
          aria-label={`הצטרפת ${completed} מתוך ${ROUNDS.length} פעמים`}
          className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-card/85 px-2 py-1.5 shadow-sm md:bottom-4 md:right-4 md:gap-1.5 md:px-3 md:py-2 lg:bottom-[calc(var(--u)*1.042)] lg:right-[calc(var(--u)*1.042)] lg:gap-[calc(var(--u)*0.417)] lg:px-[calc(var(--u)*0.833)] lg:py-[calc(var(--u)*0.521)]"
        >
          {ROUNDS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-2 rounded-full transition-colors duration-300 md:size-3 lg:size-[calc(var(--u)*0.625)]",
                i < completed ? "bg-primary" : "bg-progress-track",
              )}
            />
          ))}
        </div>
      )}

      {/* Sound on/off */}
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "הפעלת צלילים" : "השתקת צלילים"}
        aria-pressed={muted}
        className="absolute left-2 top-2 z-10 flex size-9 items-center justify-center rounded-full bg-card/85 text-primary shadow-sm transition-[transform,background-color] duration-200 hover:scale-110 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 md:left-4 md:top-4 md:size-11 lg:left-[calc(var(--u)*1.042)] lg:top-[calc(var(--u)*1.042)] lg:size-[calc(var(--u)*2.5)]"
      >
        {muted ? (
          <VolumeX aria-hidden="true" className="size-5 md:size-6 lg:size-[calc(var(--u)*1.25)]" />
        ) : (
          <Volume2 aria-hidden="true" className="size-5 md:size-6 lg:size-[calc(var(--u)*1.25)]" />
        )}
      </button>

      {/* Signal, then pull out: in the bottom corner, away from the lane the player watches */}
      {phase === "parked" && (
        <div className="absolute bottom-2 left-2 flex flex-col items-start gap-1.5 motion-safe:animate-fade-up md:bottom-4 md:left-4 md:gap-2 lg:bottom-[calc(var(--u)*1.042)] lg:left-[calc(var(--u)*1.042)] lg:gap-[calc(var(--u)*0.521)]">
          <p className="rounded-full bg-card/85 px-3 py-0.5 text-[13px] md:text-[16px] lg:px-[calc(var(--u)*0.833)] lg:py-[calc(var(--u)*0.156)] lg:text-[calc(var(--u)*1.042)]">
            {signal ? "יש רווח גדול? צא לנתיב!" : "בדוק את הכביש: עמוס? מהיר?"}
          </p>
          <div className="flex items-center gap-1.5 md:gap-2 lg:gap-[calc(var(--u)*0.521)]">
            <ActionButton icon="💡" onClick={signalOn} disabled={signal} active={signal}>
              {signal ? "מאותת…" : "לאותת"}
            </ActionButton>
            <ActionButton icon="🚗" onClick={pullOut}>
              לצאת לנתיב
            </ActionButton>
          </div>
        </div>
      )}

      {toast && (
        <p
          key={toast.id}
          role="status"
          className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-4 py-1 text-[13px] font-bold text-primary-foreground shadow-lg motion-safe:animate-fade-up md:top-5 md:text-[18px] lg:top-[calc(var(--u)*1.25)] lg:px-[calc(var(--u)*1.25)] lg:py-[calc(var(--u)*0.313)] lg:text-[calc(var(--u)*1.25)]"
        >
          {toast.text}
        </p>
      )}

      {phase === "ready" && (
        <Panel>
          <h3 className="text-[18px] font-bold md:text-[26px] lg:text-[calc(var(--u)*1.667)]">בוא נצטרף לנסיעה!</h3>
          <p className="max-w-[260px] text-[13px] leading-snug md:max-w-[380px] md:text-[16px] lg:max-w-[calc(var(--u)*22)] lg:text-[calc(var(--u)*1.042)]">
            הרכב שלך עומד בצד הכביש. בדוק אם הכביש עמוס ואם המכוניות נוסעות מהר, אותת, וצא לנתיב רק כשיש רווח גדול.
          </p>
          <PanelButton onClick={start}>יוצאים לדרך</PanelButton>
        </Panel>
      )}

      {phase === "wrong" && (
        <Panel tone="alert">
          <span aria-hidden="true" className="text-[34px] leading-none motion-safe:animate-bob md:text-[44px] lg:text-[calc(var(--u)*2.6)]">
            {reason === "nosignal" ? "🤔" : "😮"}
          </span>
          <h3 className="text-[18px] font-bold text-alert md:text-[26px] lg:text-[calc(var(--u)*1.667)]">{HINTS[reason].title}</h3>
          <p className="max-w-[260px] text-[13px] leading-snug md:max-w-[380px] md:text-[16px] lg:max-w-[calc(var(--u)*22)] lg:text-[calc(var(--u)*1.042)]">
            {HINTS[reason].text}
          </p>
          <PanelButton onClick={tryAgain}>לנסות שוב</PanelButton>
        </Panel>
      )}

      {phase === "done" && (
        <Panel>
          <h3 className="text-[18px] font-bold md:text-[26px] lg:text-[calc(var(--u)*1.667)]">🏁 הצטרפת לנסיעה!</h3>
          <p className="max-w-[260px] text-[13px] leading-snug md:max-w-[380px] md:text-[16px] lg:max-w-[calc(var(--u)*22)] lg:text-[calc(var(--u)*1.042)]">
            {mistakes === 0
              ? "בכל הסיבובים בדקת את הכביש, איתתת וחיכית לרווח בטוח. נהג אלוף!"
              : "הצלחת להשתלב בכל הסיבובים! זכור: בודקים את הכביש, מאותתים, ויוצאים רק כשיש רווח גדול."}
          </p>
          <PanelButton onClick={start}>לנסוע שוב</PanelButton>
        </Panel>
      )}

      <span className="sr-only" aria-live="polite">
        {phase === "parked" ? `סיבוב ${round + 1} מתוך ${ROUNDS.length}: ${ROUNDS[round].name}` : ""}
      </span>
    </div>
  );
}

function ActionButton({
  icon,
  onClick,
  disabled,
  active,
  children,
}: {
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-card py-1.5 pe-3 ps-1.5 text-[14px] text-foreground shadow-[0_4px_12px_hsl(var(--mist)/0.5)] transition-[background-color,color,transform] duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:hover:scale-100 md:gap-2 md:pe-4 md:text-[18px] lg:gap-[calc(var(--u)*0.521)] lg:py-[calc(var(--u)*0.417)] lg:pe-[calc(var(--u)*1.042)] lg:ps-[calc(var(--u)*0.417)] lg:text-[calc(var(--u)*1.25)] lg:shadow-[0_calc(var(--u)*0.208)_calc(var(--u)*0.625)_hsl(var(--mist)/0.5)]",
        active && "bg-brand-sun/60",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-7 items-center justify-center rounded-full bg-brand-sun text-[15px] md:size-9 md:text-[19px] lg:size-[calc(var(--u)*2.083)] lg:text-[calc(var(--u)*1.146)]",
          active && "motion-safe:animate-pulse",
        )}
      >
        {icon}
      </span>
      {children}
    </button>
  );
}
