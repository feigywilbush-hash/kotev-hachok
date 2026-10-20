/*
 * A small, dependency-free confetti burst in the site's colours. It draws on a temporary
 * full-screen canvas that ignores the pointer and removes itself when the pieces have fallen.
 * Skipped entirely when the user prefers reduced motion.
 */

/** Design tokens from index.css the pieces are painted with. */
const COLOR_TOKENS = ["--primary", "--brand-sun", "--foreground", "--plate", "--lime", "--progress-track"];

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  spin: number;
  wobble: number;
  color: string;
  round: boolean;
};

function siteColors() {
  const css = getComputedStyle(document.documentElement);
  return COLOR_TOKENS.map((t) => css.getPropertyValue(t).trim())
    .filter(Boolean)
    .map((hsl) => `hsl(${hsl})`);
}

/** Bursts confetti upwards from a point (viewport px), e.g. the centre of the button that was pressed. */
export function burstConfetti(origin?: { x: number; y: number }) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "100" });
  document.body.appendChild(canvas);
  ctx.scale(dpr, dpr);

  const colors = siteColors();
  const ox = origin?.x ?? w / 2;
  const oy = origin?.y ?? h * 0.8;
  const unit = Math.min(w, h) / 900; // keeps the burst in proportion on small and large screens
  const pieces: Piece[] = Array.from({ length: 110 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const speed = (9 + Math.random() * 10) * Math.max(unit, 0.6);
    return {
      x: ox + (Math.random() - 0.5) * 60,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: (7 + Math.random() * 7) * Math.max(unit, 0.7),
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)] ?? "#EC6F59",
      round: Math.random() < 0.3,
    };
  });

  const start = performance.now();
  const DURATION = 2600;
  const frame = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = t > DURATION - 600 ? Math.max(0, (DURATION - t) / 600) : 1;
    for (const p of pieces) {
      p.vy += 0.32 * Math.max(unit, 0.6); // gravity
      p.vx *= 0.985; // air
      p.vy *= 0.985;
      p.wobble += 0.12;
      p.x += p.vx + Math.sin(p.wobble) * 0.8;
      p.y += p.vy;
      p.rot += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // A flat strip that flips as it falls.
        ctx.fillRect(-p.size / 2, (-p.size / 4) * Math.abs(Math.cos(p.wobble)), p.size, (p.size / 2) * Math.abs(Math.cos(p.wobble)) + 1);
      }
      ctx.restore();
    }
    if (t < DURATION) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
