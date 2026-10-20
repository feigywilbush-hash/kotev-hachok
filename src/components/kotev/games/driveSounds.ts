/*
 * Gentle sounds for the driving game, synthesised with WebAudio (no audio files):
 *  - a soft looping tune and a quiet engine hum while driving,
 *  - a short chime for a good turn, a soft "uh-oh" for a no-entry, and a little tune at the finish.
 * Everything goes through one master gain so the game's mute button silences it all at once.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

let musicTimer: number | null = null;
let musicGain: GainNode | null = null;
let engine: { osc: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** A single soft note: sine/triangle with a quick attack and a gentle fade. */
function note(freq: number, at: number, dur: number, vol: number, type: OscillatorType = "sine", dest?: AudioNode) {
  const ac = audio();
  if (!ac || !master) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(dest ?? master);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export function setDriveMuted(value: boolean) {
  muted = value;
  if (ctx && master) master.gain.setTargetAtTime(value ? 0 : 1, ctx.currentTime, 0.05);
}

/* A relaxed C-major pentatonic loop: soft bass notes and a light melody, about 104 bpm. */
const BEAT = 60 / 104 / 2; // eighth notes
const MELODY = [72, null, 76, 79, 76, null, 74, null, 72, null, 69, 72, 74, null, null, null, 76, null, 79, 81, 79, null, 76, null, 74, null, 72, 74, 72, null, null, null];
const BASS = [48, 43, 45, 43]; // one per bar of 8 eighths: C, G, A, G

export function startDriveMusic() {
  const ac = audio();
  if (!ac || !master || musicTimer !== null) return;
  musicGain = ac.createGain();
  musicGain.gain.setValueAtTime(0.0001, ac.currentTime);
  musicGain.gain.exponentialRampToValueAtTime(1, ac.currentTime + 1.2);
  musicGain.connect(master);

  let step = 0;
  let next = ac.currentTime + 0.1;
  // Schedule a little ahead of time so the loop stays steady even when the tab is busy.
  const tick = () => {
    if (!ctx || !musicGain) return;
    while (next < ctx.currentTime + 0.3) {
      const m = MELODY[step % MELODY.length];
      if (m !== null) note(hz(m), next, BEAT * 1.8, 0.035, "triangle", musicGain);
      if (step % 8 === 0) note(hz(BASS[(step / 8) % BASS.length]), next, BEAT * 7, 0.05, "sine", musicGain);
      step += 1;
      next += BEAT;
    }
  };
  tick();
  musicTimer = window.setInterval(tick, 100);

  // Engine: a low, filtered hum whose pitch follows the car's speed (see setEngine).
  const osc = ac.createOscillator();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = 45;
  filter.type = "lowpass";
  filter.frequency.value = 220;
  gain.gain.value = 0;
  osc.connect(filter).connect(gain).connect(master);
  osc.start();
  engine = { osc, gain, filter };
}

/** 0 = stopped, 1 = cruising. */
export function setEngine(level: number) {
  if (!ctx || !engine) return;
  const t = ctx.currentTime;
  engine.osc.frequency.setTargetAtTime(42 + level * 26, t, 0.15);
  engine.filter.frequency.setTargetAtTime(180 + level * 160, t, 0.15);
  engine.gain.gain.setTargetAtTime(0.006 + level * 0.016, t, 0.2);
}

export function stopDriveMusic() {
  if (musicTimer !== null) window.clearInterval(musicTimer);
  musicTimer = null;
  if (ctx && musicGain) {
    const g = musicGain;
    g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
    window.setTimeout(() => g.disconnect(), 1500);
  }
  musicGain = null;
  if (ctx && engine) {
    const e = engine;
    e.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    e.osc.stop(ctx.currentTime + 1);
  }
  engine = null;
}

/** Soft tick when a direction is picked. */
export function playChoice() {
  const ac = audio();
  if (!ac) return;
  note(hz(84), ac.currentTime, 0.12, 0.05, "sine");
}

/** Happy little chime for a correct turn. */
export function playSuccess() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [76, 79, 84].forEach((m, i) => note(hz(m), t + i * 0.08, 0.45, 0.07, "sine"));
}

/** Gentle descending "uh-oh" for trying a no-entry street. */
export function playFail() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  note(hz(67), t, 0.25, 0.08, "triangle");
  note(hz(62), t + 0.2, 0.45, 0.08, "triangle");
}

/** A short cheerful tune at the finish. */
export function playWin() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [72, 76, 79, 84, 79, 84].forEach((m, i) => note(hz(m), t + i * 0.11, i === 5 ? 0.9 : 0.3, 0.07, "triangle"));
}
