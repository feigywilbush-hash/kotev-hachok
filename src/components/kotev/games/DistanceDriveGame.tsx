import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { Panel, PanelButton } from "./NoEntryDriveGame";
import { playFail, playHorn, playSuccess, playWin, setDriveMuted, setEngine, startDriveMusic, stopDriveMusic } from "./driveSounds";

const MUTE_KEY = "kotev-drive-muted";

/*
 * Driving game for the "שמירת מרחב" law, seen from above: the player's car drives behind another
 * car and has to keep a safe distance from it. The rule from the law is drawn on the road: a line
 * where the car in front was two seconds ago. Staying behind that line means the distance is safe.
 * The player speeds up and slows down (hold the buttons, or the arrow keys); safe driving fills the
 * round's bar. Getting too close ends in a near miss: the car in front brakes and honks, and the
 * player's car drops back, so there is never a crash. Four rounds: steady, slowing, sudden braking
 * and a fast road (where two seconds are many more meters).
 * Sizes: px on mobile/tablet; on desktop multiples of --u (see KotevLayout).
 */

type Phase = "ready" | "driving" | "wrong" | "between" | "done";
type Zone = "safe" | "close" | "far";

type Round = { name: string; start: number; lead: (t: number) => number; praise: string };

/** Speeds in m/s. `lead` is the target speed of the car in front, by time into the round. */
const ROUNDS: Round[] = [
  { name: "נסיעה רגילה", start: 8, lead: () => 8, praise: "כל הכבוד! שמרת מרחק של 2 שניות" },
  {
    name: "הרכב שלפניך מאט",
    start: 9,
    lead: (t) => (t % 9 < 4.5 ? 9 : 5),
    praise: "יפה! האטת כשהרכב שלפניך האט",
  },
  {
    name: "בלימה פתאומית",
    start: 9,
    lead: (t) => (t % 8 > 5.5 ? 3.5 : 9),
    praise: "מצוין! בזכות המרחק הספקת לבלום בזמן",
  },
  {
    name: "כביש מהיר",
    start: 13,
    lead: (t) => 13 + Math.sin(t * 0.7) * 1.5,
    praise: "אלוף! במהירות גבוהה 2 שניות הן מרחק גדול יותר",
  },
];

const SAFE_GOAL = 8; // seconds of safe driving that complete a round
const RULE = 2; // the two-second rule
const FAR = 4.5; // seconds behind from which the player is too far to count
const MAX_V = 17;

const HINT = {
  title: "צמוד מדי!",
  text: "נסעת קרוב מדי לרכב שלפניך ולא היה לך זמן לבלום. הישאר תמיד מאחורי הקו של 2 השניות.",
};

// World, in meters. x grows in the driving direction (to the right).
const VIEW = 52; // meters across the canvas
const CAR_AT = 0.14; // where the player's car is, as a share of the width
const L = 4.4; // car length
const CW = 1.95; // car width
const LANE = 3.4;

const COLORS = {
  grass: "#d6ebc6",
  tree: "#8cc77a",
  treeDark: "#6fae5e",
  walk: "#eceef0",
  walkLine: "#dfe3e6",
  road: "#6c7075",
  line: "#f3f4f5",
  curbRed: "#e0574c",
  curbWhite: "#ffffff",
  me: "#f07a5f",
  lead: "#4f86e8",
  glass: "#3c4a5c",
  head: "#fff5c8",
  tail: "#b8322a",
  tailOn: "#ff3b30",
  safe: "#3fae6a",
  close: "#e0574c",
  far: "#4f86e8",
};
const PAINT = ["#ffffff", "#5cb87a", "#9b7ce0", "#3fb6c0", "#f2c94c", "#e8eef3"];

type Sim = {
  time: number;
  round: number;
  roundTime: number;
  lead: { x: number; v: number; braking: boolean };
  me: { x: number; v: number; braking: boolean };
  /** Where the car in front was, for the two-second line. */
  trail: { t: number; x: number }[];
  oncoming: { x: number; v: number; color: string }[];
  oncomingIn: number;
  nextId: number;
  safe: number; // seconds of safe driving in this round
  completed: number;
  mistakes: number;
  zone: Zone;
  near: number; // time into the near-miss before the panel
  betweenIn: number | null;
  fade: number;
  /** Meters across the canvas: zooms out when the car in front is far ahead (fast roads). */
  view: number;
};

