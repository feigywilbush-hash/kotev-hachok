/*
 * Tiny synthesized sounds for the knocking activity (no audio files).
 * Each call creates its nodes on a shared AudioContext, which starts on the first click.
 */

let ctx: AudioContext | null = null;
const audio = () => {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
};

/** A knock on a wooden door: a light double "tok-tok" with small knuckles, or a heavy fist bang. */
export function playKnock(strength: "soft" | "hard") {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  if (strength === "soft") {
    // Two light knuckle taps: very short, bright clicks with a little hollow wood ring, no low thump.
    tap(ac, t, 0.32);
    tap(ac, t + 0.15, 0.24);
    return;
  }

  const len = 0.16;
  const noise = ac.createBuffer(1, Math.ceil(ac.sampleRate * len), ac.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
  const src = ac.createBufferSource();
  src.buffer = noise;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 520;
  filter.Q.value = 1.2;
  const g = ac.createGain();
  g.gain.value = 1.6;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t);

  const thump = ac.createOscillator();
  thump.type = "sine";
  thump.frequency.setValueAtTime(140, t);
  thump.frequency.exponentialRampToValueAtTime(60, t + len);
  const tg = ac.createGain();
  tg.gain.setValueAtTime(0.9, t);
  tg.gain.exponentialRampToValueAtTime(0.001, t + len + 0.05);
  thump.connect(tg).connect(ac.destination);
  thump.start(t);
  thump.stop(t + len + 0.06);
}

/** One small knuckle tap on wood. */
function tap(ac: AudioContext, at: number, vol: number) {
  const len = 0.03;
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * len), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 4;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1900;
  filter.Q.value = 2.5;
  const g = ac.createGain();
  g.gain.value = vol;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(at);

  // The door's short hollow ring.
  const ring = ac.createOscillator();
  ring.type = "sine";
  ring.frequency.setValueAtTime(520, at);
  ring.frequency.exponentialRampToValueAtTime(430, at + 0.07);
  const rg = ac.createGain();
  rg.gain.setValueAtTime(vol * 0.35, at);
  rg.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
  ring.connect(rg).connect(ac.destination);
  ring.start(at);
  ring.stop(at + 0.09);
}

/** Ding-dong. */
export function playBell() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [
    [880, 0],
    [698.5, 0.38],
  ].forEach(([freq, at]) => {
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t + at);
    g.gain.exponentialRampToValueAtTime(0.3, t + at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + at + 0.9);
    o.connect(g).connect(ac.destination);
    o.start(t + at);
    o.stop(t + at + 0.95);
  });
}
