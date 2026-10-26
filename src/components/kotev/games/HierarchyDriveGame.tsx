import { useCallback, useEffect, useRef, useState } from "react";

import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { Panel, PanelButton } from "./NoEntryDriveGame";
import { playChoice, playFail, playSuccess, playWin, setDriveMuted, setEngine, startDriveMusic, stopDriveMusic } from "./driveSounds";

const MUTE_KEY = "kotev-drive-muted";

/*
 * Driving game for the "הבנת היררכיות" law: the car drives down the same road as the no-entry
 * game and stops at a series of crossroads. Each one has some of: a police officer, a traffic
 * light, a sign. The player picks whom to listen to, by the order of authority: the officer
 * first, then the light, then the sign. The car then does what that one says.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 */

type Who = "officer" | "light" | "sign";
type Command = "stop" | "go";
type Crossing = { officer?: Command; light?: "red" | "green"; sign?: Command };
type Phase = "ready" | "driving" | "asking" | "wrong" | "holding" | "done";

/** The route, in order. Whoever is highest in the order decides, even when the others disagree. */
const ROUTE: Crossing[] = [
  { sign: "stop" },
  { light: "green", sign: "stop" },
  { officer: "stop", light: "green" },
  { light: "red", sign: "go" },
  { officer: "go", light: "red", sign: "stop" },
  { officer: "stop", sign: "go" },
];

const ORDER: Who[] = ["officer", "light", "sign"];
const NAME: Record<Who, string> = { officer: "שוטר", light: "רמזור", sign: "תמרור" };
const ICON: Record<Who, string> = { officer: "👮", light: "🚦", sign: "🛑" };

const top = (c: Crossing): Who => ORDER.find((w) => c[w] !== undefined)!;
const commandOf = (c: Crossing): Command => {
  const w = top(c);
  return w === "light" ? (c.light === "red" ? "stop" : "go") : c[w]!;
};
const PRAISE: Record<Who, Record<Command, string>> = {
  officer: { stop: "נכון! השוטר מסמן לעצור", go: "נכון! השוטר מסמן לנסוע" },
  light: { stop: "נכון! הרמזור אדום, עוצרים", go: "נכון! הרמזור ירוק, נוסעים" },
  sign: { stop: "נכון! תמרור עצור, עוצרים", go: "נכון! התמרור מראה לנסוע ישר" },
};

const CAR_SRC = "./assets/car-back.webp";
const CAR_RATIO = 744 / 649;

// World units, as in the no-entry game. The camera sits CAM above the road; the bottom edge of the canvas is Z0 away.
const RW = 2.1;
const BAND = 3.2;
const CAM = 1;
const Z0 = 1.6;
const FAR = 70;
const STOP_Z = 4.2;
const SPEED = 12;
const HORIZON = 0.24;
const HOLD = 1.6; // seconds the car waits at a "stop" before it may go on

const COLORS = {
  skyTop: "#e7ecef",
  haze: "#fafbfb",
  groundNear: "#dde3e6",
  road: "#6c7075",
  line: "#f3f4f5",
  sign: "#d92b2b",
  blue: "#1f5fbf",
  pole: "#9aa3a8",
  uniform: "#24345a",
  trousers: "#1b2540",
  skin: "#f0c7a0",
  gold: "#e3b448",
  red: "#ef3b33",
  green: "#2fc463",
  off: "#3a3d42",
};

type Sim = {
  time: number;
  dist: number;
  speed: number;
  zJ: number | null;
  crossing: Crossing | null;
  passed: boolean;
  /** True once a "stop" has been obeyed: the officer waves on and the light turns green. */
  cleared: boolean;
  hold: number;
  completed: number;
  shake: number;
  doneIn: number | null;
  mistakes: number;
};

const freshSim = (): Sim => ({
  time: 0,
  dist: 0,
  speed: 0,
  zJ: 34,
  crossing: ROUTE[0],
  passed: false,
  cleared: false,
  hold: 0,
  completed: 0,
  shake: 0,
  doneIn: null,
  mistakes: 0,
});