const seeded = (i: number, n: number) => {
  const v = Math.sin((i + 1) * 9301 + n * 49297) * 233280;
  return v - Math.floor(v);
};
const TREE_PERIOD = 64;
const TREES = Array.from({ length: 14 }, (_, i) => ({ x: (i % 7) * (TREE_PERIOD / 7) + seeded(i, 1) * 4, top: i < 7, r: 1.3 + seeded(i, 2) * 0.8 }));

/** Puts the player's car a safe distance behind the car in front, both at the round's speed. */
function placeCars(sim: Sim, v: number, gapSeconds = 2.7) {
  const leadX = sim.lead.x;
  sim.lead.v = v;
  sim.me = { x: leadX - L - v * gapSeconds, v, braking: false };
  sim.trail = [];
  for (let back = 3; back >= 0; back -= 0.05) sim.trail.push({ t: sim.time - back, x: leadX - v * back });
}

function startRound(sim: Sim, index: number) {
  sim.round = index;
  sim.roundTime = 0;
  sim.safe = 0;
  sim.lead = { x: sim.lead?.x ?? 0, v: ROUNDS[index].start, braking: false };
  placeCars(sim, ROUNDS[index].start);
  sim.fade = 0.45;
  sim.zone = "safe";
}

const freshSim = (): Sim => {
  const sim = {
    time: 0,
    round: 0,
    roundTime: 0,
    lead: { x: 0, v: 8, braking: false },
    me: { x: 0, v: 8, braking: false },
    trail: [],
    oncoming: [],
    oncomingIn: 0.5,
    nextId: 1,
    safe: 0,
    completed: 0,
    mistakes: 0,
    zone: "safe",
    near: 0,
    betweenIn: null,
    fade: 0,
    view: VIEW,
  } as Sim;
  startRound(sim, 0);
  return sim;
};

/** Where the rear of the car in front was two seconds ago. */
function ruleLine(sim: Sim) {
  const at = sim.time - RULE;
  const tr = sim.trail;
  for (let i = tr.length - 1; i > 0; i--) {
    if (tr[i - 1].t <= at) {
      const a = tr[i - 1];
      const b = tr[i];
      const f = b.t === a.t ? 0 : (at - a.t) / (b.t - a.t);
      return a.x + (b.x - a.x) * f - L / 2;
    }
  }
  return tr[0].x - L / 2;
}

/** Seconds until the player's car reaches where the car in front is now. */
const timeGap = (sim: Sim) => (sim.lead.x - sim.me.x - L) / Math.max(sim.me.v, 0.5);

