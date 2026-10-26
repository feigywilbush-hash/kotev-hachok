import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "../icons";
import { playChoice, playFail, playSuccess, playWin, setDriveMuted, setEngine, startDriveMusic, stopDriveMusic } from "./driveSounds";

const MUTE_KEY = "kotev-drive-muted";

/*
 * Driving game for the "אין כניסה" law: the car drives down a road toward a series of
 * junctions. At each one the player picks a turn, and must not pick the street that has a
 * red no-entry sign. The road is drawn on a canvas in simple perspective; the controls and
 * messages are regular buttons on top of it.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 */

type Dir = "left" | "straight" | "right";
type Junction = { options: Dir[]; forbidden: Dir; parking?: Dir };
type Phase = "ready" | "driving" | "waiting" | "wrong" | "turning" | "done";

/** The route: one junction per entry, in order. Parking signs are harmless decoys. */
const ROUTE: Junction[] = [
  { options: ["left", "right"], forbidden: "right" },
  { options: ["left", "right"], forbidden: "left", parking: "right" },
  { options: ["left", "straight", "right"], forbidden: "straight" },
  { options: ["left", "straight", "right"], forbidden: "right", parking: "left" },
  { options: ["left", "straight"], forbidden: "left" },
  { options: ["straight", "right"], forbidden: "straight", parking: "right" },
];

const CAR_SRC = "./assets/car-back.webp";
const CAR_RATIO = 744 / 649;
const LABEL: Record<Dir, string> = { right: "ימינה", straight: "ישר", left: "שמאלה" };
const PRAISE = ["כל הכבוד!", "יופי של נהיגה!", "בחירה נכונה!", "מצוין!"];

// World units. The camera sits CAM above the road; the bottom edge of the canvas is Z0 away.
const RW = 2.1; // road half width (three lanes)
const BAND = 3.2; // depth of the crossing road
const CAM = 1;
const Z0 = 1.6;
const FAR = 70;
const STOP_Z = 4.2; // where the junction sits when the car waits at it
const SPEED = 12;
const SHOW_CHOICES_Z = 48;
const HORIZON = 0.24; // share of the height above the horizon

const COLORS = {
  skyTop: "#e7ecef",
  haze: "#fafbfb",
  groundNear: "#dde3e6",
  road: "#6c7075",
  line: "#f3f4f5",
  sign: "#d92b2b",
  parking: "#1f5fbf",
  pole: "#9aa3a8",
};

type Sim = {
  time: number;
  dist: number;
  speed: number;
  /** Distance to the near edge of the current junction, or null on an open road. */
  zJ: number | null;
  junction: Junction | null;
  /** True once the car has gone straight through the current junction. */
  passed: boolean;
  completed: number;
  choice: Dir | null;
  turn: { dir: -1 | 1; t: number; swapped: boolean } | null;
  shake: number;
  pulse: number;
  doneIn: number | null;
  mistakes: number;
};

const freshSim = (): Sim => ({
  time: 0,
  dist: 0,
  speed: 0,
  zJ: 34,
  junction: ROUTE[0],
  passed: false,
  completed: 0,
  choice: null,
  turn: null,
  shake: 0,
  pulse: 0,
  doneIn: null,
  mistakes: 0,
});

/** Fine grain on the asphalt that streams past to sell the speed. */
const STREAKS = Array.from({ length: 70 }, (_, i) => {
  const r = (n: number) => {
    const v = Math.sin((i + 1) * 9301 + n * 49297) * 233280;
    return v - Math.floor(v);
  };
  return { x: -RW + 0.2 + r(1) * (RW * 2 - 0.4), p: r(2) * 40, len: 0.5 + r(3) * 2, light: r(4) > 0.5, a: 0.04 + r(5) * 0.07 };
});

const ease = (u: number) => u * u * (3 - 2 * u);