const STREAKS = Array.from({ length: 70 }, (_, i) => {
  const r = (n: number) => {
    const v = Math.sin((i + 1) * 9301 + n * 49297) * 233280;
    return v - Math.floor(v);
  };
  return { x: -RW + 0.2 + r(1) * (RW * 2 - 0.4), p: r(2) * 40, len: 0.5 + r(3) * 2, light: r(4) > 0.5, a: 0.04 + r(5) * 0.07 };
});

export function HierarchyDriveGame({
  onComplete,
  onScore,
  className,
}: {
  onComplete?: () => void;
  /** Called with the crossing's index each time the player listens to the right one there. */
  onScore?: (crossing: number) => void;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim>(freshSim());
  const phaseRef = useRef<Phase>("ready");
  const visibleRef = useRef(true);
  const reducedMotion = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;

  const [phase, setPhaseState] = useState<Phase>("ready");
  const [completed, setCompleted] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState("");
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

  const start = useCallback(() => {
    simRef.current = freshSim();
    setCompleted(0);
    setMistakes(0);
    setToast(null);
    startDriveMusic();
    setPhase("driving");
  }, [setPhase]);

  const answer = useCallback(
    (who: Who) => {
      const sim = simRef.current;
      const c = sim.crossing;
      if (phaseRef.current !== "asking" || !c) return;
      playChoice();
      const right = top(c);
      if (who !== right) {
        sim.mistakes += 1;
        sim.shake = reducedMotion.current ? 0 : 0.45;
        setMistakes(sim.mistakes);
        setHint(
          c[who] === undefined
            ? `בצומת הזה אין ${NAME[who]}. תסתכל טוב מי נמצא כאן.`
            : `ה${NAME[right]} גבוה יותר בהיררכיה מה${NAME[who]}, ולכן מקשיבים ל${NAME[right]}.`,
        );
        playFail();
        setPhase("wrong");
        return;
      }
      const cmd = commandOf(c);
      sim.completed += 1;
      setCompleted(sim.completed);
      setToast({ id: sim.completed, text: PRAISE[right][cmd] });
      onScoreRef.current?.(sim.completed - 1);
      playSuccess();
      if (cmd === "go") {
        sim.passed = true;
        setPhase("driving");
      } else {
        sim.hold = HOLD;
        setPhase("holding");
      }
    },
    [setPhase],
  );

  // Main loop: advance the simulation and draw.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    const car = new Image();
    car.src = CAR_SRC;
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    const nextCrossing = (sim: Sim) => {
      sim.passed = false;
      sim.cleared = false;
      if (sim.completed < ROUTE.length) {
        sim.crossing = ROUTE[sim.completed];
        sim.zJ = FAR;
      } else {
        sim.crossing = null;
        sim.zJ = null;
        sim.doneIn = 1.1;
      }
    };

    const update = (dt: number) => {
      const sim = simRef.current;
      const phase = phaseRef.current;
      sim.time += dt;
      sim.shake = Math.max(0, sim.shake - dt);

      // The car brakes to a stop at every crossing until the player has chosen whom to listen to.
      const braking = phase === "driving" && sim.zJ !== null && sim.crossing && !sim.passed;
      const cruise = phase === "driving" ? SPEED : 0;
      if (braking) {
        const limit = Math.max(0, (sim.zJ! - STOP_Z) * 2.2);
        sim.speed = Math.min(sim.speed + (cruise - sim.speed) * Math.min(1, dt * 1.5), limit);
      } else {
        sim.speed += (cruise - sim.speed) * Math.min(1, dt * (cruise > sim.speed ? 1.2 : 3));
      }
      setEngine(sim.speed / SPEED);

      const dz = sim.speed * dt;
      sim.dist += dz;
      if (sim.zJ !== null) sim.zJ -= dz;

      if (phase === "driving" && sim.zJ !== null && sim.crossing && !sim.passed && sim.zJ <= STOP_Z + 0.04) {
        sim.zJ = Math.max(sim.zJ, STOP_Z);
        sim.speed = 0;
        setPhase("asking");
      }

      if (phase === "holding") {
        sim.hold -= dt;
        if (sim.hold <= 0) {
          sim.cleared = true;
          sim.passed = true;
          setPhase("driving");
        }
      }

      if (sim.passed && sim.zJ !== null && sim.zJ + BAND < 0.5) nextCrossing(sim);

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
      const hy = H * HORIZON;
      const s = ((H - hy) * Z0) / CAM;
      const shake = sim.shake > 0 ? (sim.shake / 0.45) * 6 : 0;
      const sx = shake ? (Math.random() - 0.5) * shake : 0;
      const sy = shake ? (Math.random() - 0.5) * shake * 0.5 : 0;

      const P = (x: number, z: number): [number, number] => [W / 2 + sx + (x * s) / z, hy + sy + (CAM * s) / z];
      const poly = (pts: [number, number][], fill: string) => {
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
      };
      const along = (x: number, z0: number, z1: number, w: number, fill: string) => {
        z0 = Math.max(z0, 0.6);
        if (z1 <= z0) return;
        poly([P(x - w / 2, z0), P(x + w / 2, z0), P(x + w / 2, z1), P(x - w / 2, z1)], fill);
      };
      const across = (z: number, x0: number, x1: number, w: number, fill: string) => {
        if (z - w / 2 < 0.6) return;
        poly([P(x0, z - w / 2), P(x1, z - w / 2), P(x1, z + w / 2), P(x0, z + w / 2)], fill);
      };

      // Sky and ground
      const sky = ctx.createLinearGradient(0, 0, 0, hy);
      sky.addColorStop(0, COLORS.skyTop);
      sky.addColorStop(1, COLORS.haze);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, hy + 1);
      const ground = ctx.createLinearGradient(0, hy, 0, H);
      ground.addColorStop(0, COLORS.haze);
      ground.addColorStop(1, COLORS.groundNear);
      ctx.fillStyle = ground;
      ctx.fillRect(0, hy, W, H - hy);

      // Road: straight on, with a full crossroads at each crossing.
      const c = sim.crossing;
      const zJ = sim.zJ;
      along(0, 0.6, FAR, RW * 2, COLORS.road);
      if (zJ !== null && zJ + BAND > 0.6) {
        const z0 = Math.max(zJ, 0.6);
        poly([P(-90, z0), P(90, z0), P(90, zJ + BAND), P(-90, zJ + BAND)], COLORS.road);
      }

      STREAKS.forEach((k) => {
        const z = 0.8 + ((((k.p - sim.dist) % 40) + 40) % 40);
        if (zJ !== null && z > zJ && z < zJ + BAND) return;
        along(k.x, z, z + k.len, 0.035, k.light ? `rgba(255,255,255,${k.a})` : `rgba(0,0,0,${k.a})`);
      });

      const ranges: [number, number][] = zJ === null ? [[0.6, FAR]] : [[0.6, zJ], [zJ + BAND, FAR]];
      ranges.forEach(([a, b]) => {
        along(-(RW - 0.16), a, b, 0.12, COLORS.line);
        along(RW - 0.16, a, b, 0.12, COLORS.line);
        const phase = sim.dist % 4;
        for (let z = -phase; z < b; z += 4) {
          const z0 = Math.max(z, a);
          const z1 = Math.min(z + 1.8, b);
          if (z1 > z0) {
            along(-0.7, z0, z1, 0.1, COLORS.line);
            along(0.7, z0, z1, 0.1, COLORS.line);
          }
        }
      });
      if (zJ !== null) {
        across(zJ - 0.35, -RW + 0.16, RW - 0.16, 0.32, COLORS.line); // stop line
        const mid = zJ + BAND / 2;
        for (const side of [-1, 1]) {
          across(zJ + 0.1, side < 0 ? -60 : RW, side < 0 ? -RW : 60, 0.1, COLORS.line);
          across(zJ + BAND - 0.1, side < 0 ? -60 : RW, side < 0 ? -RW : 60, 0.1, COLORS.line);
          for (let x = RW + 0.6; x < 60; x += 3) across(mid, side < 0 ? -x - 1.5 : x, side < 0 ? -x : x + 1.5, 0.1, COLORS.line);
        }
      }

      // Roadside posts, the crossing's officer, light and sign; far to near.
      const items: { z: number; draw: () => void }[] = [];
      const postPhase = sim.dist % 7;
      for (let z = 7 - postPhase; z < 60; z += 7) {
        if (z < 1.2) continue;
        if (zJ !== null && z > zJ - 0.8 && z < zJ + BAND + 0.8) continue;
        for (const side of [-1, 1]) {
          items.push({
            z,
            draw: () => {
              const [bx, by] = P(side * (RW + 0.45), z);
              const k = s / z;
              ctx.fillStyle = "#fbfbfb";
              ctx.fillRect(bx - 0.05 * k, by - 0.55 * k, 0.1 * k, 0.55 * k);
              ctx.strokeStyle = "rgba(40,60,70,0.18)";
              ctx.lineWidth = Math.max(0.5, 0.012 * k);
              ctx.strokeRect(bx - 0.05 * k, by - 0.55 * k, 0.1 * k, 0.55 * k);
              ctx.fillStyle = "#f08a24";
              ctx.fillRect(bx - 0.05 * k, by - 0.5 * k, 0.1 * k, 0.1 * k);
            },
          });
        }
      }
      if (c && zJ !== null) {
        const far = zJ + BAND + 0.3;
        const cleared = sim.cleared;
        if (c.light) {
          const lit = cleared ? "green" : c.light;
          items.push({ z: far, draw: () => drawLight(-(RW + 0.5), far, lit) });
        }
        if (c.sign) {
          const kind = c.sign;
          items.push({ z: far, draw: () => drawSign(RW + 0.5, far, kind) });
        }
        if (c.officer) {
          const cmd: Command = cleared ? "go" : c.officer;
          const z = zJ + BAND * 0.6;
          items.push({ z, draw: () => drawOfficer(0, z, cmd) });
        }
      }

      function drawLight(x: number, z: number, lit: "red" | "green") {
        const [bx, by] = P(x, z);
        const k = s / z;
        ctx.fillStyle = COLORS.pole;
        ctx.fillRect(bx - 0.035 * k, by - 1.45 * k, 0.07 * k, 1.45 * k);
        ctx.fillStyle = "#24272b";
        ctx.beginPath();
        ctx.roundRect(bx - 0.15 * k, by - 2.05 * k, 0.3 * k, 0.66 * k, 0.06 * k);
        ctx.fill();
        const lamps: ["red" | "yellow" | "green", number][] = [
          ["red", 1.92],
          ["yellow", 1.72],
          ["green", 1.52],
        ];
        lamps.forEach(([color, h]) => {
          const on = color === lit;
          ctx.save();
          if (on) {
            ctx.shadowColor = color === "red" ? COLORS.red : COLORS.green;
            ctx.shadowBlur = 0.25 * k;
          }
          ctx.beginPath();
          ctx.arc(bx, by - h * k, 0.075 * k, 0, Math.PI * 2);
          ctx.fillStyle = on ? (color === "red" ? COLORS.red : COLORS.green) : COLORS.off;
          ctx.fill();
          ctx.restore();
        });
      }

      function drawSign(x: number, z: number, kind: Command) {
        const [bx, by] = P(x, z);
        const k = s / z;
        const R = 0.4 * k;
        const cy = by - 0.8 * k;
        ctx.fillStyle = COLORS.pole;
        ctx.fillRect(bx - 0.03 * k, cy, 0.06 * k, by - cy);
        if (kind === "stop") {
          const oct = (r: number) => {
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
              const a = Math.PI / 8 + (i * Math.PI) / 4;
              const px = bx + r * Math.cos(a);
              const py = cy + r * Math.sin(a);
              if (i) ctx.lineTo(px, py);
              else ctx.moveTo(px, py);
            }
            ctx.closePath();
          };
          oct(R);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          oct(R * 0.88);
          ctx.fillStyle = COLORS.sign;
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = `700 ${R * 0.62}px Polin, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("עצור", bx, cy + R * 0.04);
        } else {
          ctx.beginPath();
          ctx.arc(bx, cy, R, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(bx, cy, R * 0.88, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.blue;
          ctx.fill();
          // White arrow pointing ahead
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(bx, cy - R * 0.62);
          ctx.lineTo(bx + R * 0.42, cy - R * 0.12);
          ctx.lineTo(bx + R * 0.14, cy - R * 0.12);
          ctx.lineTo(bx + R * 0.14, cy + R * 0.58);
          ctx.lineTo(bx - R * 0.14, cy + R * 0.58);
          ctx.lineTo(bx - R * 0.14, cy - R * 0.12);
          ctx.lineTo(bx - R * 0.42, cy - R * 0.12);
          ctx.closePath();
          ctx.fill();
        }
      }

      function drawOfficer(x: number, z: number, cmd: Command) {
        const [bx, by] = P(x, z);
        const k = s / z;
        // Legs and shoes
        ctx.fillStyle = COLORS.trousers;
        ctx.fillRect(bx - 0.13 * k, by - 0.56 * k, 0.11 * k, 0.53 * k);
        ctx.fillRect(bx + 0.02 * k, by - 0.56 * k, 0.11 * k, 0.53 * k);
        ctx.fillStyle = "#111418";
        ctx.fillRect(bx - 0.15 * k, by - 0.05 * k, 0.14 * k, 0.05 * k);
        ctx.fillRect(bx + 0.01 * k, by - 0.05 * k, 0.14 * k, 0.05 * k);
        // Arms: one at the side; the other raised (stop) or waving the cars on (go)
        ctx.strokeStyle = COLORS.uniform;
        ctx.lineCap = "round";
        ctx.lineWidth = 0.08 * k;
        const glove = (gx: number, gy: number) => {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.055 * k, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        };
        ctx.beginPath();
        ctx.moveTo(bx - 0.17 * k, by - 0.95 * k);
        ctx.lineTo(bx - 0.21 * k, by - 0.58 * k);
        ctx.stroke();
        let hand: [number, number];
        if (cmd === "stop") {
          hand = [bx + 0.27 * k, by - 1.42 * k];
        } else {
          const wave = Math.sin(sim.time * 6) * 0.12;
          hand = [bx + 0.56 * k, by - (0.98 + wave) * k];
        }
        ctx.beginPath();
        ctx.moveTo(bx + 0.17 * k, by - 0.95 * k);
        ctx.lineTo(hand[0], hand[1]);
        ctx.stroke();
        // Torso, belt and badge
        ctx.fillStyle = COLORS.uniform;
        ctx.beginPath();
        ctx.roundRect(bx - 0.18 * k, by - 1.02 * k, 0.36 * k, 0.5 * k, 0.06 * k);
        ctx.fill();
        ctx.fillStyle = "#111418";
        ctx.fillRect(bx - 0.18 * k, by - 0.6 * k, 0.36 * k, 0.05 * k);
        ctx.fillStyle = COLORS.gold;
        ctx.beginPath();
        ctx.arc(bx - 0.08 * k, by - 0.88 * k, 0.03 * k, 0, Math.PI * 2);
        ctx.fill();
        glove(bx - 0.21 * k, by - 0.56 * k);
        glove(hand[0], hand[1]);
        // Head and cap
        ctx.fillStyle = COLORS.skin;
        ctx.beginPath();
        ctx.arc(bx, by - 1.13 * k, 0.1 * k, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.uniform;
        ctx.beginPath();
        ctx.roundRect(bx - 0.12 * k, by - 1.31 * k, 0.24 * k, 0.11 * k, 0.03 * k);
        ctx.fill();
        ctx.fillStyle = "#111418";
        ctx.fillRect(bx - 0.13 * k, by - 1.21 * k, 0.26 * k, 0.025 * k);
        ctx.fillStyle = COLORS.gold;
        ctx.beginPath();
        ctx.arc(bx, by - 1.26 * k, 0.025 * k, 0, Math.PI * 2);
        ctx.fill();
      }

      // Haze toward the horizon
      const haze = ctx.createLinearGradient(0, hy - 2, 0, hy + (H - hy) * 0.3);
      haze.addColorStop(0, "rgba(250,251,251,1)");
      haze.addColorStop(1, "rgba(250,251,251,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, hy - 2, W, (H - hy) * 0.3 + 2);

      // Anything at or behind the camera would draw with negative sizes, which the canvas rejects.
      items
        .filter((it) => it.z >= 1.2)
        .sort((a, b) => b.z - a.z)
        .forEach((it) => {
          ctx.globalAlpha = Math.min(1, Math.max(0, (42 - it.z) / 18));
          it.draw();
        });
      ctx.globalAlpha = 1;

      // Car and its shadow
      const cw = Math.min(W * 0.27, H * 0.37 * CAR_RATIO);
      const ch = cw / CAR_RATIO;
      const moving = sim.speed / SPEED;
      const bob = (Math.sin(sim.time * 23) * 0.5 + Math.sin(sim.time * 7) * 0.4) * moving;
      const cx = W / 2 + sx;
      const bottom = H * 0.985 + bob + sy;
      const shadow = ctx.createRadialGradient(cx, bottom - ch * 0.03, 0, cx, bottom - ch * 0.03, cw * 0.58);
      shadow.addColorStop(0, "rgba(20,25,30,0.35)");
      shadow.addColorStop(1, "rgba(20,25,30,0)");
      ctx.save();
      ctx.translate(cx, bottom - ch * 0.03);
      ctx.scale(1, 0.16);
      ctx.translate(-cx, -(bottom - ch * 0.03));
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.arc(cx, bottom - ch * 0.03, cw * 0.58, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (car.complete && car.naturalWidth) ctx.drawImage(car, cx - cw / 2, bottom - ch, cw, ch);
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
  }, [setPhase]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <div ref={wrapRef} className={cn("relative size-full select-none overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="כביש עם צמתים, ובהם שוטר, רמזור או תמרור, ורכב שנוסע בו"
        className="absolute inset-0 size-full"
      />

      {/* Progress: one dot per crossing */}
      {phase !== "ready" && (
        <div
          aria-label={`עברת ${completed} מתוך ${ROUTE.length} צמתים`}
          className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-card/85 px-2 py-1.5 shadow-sm md:bottom-4 md:right-4 md:gap-1.5 md:px-3 md:py-2 lg:bottom-[calc(var(--u)*1.042)] lg:right-[calc(var(--u)*1.042)] lg:gap-[calc(var(--u)*0.417)] lg:px-[calc(var(--u)*0.833)] lg:py-[calc(var(--u)*0.521)]"
        >
          {ROUTE.map((_, i) => (
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

      {/* Whom to listen to: in the bottom corner beside the car, so it hides nothing in the crossing */}
      {phase === "asking" && (
        <div className="absolute bottom-2 left-2 flex flex-col items-start gap-1.5 motion-safe:animate-fade-up md:bottom-4 md:left-4 md:gap-2 lg:bottom-[calc(var(--u)*1.042)] lg:left-[calc(var(--u)*1.042)] lg:gap-[calc(var(--u)*0.521)]">
          <p className="rounded-full bg-card/85 px-3 py-0.5 text-[13px] md:text-[16px] lg:px-[calc(var(--u)*0.833)] lg:py-[calc(var(--u)*0.156)] lg:text-[calc(var(--u)*1.042)]">
            למי מקשיבים בצומת הזה?
          </p>
          <div className="flex flex-col items-start gap-1.5 md:gap-2 lg:gap-[calc(var(--u)*0.521)]">
            {ORDER.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => answer(w)}
                className="flex items-center gap-1.5 rounded-full bg-card py-1.5 pe-3 ps-1.5 text-[14px] text-foreground shadow-[0_4px_12px_hsl(var(--mist)/0.5)] transition-[background-color,color,transform] duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 md:gap-2 md:pe-4 md:text-[18px] lg:gap-[calc(var(--u)*0.521)] lg:py-[calc(var(--u)*0.417)] lg:pe-[calc(var(--u)*1.042)] lg:ps-[calc(var(--u)*0.417)] lg:text-[calc(var(--u)*1.25)] lg:shadow-[0_calc(var(--u)*0.208)_calc(var(--u)*0.625)_hsl(var(--mist)/0.5)]"
              >
                <span
                  aria-hidden="true"
                  className="flex size-7 items-center justify-center rounded-full bg-brand-sun text-[15px] md:size-9 md:text-[19px] lg:size-[calc(var(--u)*2.083)] lg:text-[calc(var(--u)*1.146)]"
                >
                  {ICON[w]}
                </span>
                ל{NAME[w]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Praise after a right choice */}
      {toast && (
        <p
          key={toast.id}
          role="status"
          className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-4 py-1 text-[15px] font-bold text-primary-foreground shadow-lg motion-safe:animate-fade-up md:top-5 md:text-[18px] lg:top-[calc(var(--u)*1.25)] lg:px-[calc(var(--u)*1.25)] lg:py-[calc(var(--u)*0.313)] lg:text-[calc(var(--u)*1.25)]"
        >
          {toast.text}
        </p>
      )}

      {phase === "ready" && (
        <Panel>
          <h3 className="text-[18px] font-bold md:text-[26px] lg:text-[calc(var(--u)*1.667)]">בוא נצא לנסיעה!</h3>
          <p className="max-w-[260px] text-[13px] leading-snug md:max-w-[380px] md:text-[16px] lg:max-w-[calc(var(--u)*22)] lg:text-[calc(var(--u)*1.042)]">
            בכל צומת בחר למי מקשיבים: קודם לשוטר, אם אין שוטר לרמזור, ואם אין רמזור לתמרור.
          </p>
          <PanelButton onClick={start}>יוצאים לדרך</PanelButton>
        </Panel>
      )}

      {phase === "wrong" && (
        <Panel tone="alert">
          <span aria-hidden="true" className="text-[34px] leading-none motion-safe:animate-bob md:text-[44px] lg:text-[calc(var(--u)*2.6)]">
            🤔
          </span>
          <h3 className="text-[18px] font-bold text-alert md:text-[26px] lg:text-[calc(var(--u)*1.667)]">רגע!</h3>
          <p className="max-w-[260px] text-[13px] leading-snug md:max-w-[380px] md:text-[16px] lg:max-w-[calc(var(--u)*22)] lg:text-[calc(var(--u)*1.042)]">
            {hint}
          </p>
          <PanelButton onClick={() => setPhase("asking")}>לבחור שוב</PanelButton>
        </Panel>
      )}

      {phase === "done" && (
        <Panel>
          <h3 className="text-[18px] font-bold md:text-[26px] lg:text-[calc(var(--u)*1.667)]">🏁 הגעת ליעד!</h3>
          <p className="max-w-[260px] text-[13px] leading-snug md:max-w-[380px] md:text-[16px] lg:max-w-[calc(var(--u)*22)] lg:text-[calc(var(--u)*1.042)]">
            {mistakes === 0
              ? "בכל הצמתים הקשבת למי שצריך: שוטר, רמזור ותמרור. נהג אלוף!"
              : `עברת את כל הצמתים! ${mistakes === 1 ? "פעם אחת" : `${mistakes} פעמים`} התבלבלת, זכור: קודם שוטר, אחר כך רמזור ואחר כך תמרור.`}
          </p>
          <PanelButton onClick={start}>לנסוע שוב</PanelButton>
        </Panel>
      )}
    </div>
  );
}