export function DistanceDriveGame({
  onComplete,
  onScore,
  className,
}: {
  onComplete?: () => void;
  /** Called with the round's index each time the player finishes a round. */
  onScore?: (round: number) => void;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim>(null as unknown as Sim);
  if (!simRef.current) simRef.current = freshSim();
  const phaseRef = useRef<Phase>("ready");
  const pedalRef = useRef<{ gas: boolean; brake: boolean }>({ gas: false, brake: false });
  const visibleRef = useRef(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;

  const [phase, setPhaseState] = useState<Phase>("ready");
  const [round, setRound] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hud, setHud] = useState<{ zone: Zone; gap: number; safe: number }>({ zone: "safe", gap: 2.7, safe: 0 });
  const [pedal, setPedal] = useState<{ gas: boolean; brake: boolean }>({ gas: false, brake: false });
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

  const press = useCallback((which: "gas" | "brake", down: boolean) => {
    if (pedalRef.current[which] === down) return;
    pedalRef.current = { ...pedalRef.current, [which]: down };
    setPedal(pedalRef.current);
  }, []);

  const release = useCallback(() => {
    pedalRef.current = { gas: false, brake: false };
    setPedal(pedalRef.current);
  }, []);

  const flash = useCallback((text: string) => setToast((t) => ({ id: (t?.id ?? 0) + 1, text })), []);

  const start = useCallback(() => {
    simRef.current = freshSim();
    setRound(0);
    setCompleted(0);
    setMistakes(0);
    release();
    startDriveMusic();
    setPhase("driving");
    flash(`סיבוב 1 מתוך ${ROUNDS.length}: ${ROUNDS[0].name}`);
  }, [flash, release, setPhase]);

  const tryAgain = useCallback(() => {
    const sim = simRef.current;
    placeCars(sim, Math.max(sim.lead.v, ROUNDS[sim.round].start * 0.8));
    sim.near = 0;
    sim.fade = 0.3;
    release();
    setPhase("driving");
  }, [release, setPhase]);

  // Arrow keys: up or right speeds up, down or left slows down.
  useEffect(() => {
    const keyOf = (e: KeyboardEvent) =>
      e.key === "ArrowUp" || e.key === "ArrowRight" ? "gas" : e.key === "ArrowDown" || e.key === "ArrowLeft" ? "brake" : null;
    const down = (e: KeyboardEvent) => {
      const k = keyOf(e);
      if (!k || phaseRef.current !== "driving") return;
      e.preventDefault();
      press(k, true);
    };
    const up = (e: KeyboardEvent) => {
      const k = keyOf(e);
      if (k) press(k, false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", release);
    };
  }, [press, release]);

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

    let hudClock = 0;

    const update = (dt: number) => {
      const sim = simRef.current;
      const phase = phaseRef.current;
      sim.time += dt;
      sim.fade = Math.max(0, sim.fade - dt);
      if (phase === "wrong" || phase === "done") return;
      const moving = phase === "driving" || phase === "between";

      // The car in front follows the round's script; while waiting to start it just cruises.
      const lead = sim.lead;
      if (phase === "driving") sim.roundTime += dt;
      const target = phase === "driving" ? ROUNDS[sim.round].lead(sim.roundTime) : ROUNDS[sim.round].start;
      const beforeLead = lead.v;
      lead.v += target > lead.v ? Math.min(target - lead.v, 2.5 * dt) : -Math.min(lead.v - target, 5 * dt);
      lead.braking = sim.near > 0 || beforeLead - lead.v > 2 * dt;
      lead.x += lead.v * dt;
      sim.trail.push({ t: sim.time, x: lead.x });
      while (sim.trail.length > 2 && sim.trail[1].t < sim.time - 3) sim.trail.shift();

      // The player's car: it keeps its speed unless the player speeds up or slows down.
      const me = sim.me;
      const p = pedalRef.current;
      if (phase === "ready") me.v = lead.v;
      else if (p.brake) me.v = Math.max(0, me.v - 6.5 * dt);
      else if (p.gas) me.v = Math.min(MAX_V, me.v + 3 * dt);
      else me.v = Math.max(0, me.v - 0.15 * dt);
      me.braking = p.brake && moving;
      me.x += me.v * dt;
      setEngine(Math.min(1, me.v / 12));

      // Never a crash: if the gap gets tiny anyway, the player's car is held back.
      if (me.x > lead.x - L - 0.8) {
        me.x = lead.x - L - 0.8;
        me.v = Math.min(me.v, lead.v);
      }

      if (phase === "driving") {
        const gap = timeGap(sim);
        const zone: Zone = me.x + L / 2 > ruleLine(sim) ? "close" : gap > FAR ? "far" : "safe";
        sim.zone = zone;
        const meters = lead.x - me.x - L;
        if (meters < Math.max(2.5, me.v * 0.75) && me.v > lead.v - 0.3) {
          // Too close: the car in front brakes and honks, and the player gets the hint.
          sim.near += dt;
          if (sim.near === dt) {
            sim.mistakes += 1;
            setMistakes(sim.mistakes);
            playHorn();
          }
          me.v = Math.max(0, me.v - 8 * dt);
          if (sim.near > 0.7) {
            sim.near = 0;
            playFail();
            release();
            setPhase("wrong");
          }
        } else if (sim.near > 0) {
          sim.near += dt;
          if (sim.near > 0.7) {
            sim.near = 0;
            playFail();
            release();
            setPhase("wrong");
          }
        } else if (zone === "safe") {
          sim.safe += dt;
          if (sim.safe >= SAFE_GOAL) {
            sim.safe = SAFE_GOAL;
            sim.completed += 1;
            setCompleted(sim.completed);
            onScoreRef.current?.(sim.round);
            playSuccess();
            flash(ROUNDS[sim.round].praise);
            release();
            setPhase("between");
            sim.betweenIn = 2.4;
          }
        }
        hudClock -= dt;
        if (hudClock <= 0) {
          hudClock = 0.1;
          setHud({ zone, gap, safe: sim.safe });
        }
      }

      if (phase === "between" && sim.betweenIn !== null) {
        // Between rounds the player's car keeps a safe distance by itself.
        const want = lead.v * (timeGap(sim) < 2.6 ? 0.9 : 1.05);
        me.v += (want - me.v) * Math.min(1, dt * 2);
        sim.betweenIn -= dt;
        if (sim.betweenIn <= 0) {
          sim.betweenIn = null;
          if (sim.round + 1 < ROUNDS.length) {
            startRound(sim, sim.round + 1);
            setRound(sim.round);
            setHud({ zone: "safe", gap: 2.7, safe: 0 });
            setPhase("driving");
            flash(`סיבוב ${sim.round + 1} מתוך ${ROUNDS.length}: ${ROUNDS[sim.round].name}`);
          } else {
            stopDriveMusic();
            playWin();
            setPhase("done");
            onCompleteRef.current?.();
          }
        }
      }

      // Keep the car in front on screen, zooming out smoothly when it is far ahead.
      const base = W < 640 ? VIEW * 0.85 : VIEW;
      const want = Math.max(base, (lead.x - me.x + L + 5) / (1 - CAR_AT));
      sim.view += (want - sim.view) * Math.min(1, dt * 1.5);

      // The other side of the road, just for life.
      const view = sim.view;
      const camX = me.x - view * CAR_AT;
      sim.oncomingIn -= dt;
      if (sim.oncomingIn <= 0) {
        sim.oncoming.push({ x: camX + view + 8, v: 8 + seeded(sim.nextId, 3) * 4, color: PAINT[(sim.nextId * 3) % PAINT.length] });
        sim.nextId += 1;
        sim.oncomingIn = 1.5 + seeded(sim.nextId, 4) * 3;
      }
      sim.oncoming.forEach((o) => (o.x -= o.v * dt));
      sim.oncoming = sim.oncoming.filter((o) => o.x > camX - 10);
    };

    const draw = () => {
      const sim = simRef.current;
      const phase = phaseRef.current;
      const narrow = W < 640;
      const view = sim.view;
      const k = W / view;
      const camX = sim.me.x - view * CAR_AT;
      const X = (x: number) => (x - camX) * k;
      const roadH = LANE * 2 * k;
      const roadTop = Math.round(H * (narrow ? 0.4 : 0.47) - roadH / 2);
      const laneOn = roadTop + LANE * k; // top edge of our lane
      const roadBottom = laneOn + LANE * k;
      const laneY = laneOn + (LANE * k) / 2;
      const walk = 2.2 * k;
      const from = Math.floor(camX) - 2;
      const to = camX + view + 2;

      ctx.fillStyle = COLORS.grass;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.walk;
      ctx.fillRect(0, roadTop - walk, W, walk);
      ctx.fillRect(0, roadBottom, W, walk);
      ctx.strokeStyle = COLORS.walkLine;
      ctx.lineWidth = 1;
      for (let x = Math.ceil(from / 1.5) * 1.5; x < to; x += 1.5) {
        ctx.beginPath();
        ctx.moveTo(X(x), roadTop - walk);
        ctx.lineTo(X(x), roadTop);
        ctx.moveTo(X(x), roadBottom);
        ctx.lineTo(X(x), roadBottom + walk);
        ctx.stroke();
      }

      ctx.fillStyle = COLORS.road;
      ctx.fillRect(0, roadTop, W, roadH);
      ctx.fillStyle = COLORS.line;
      for (let x = Math.floor(from / 4) * 4; x < to; x += 4) ctx.fillRect(X(x), laneOn - 0.06 * k, 2 * k, 0.12 * k);
      const curb = 0.28 * k;
      for (let x = from; x < to; x += 1) {
        ctx.fillStyle = Math.abs(x) % 2 ? COLORS.curbRed : COLORS.curbWhite;
        ctx.fillRect(X(x), roadBottom - curb, k + 0.5, curb);
        ctx.fillRect(X(x), roadTop, k + 0.5, curb);
      }

      const treeBase = Math.floor(camX / TREE_PERIOD) * TREE_PERIOD;
      for (let b = treeBase - TREE_PERIOD; b < to; b += TREE_PERIOD) {
        TREES.forEach((t) => {
          const x = b + t.x;
          if (x < from - 4 || x > to + 4) return;
          const cy = t.top ? roadTop - walk - t.r * k * 0.75 : roadBottom + walk + t.r * k * 0.75;
          ctx.beginPath();
          ctx.arc(X(x), cy, t.r * k, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.treeDark;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(X(x) - t.r * k * 0.12, cy - t.r * k * 0.12, t.r * k * 0.82, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.tree;
          ctx.fill();
        });
      }

      // The two-second line, and the "too close" zone between it and the car in front.
      if (phase !== "ready") {
        const line = ruleLine(sim);
        const leadRear = sim.lead.x - L / 2;
        const close = sim.zone === "close" || sim.near > 0;
        ctx.fillStyle = close ? "rgba(224,87,76,0.32)" : "rgba(224,87,76,0.16)";
        ctx.fillRect(X(line), laneOn + 0.15 * k, Math.max(0, X(leadRear) - X(line)), LANE * k - 0.3 * k);
        const lineColor = close ? COLORS.close : COLORS.safe;
        ctx.fillStyle = lineColor;
        for (let y = laneOn + 0.2 * k; y < roadBottom - 0.2 * k; y += 0.6 * k) ctx.fillRect(X(line) - 0.12 * k, y, 0.24 * k, 0.35 * k);
        // Label under the road
        const fs = Math.max(11, 0.62 * k);
        ctx.font = `700 ${fs}px Polin, system-ui, sans-serif`;
        const label = "2 שניות";
        const tw = ctx.measureText(label).width;
        const by = roadBottom + walk * 0.5;
        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.roundRect(X(line) - tw / 2 - fs * 0.5, by - fs * 0.75, tw + fs, fs * 1.5, fs * 0.75);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, X(line), by + fs * 0.05);
      }

      const drawCar = (x: number, y: number, color: string, dir: 1 | -1, opts: { braking?: boolean; v?: number; me?: boolean } = {}) => {
        const len = L * k;
        const wid = CW * k;
        ctx.save();
        ctx.translate(X(x), y);
        ctx.scale(dir, 1);
        if ((opts.v ?? 0) > 7.5) {
          ctx.strokeStyle = "rgba(255,255,255,0.45)";
          ctx.lineWidth = Math.max(1, 0.08 * k);
          ctx.lineCap = "round";
          const n = (opts.v ?? 0) > 11 ? 3 : 2;
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
        ctx.fillStyle = COLORS.head;
        ctx.fillRect(len / 2 - 0.12 * k, -wid * 0.42, 0.1 * k, wid * 0.2);
        ctx.fillRect(len / 2 - 0.12 * k, wid * 0.22, 0.1 * k, wid * 0.2);
        ctx.fillStyle = opts.braking ? COLORS.tailOn : COLORS.tail;
        if (opts.braking) {
          ctx.shadowColor = COLORS.tailOn;
          ctx.shadowBlur = 0.6 * k;
        }
        ctx.fillRect(-len / 2 + 0.02 * k, -wid * 0.42, 0.14 * k, wid * 0.2);
        ctx.fillRect(-len / 2 + 0.02 * k, wid * 0.22, 0.14 * k, wid * 0.2);
        ctx.shadowBlur = 0;
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
      drawCar(sim.lead.x, laneY, COLORS.lead, 1, { braking: sim.lead.braking, v: sim.lead.v });
      drawCar(sim.me.x, laneY, COLORS.me, 1, { braking: sim.me.braking, v: sim.me.v, me: true });

      // "אתה" under the player's car
      if (phase === "ready" || phase === "driving") {
        const fs = Math.max(11, 0.62 * k);
        ctx.font = `700 ${fs}px Polin, system-ui, sans-serif`;
        const label = "אתה";
        const tw = ctx.measureText(label).width;
        const bx = X(sim.me.x);
        const by = roadBottom + walk * 0.5 + Math.sin(sim.time * 3) * 2;
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
  }, [flash, release, setPhase]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const tip =
    hud.zone === "close" ? "קרוב מדי! האט ועבור אל מאחורי הקו" : hud.zone === "far" ? "רחוק מדי, אפשר להאיץ קצת" : "מרחק בטוח! הישאר מאחורי הקו";

  return (
    <div ref={wrapRef} className={cn("relative size-full select-none overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="כביש במבט מלמעלה: הרכב שלך נוסע מאחורי רכב אחר, וקו על הכביש מראה איפה היה הרכב שלפניך לפני 2 שניות"
        className="absolute inset-0 size-full"
      />

      {/* Distance in seconds and the round's bar */}
      {phase === "driving" && (
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1 rounded-[16px] bg-card/90 px-3 py-1.5 shadow-sm md:right-4 md:top-4 md:px-4 md:py-2 lg:right-[calc(var(--u)*1.042)] lg:top-[calc(var(--u)*1.042)] lg:gap-[calc(var(--u)*0.26)] lg:rounded-[calc(var(--u)*1.042)] lg:px-[calc(var(--u)*1.042)] lg:py-[calc(var(--u)*0.521)]">
          <p className="text-[13px] md:text-[16px] lg:text-[calc(var(--u)*1.042)]">
            המרחק שלך:{" "}
            <span
              className="font-bold"
              style={{ color: hud.zone === "close" ? COLORS.close : hud.zone === "far" ? COLORS.far : COLORS.safe }}
            >
              {Math.min(9.9, Math.max(0, hud.gap)).toFixed(1)} שניות
            </span>
          </p>
          <div
            aria-label={`שמירת מרחק בסיבוב: ${Math.round((hud.safe / SAFE_GOAL) * 100)}%`}
            className="h-1.5 w-28 overflow-hidden rounded-full bg-progress-track md:h-2 md:w-40 lg:h-[calc(var(--u)*0.417)] lg:w-[calc(var(--u)*10)]"
          >
            <div className="h-full rounded-full bg-primary transition-[width] duration-100" style={{ width: `${(hud.safe / SAFE_GOAL) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Progress: one dot per round */}
      {phase !== "ready" && (
        <div
          aria-label={`סיימת ${completed} מתוך ${ROUNDS.length} סיבובים`}
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

      {/* Speed up / slow down: hold */}
      {phase === "driving" && (
        <div className="absolute bottom-2 left-2 flex flex-col items-start gap-1.5 motion-safe:animate-fade-up md:bottom-4 md:left-4 md:gap-2 lg:bottom-[calc(var(--u)*1.042)] lg:left-[calc(var(--u)*1.042)] lg:gap-[calc(var(--u)*0.521)]">
          <p className="rounded-full bg-card/85 px-3 py-0.5 text-[13px] md:text-[16px] lg:px-[calc(var(--u)*0.833)] lg:py-[calc(var(--u)*0.156)] lg:text-[calc(var(--u)*1.042)]">
            {tip}
          </p>
          <div className="flex items-center gap-1.5 md:gap-2 lg:gap-[calc(var(--u)*0.521)]">
            <HoldButton icon="🐢" active={pedal.brake} onHold={(d) => press("brake", d)}>
              להאט
            </HoldButton>
            <HoldButton icon="🚀" active={pedal.gas} onHold={(d) => press("gas", d)}>
              להאיץ
            </HoldButton>
          </div>
        </div>
      )}

      {toast && (
        <p
          key={toast.id}
          role="status"
          className="absolute left-1/2 top-14 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-4 py-1 text-[13px] font-bold text-primary-foreground shadow-lg motion-safe:animate-fade-up md:top-20 md:text-[18px] lg:top-[calc(var(--u)*4.6)] lg:px-[calc(var(--u)*1.25)] lg:py-[calc(var(--u)*0.313)] lg:text-[calc(var(--u)*1.25)]"
        >
          {toast.text}
        </p>
      )}

      {phase === "ready" && (
        <Panel>
          <h3 className="text-[18px] font-bold md:text-[26px] lg:text-[calc(var(--u)*1.667)]">שומרים מרחק!</h3>
          <p className="max-w-[260px] text-[13px] leading-snug md:max-w-[380px] md:text-[16px] lg:max-w-[calc(var(--u)*22)] lg:text-[calc(var(--u)*1.042)]">
            אתה נוסע מאחורי רכב אחר. הקו על הכביש מראה איפה הוא היה לפני 2 שניות. האט והאץ כדי להישאר תמיד מאחורי הקו.
          </p>
          <PanelButton onClick={start}>יוצאים לדרך</PanelButton>
        </Panel>
      )}

      {phase === "wrong" && (
        <Panel tone="alert">
          <span aria-hidden="true" className="text-[34px] leading-none motion-safe:animate-bob md:text-[44px] lg:text-[calc(var(--u)*2.6)]">
            😮
          </span>
          <h3 className="text-[18px] font-bold text-alert md:text-[26px] lg:text-[calc(var(--u)*1.667)]">{HINT.title}</h3>
          <p className="max-w-[260px] text-[13px] leading-snug md:max-w-[380px] md:text-[16px] lg:max-w-[calc(var(--u)*22)] lg:text-[calc(var(--u)*1.042)]">
            {HINT.text}
          </p>
          <PanelButton onClick={tryAgain}>לנסות שוב</PanelButton>
        </Panel>
      )}

      {phase === "done" && (
        <Panel>
          <h3 className="text-[18px] font-bold md:text-[26px] lg:text-[calc(var(--u)*1.667)]">🏁 שמרת על מרחק בטוח!</h3>
          <p className="max-w-[260px] text-[13px] leading-snug md:max-w-[380px] md:text-[16px] lg:max-w-[calc(var(--u)*22)] lg:text-[calc(var(--u)*1.042)]">
            {mistakes === 0
              ? "בכל הסיבובים נשארת מאחורי הקו של 2 השניות. נהג אלוף!"
              : "הצלחת בכל הסיבובים! זכור: מגיעים למקום שבו עמד הרכב שלפניך רק 2 שניות אחריו."}
          </p>
          <PanelButton onClick={start}>לנסוע שוב</PanelButton>
        </Panel>
      )}

      <span className="sr-only" aria-live="polite">
        {phase === "driving" ? `סיבוב ${round + 1} מתוך ${ROUNDS.length}: ${ROUNDS[round].name}` : ""}
      </span>
    </div>
  );
}

function HoldButton({
  icon,
  active,
  onHold,
  children,
}: {
  icon: string;
  active: boolean;
  onHold: (down: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onLostPointerCapture={() => onHold(false)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onHold(true);
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") onHold(false);
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "flex touch-none items-center gap-1.5 rounded-full bg-card py-1.5 pe-3 ps-1.5 text-[14px] text-foreground shadow-[0_4px_12px_hsl(var(--mist)/0.5)] transition-[background-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:gap-2 md:pe-4 md:text-[18px] lg:gap-[calc(var(--u)*0.521)] lg:py-[calc(var(--u)*0.417)] lg:pe-[calc(var(--u)*1.042)] lg:ps-[calc(var(--u)*0.417)] lg:text-[calc(var(--u)*1.25)] lg:shadow-[0_calc(var(--u)*0.208)_calc(var(--u)*0.625)_hsl(var(--mist)/0.5)]",
        active ? "scale-95 bg-brand-sun/60" : "hover:scale-105",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-full bg-brand-sun text-[15px] md:size-9 md:text-[19px] lg:size-[calc(var(--u)*2.083)] lg:text-[calc(var(--u)*1.146)]"
      >
        {icon}
      </span>
      {children}
    </button>
  );
}