export function NoEntryDriveGame({
  onComplete,
  onScore,
  className,
}: {
  onComplete?: () => void;
  /** Called with the junction's index each time the car takes a correct turn there. */
  onScore?: (junction: number) => void;
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
  const [choice, setChoice] = useState<Dir | null>(null);
  const [showChoices, setShowChoices] = useState(false);
  const [junction, setJunction] = useState<Junction | null>(ROUTE[0]);
  const [completed, setCompleted] = useState(0);
  const [mistakes, setMistakes] = useState(0);
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

  // Music stops when the game leaves the page (e.g. moving to another step).
  useEffect(() => () => stopDriveMusic(), []);

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const start = useCallback(() => {
    simRef.current = freshSim();
    setChoice(null);
    setJunction(ROUTE[0]);
    setCompleted(0);
    setMistakes(0);
    setToast(null);
    startDriveMusic();
    setPhase("driving");
  }, [setPhase]);

  const wrong = useCallback(() => {
    const sim = simRef.current;
    sim.mistakes += 1;
    sim.shake = reducedMotion.current ? 0 : 0.45;
    sim.pulse = 0;
    sim.speed = 0;
    setMistakes(sim.mistakes);
    playFail();
    setPhase("wrong");
  }, [setPhase]);

  const retry = useCallback(() => {
    simRef.current.choice = null;
    setChoice(null);
    setPhase("waiting");
  }, [setPhase]);

  const choose = useCallback(
    (d: Dir) => {
      const sim = simRef.current;
      const j = sim.junction;
      if (!j || sim.passed || !j.options.includes(d)) return;
      playChoice();
      if (phaseRef.current === "driving") {
        sim.choice = d;
        setChoice(d);
      } else if (phaseRef.current === "waiting") {
        sim.choice = d;
        setChoice(d);
        if (d === j.forbidden) wrong();
        else setPhase("driving");
      }
    },
    [setPhase, wrong],
  );

  // Arrow keys while the game is on screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!visibleRef.current) return;
      const d: Dir | undefined = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "straight" }[e.key] as Dir | undefined;
      if (!d || (phaseRef.current !== "driving" && phaseRef.current !== "waiting")) return;
      e.preventDefault();
      choose(d);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose]);

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

    let lastShow = false;
    const praise = (sim: Sim) => {
      sim.completed += 1;
      setCompleted(sim.completed);
      setToast({ id: sim.completed, text: PRAISE[(sim.completed - 1) % PRAISE.length] });
      onScoreRef.current?.(sim.completed - 1);
      playSuccess();
    };
    const nextJunction = (sim: Sim) => {
      sim.passed = false;
      sim.choice = null;
      setChoice(null);
      if (sim.completed < ROUTE.length) {
        sim.junction = ROUTE[sim.completed];
        sim.zJ = FAR;
      } else {
        sim.junction = null;
        sim.zJ = null;
        sim.doneIn = 1.1;
      }
      setJunction(sim.junction);
    };

    const update = (dt: number) => {
      const sim = simRef.current;
      const phase = phaseRef.current;
      sim.time += dt;
      sim.pulse += dt;
      sim.shake = Math.max(0, sim.shake - dt);

      // Speed: cruise, or brake smoothly to a stop at the junction when there is no safe choice yet.
      const j = sim.junction;
      const braking = phase === "driving" && sim.zJ !== null && j && !sim.passed && (!sim.choice || sim.choice === j.forbidden);
      const cruise = phase === "driving" || phase === "turning" ? SPEED : 0;
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

      if (phase === "driving" && sim.zJ !== null && j && !sim.passed && sim.zJ <= STOP_Z + 0.04) {
        if (!sim.choice || sim.choice === j.forbidden) {
          sim.zJ = Math.max(sim.zJ, STOP_Z);
          sim.speed = 0;
          if (sim.choice) wrong();
          else setPhase("waiting");
        } else if (sim.choice === "straight") {
          sim.passed = true;
          praise(sim);
        } else {
          sim.turn = { dir: sim.choice === "left" ? -1 : 1, t: 0, swapped: false };
          praise(sim);
          setPhase("turning");
        }
      }

      // Went straight: once the junction is behind the car, bring on the next one.
      if (sim.passed && sim.zJ !== null && sim.zJ + BAND < 0.5) nextJunction(sim);

      if (sim.turn) {
        sim.turn.t += dt / 1.2;
        if (sim.turn.t >= 0.5 && !sim.turn.swapped) {
          sim.turn.swapped = true;
          nextJunction(sim);
        }
        if (sim.turn.t >= 1) {
          sim.turn = null;
          if (phaseRef.current === "turning") setPhase("driving");
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

      const show =
        (phaseRef.current === "driving" && sim.zJ !== null && !sim.passed && sim.zJ < SHOW_CHOICES_Z) ||
        phaseRef.current === "waiting";
      if (show !== lastShow) {
        lastShow = show;
        setShowChoices(show);
      }
    };

    const draw = () => {
      const sim = simRef.current;
      const hy = H * HORIZON;
      const s = ((H - hy) * Z0) / CAM;

      let off = 0;
      let carX = 0;
      let carRot = 0;
      let fog = 0;
      if (sim.turn) {
        const { dir, t } = sim.turn;
        const p = t < 0.5 ? ease(t / 0.5) : 1 - ease((t - 0.5) / 0.5);
        // First half: the old road slides away; second half: the new one slides in from the other side.
        off = (t < 0.5 ? -dir : dir) * W * 0.55 * p;
        carX = dir * W * 0.14 * p;
        carRot = dir * 0.2 * p;
        fog = Math.sin(Math.PI * t) * 0.92;
      }
      const shake = sim.shake > 0 ? (sim.shake / 0.45) * 6 : 0;
      const sx = shake ? (Math.random() - 0.5) * shake : 0;
      const sy = shake ? (Math.random() - 0.5) * shake * 0.5 : 0;

      const P = (x: number, z: number): [number, number] => [W / 2 + off + sx + (x * s) / z, hy + sy + (CAM * s) / z];
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

      const j = sim.junction;
      const zJ = sim.zJ;
      const has = (d: Dir) => !!j && j.options.includes(d);
      const ranges: [number, number][] =
        zJ === null ? [[0.6, FAR]] : [[0.6, zJ], ...(has("straight") ? ([[zJ + BAND, FAR]] as [number, number][]) : [])];
      const onRoad = (z: number) => zJ === null || z <= zJ + BAND || has("straight");

      // Road surface
      ranges.forEach(([a, b]) => along(0, a, b, RW * 2, COLORS.road));
      if (zJ !== null && zJ + BAND > 0.6) {
        const xa = has("left") ? -90 : -RW;
        const xb = has("right") ? 90 : RW;
        const z0 = Math.max(zJ, 0.6);
        poly([P(xa, z0), P(xb, z0), P(xb, zJ + BAND), P(xa, zJ + BAND)], COLORS.road);
      }

      // Asphalt grain
      STREAKS.forEach((k) => {
        const z = 0.8 + ((((k.p - sim.dist) % 40) + 40) % 40);
        if (!onRoad(z) || (zJ !== null && z > zJ && z < zJ + BAND)) return;
        along(k.x, z, z + k.len, 0.035, k.light ? `rgba(255,255,255,${k.a})` : `rgba(0,0,0,${k.a})`);
      });

      // Lane markings
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
        if (has("left")) {
          across(zJ + 0.1, -60, -RW, 0.1, COLORS.line);
          across(zJ + BAND - 0.1, -60, -RW, 0.1, COLORS.line);
          for (let x = -RW - 0.6; x > -60; x -= 3) across(mid, x - 1.5, x, 0.1, COLORS.line);
        }
        if (has("right")) {
          across(zJ + 0.1, RW, 60, 0.1, COLORS.line);
          across(zJ + BAND - 0.1, RW, 60, 0.1, COLORS.line);
          for (let x = RW + 0.6; x < 60; x += 3) across(mid, x, x + 1.5, 0.1, COLORS.line);
        }
        if (!has("straight")) across(zJ + BAND - 0.1, -RW, RW, 0.1, COLORS.line);
      }

      // Roadside posts and signs, far to near
      const items: { z: number; draw: () => void }[] = [];
      const postPhase = sim.dist % 7;
      for (let z = 7 - postPhase; z < 60; z += 7) {
        if (z < 1.2 || !onRoad(z)) continue;
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
      if (j && zJ !== null) {
        const spots: Record<Dir, [number, number]> = {
          left: [-(RW + 0.5), zJ + BAND + 0.3],
          right: [RW + 0.5, zJ + BAND + 0.3],
          straight: [0, zJ + BAND + 1.6],
        };
        j.options.forEach((d) => {
          const kind = d === j.forbidden ? "noentry" : d === j.parking ? "parking" : null;
          if (!kind) return;
          const [x, z] = spots[d];
          if (z < 1.2) return;
          const glow = kind === "noentry" && phaseRef.current === "wrong" ? 0.5 + 0.5 * Math.sin(sim.pulse * 7) : 0;
          items.push({ z, draw: () => drawSign(x, z, kind, glow) });
        });
      }
      function drawSign(x: number, z: number, kind: "noentry" | "parking", glow: number) {
        const [bx, by] = P(x, z);
        const k = s / z;
        const R = 0.4 * k;
        const cy = by - (0.4 + 0.4) * k; // short pole keeps the signs clear of the choice buttons
        ctx.fillStyle = COLORS.pole;
        ctx.fillRect(bx - 0.03 * k, cy, 0.06 * k, by - cy);
        ctx.save();
        if (glow) {
          ctx.shadowColor = `rgba(240,74,62,${0.4 + glow * 0.6})`;
          ctx.shadowBlur = R * (0.6 + glow * 1.4);
        }
        if (kind === "noentry") {
          ctx.beginPath();
          ctx.arc(bx, cy, R * (1 + glow * 0.08), 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(bx, cy, R * 0.9 * (1 + glow * 0.08), 0, Math.PI * 2);
          ctx.fillStyle = COLORS.sign;
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(bx - R * 0.62, cy - R * 0.17, R * 1.24, R * 0.34, R * 0.05);
          ctx.fill();
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(bx - R, cy - R, R * 2, R * 2, R * 0.25);
          ctx.fill();
          ctx.fillStyle = COLORS.parking;
          ctx.beginPath();
          ctx.roundRect(bx - R * 0.88, cy - R * 0.88, R * 1.76, R * 1.76, R * 0.18);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = `700 ${R * 1.5}px Polin, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("P", bx, cy + R * 0.08);
        }
        ctx.restore();
      }

      // Haze toward the horizon
      const haze = ctx.createLinearGradient(0, hy - 2, 0, hy + (H - hy) * 0.3);
      haze.addColorStop(0, "rgba(250,251,251,1)");
      haze.addColorStop(1, "rgba(250,251,251,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, hy - 2, W, (H - hy) * 0.3 + 2);

      // Posts and signs sit in front of the haze, fading in as they come out of it.
      items
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
      const cx = W / 2 + carX + sx;
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
      if (car.complete && car.naturalWidth) {
        ctx.save();
        ctx.translate(cx, bottom);
        ctx.rotate(carRot);
        ctx.drawImage(car, -cw / 2, -ch, cw, ch);
        ctx.restore();
      }

      // White-out while the car turns onto the next road
      if (fog > 0) {
        ctx.fillStyle = `rgba(250,251,251,${fog})`;
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
  }, [setPhase, wrong]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1300);
    return () => window.clearTimeout(t);
  }, [toast]);

  const order: Dir[] = ["right", "straight", "left"];

  return (
    <div ref={wrapRef} className={cn("relative size-full select-none overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="כביש עם צמתים ותמרורים, ורכב שנוסע בו"
        className="absolute inset-0 size-full"
      />

      {/* Progress: one dot per junction */}
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

      {/* Turn choice */}
      {showChoices && junction && phase !== "wrong" && (
        <div className="absolute inset-x-0 top-2 flex flex-col items-center gap-1.5 motion-safe:animate-fade-up md:top-4 md:gap-2 lg:top-[calc(var(--u)*1.042)] lg:gap-[calc(var(--u)*0.521)]">
          <p className="rounded-full bg-card/85 px-3 py-0.5 text-[13px] md:text-[16px] lg:px-[calc(var(--u)*0.833)] lg:py-[calc(var(--u)*0.156)] lg:text-[calc(var(--u)*1.042)]">
            לאן פונים?
          </p>
          <div className="flex gap-2 md:gap-3 lg:gap-[calc(var(--u)*0.729)]">
            {order
              .filter((d) => junction.options.includes(d))
              .map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => choose(d)}
                  aria-pressed={choice === d}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full py-1.5 pe-3 ps-1.5 text-[14px] shadow-[0_4px_12px_hsl(var(--mist)/0.5)] transition-[background-color,color,transform] duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 md:gap-2 md:pe-4 md:text-[18px] lg:gap-[calc(var(--u)*0.521)] lg:py-[calc(var(--u)*0.417)] lg:pe-[calc(var(--u)*1.042)] lg:ps-[calc(var(--u)*0.417)] lg:text-[calc(var(--u)*1.25)] lg:shadow-[0_calc(var(--u)*0.208)_calc(var(--u)*0.625)_hsl(var(--mist)/0.5)]",
                    choice === d ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full md:size-9 lg:size-[calc(var(--u)*2.083)]",
                      choice === d ? "bg-card text-primary" : "bg-brand-sun text-foreground",
                    )}
                  >
                    <ArrowLeftIcon
                      className={cn(
                        "size-4 md:size-5 lg:size-[calc(var(--u)*1.042)]",
                        d === "right" && "rotate-180",
                        d === "straight" && "rotate-90",
                      )}
                    />
                  </span>
                  {LABEL[d]}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Praise after a good turn */}
      {toast && (
        <p
          key={toast.id}
          role="status"
          className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[15px] font-bold text-primary-foreground shadow-lg motion-safe:animate-fade-up md:top-5 md:text-[18px] lg:top-[calc(var(--u)*1.25)] lg:px-[calc(var(--u)*1.25)] lg:py-[calc(var(--u)*0.313)] lg:text-[calc(var(--u)*1.25)]"
        >
          {toast.text}
        </p>
      )}

      {phase === "ready" && (
        <Panel>
          <h3 className="text-[18px] font-bold md:text-[26px] lg:text-[calc(var(--u)*1.667)]">בוא נצא לנסיעה!</h3>
          <p className="max-w-[260px] text-[13px] leading-snug md:max-w-[380px] md:text-[16px] lg:max-w-[calc(var(--u)*22)] lg:text-[calc(var(--u)*1.042)]">
            בכל צומת בחר לאן לפנות, ושים לב לא להיכנס לרחוב עם תמרור אין כניסה.
          </p>
          <PanelButton onClick={start}>יוצאים לדרך</PanelButton>
        </Panel>
      )}

      {phase === "wrong" && (
        <Panel tone="alert">
          <NoEntryBadge />
          <h3 className="text-[18px] font-bold text-alert md:text-[26px] lg:text-[calc(var(--u)*1.667)]">עצור!</h3>
          <p className="max-w-[260px] text-[13px] leading-snug md:max-w-[380px] md:text-[16px] lg:max-w-[calc(var(--u)*22)] lg:text-[calc(var(--u)*1.042)]">
            בפנייה הזאת יש תמרור אין כניסה, אסור להיכנס לשם. בחר דרך אחרת.
          </p>
          <PanelButton onClick={retry}>לבחור שוב</PanelButton>
        </Panel>
      )}

      {phase === "done" && (
        <Panel>
          <h3 className="text-[18px] font-bold md:text-[26px] lg:text-[calc(var(--u)*1.667)]">🏁 הגעת ליעד!</h3>
          <p className="max-w-[260px] text-[13px] leading-snug md:max-w-[380px] md:text-[16px] lg:max-w-[calc(var(--u)*22)] lg:text-[calc(var(--u)*1.042)]">
            {mistakes === 0
              ? "עברת את כל הצמתים ולא נכנסת אף פעם לאין כניסה. נהג אלוף!"
              : `עברת את כל הצמתים! ${mistakes === 1 ? "פעם אחת" : `${mistakes} פעמים`} כמעט נכנסת לאין כניסה, בפעם הבאה שים לב לתמרורים.`}
          </p>
          <PanelButton onClick={start}>לנסוע שוב</PanelButton>
        </Panel>
      )}
    </div>
  );
}

export function Panel({ children, tone }: { children: ReactNode; tone?: "alert" }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/40 p-3 backdrop-blur-[2px]">
      <div
        className={cn(
          "flex flex-col items-center gap-2 rounded-[24px] bg-card px-5 py-4 text-center shadow-[0_8px_24px_hsl(var(--mist)/0.6)] motion-safe:animate-fade-in-scale md:gap-3 md:rounded-[32px] md:px-8 md:py-6 lg:gap-[calc(var(--u)*0.729)] lg:rounded-[calc(var(--u)*2.083)] lg:px-[calc(var(--u)*2.5)] lg:py-[calc(var(--u)*1.667)] lg:shadow-[0_calc(var(--u)*0.417)_calc(var(--u)*1.25)_hsl(var(--mist)/0.6)]",
          tone === "alert" && "ring-2 ring-alert/30",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function PanelButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group mt-1 flex items-center gap-2 rounded-full bg-brand-sun py-1.5 pe-1.5 ps-4 text-[15px] transition-[filter,transform] duration-200 hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] md:gap-3 md:ps-5 md:text-[18px] lg:gap-[calc(var(--u)*0.729)] lg:py-[calc(var(--u)*0.417)] lg:pe-[calc(var(--u)*0.417)] lg:ps-[calc(var(--u)*1.25)] lg:text-[calc(var(--u)*1.25)]"
    >
      {children}
      <span className="flex size-8 items-center justify-center rounded-full bg-card md:size-10 lg:size-[calc(var(--u)*2.292)]">
        <ArrowLeftIcon className="size-4 text-primary transition-transform duration-300 ease-out motion-safe:group-hover:-translate-x-0.5 md:size-5 lg:size-[calc(var(--u)*1.042)]" />
      </span>
    </button>
  );
}

function NoEntryBadge() {
  return (
    <span
      aria-hidden="true"
      className="flex size-12 items-center justify-center rounded-full border-[3px] border-card bg-alert shadow-[0_0_0_2px_hsl(var(--alert)/0.25)] motion-safe:animate-bob md:size-16 lg:size-[calc(var(--u)*3.333)] lg:border-[calc(var(--u)*0.156)]"
    >
      <span className="h-[18%] w-[64%] rounded-[2px] bg-card" />
    </span>
  );
}
