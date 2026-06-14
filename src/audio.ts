type Voice = {
  osc: OscillatorNode;
  gain: GainNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
};

const SCALES: Record<string, number[]> = {
  warm: [196, 261.63, 329.63, 392, 523.25, 659.25],
  cool: [220, 277.18, 329.63, 369.99, 440, 554.37],
  dark: [146.83, 174.61, 220, 261.63, 329.63, 392],
  bright: [261.63, 329.63, 392, 523.25, 659.25, 783.99],
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let filter: BiquadFilterNode | null = null;
let voices: Voice[] = [];
let currentScale: keyof typeof SCALES = 'cool';

const TARGET_VOLUME = 0.32;

function buildVoices(audio: AudioContext, dest: AudioNode, freqs: number[]) {
  const made: Voice[] = [];
  for (const f of freqs) {
    const osc = audio.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;

    const gain = audio.createGain();
    gain.gain.value = 0.07;

    const lfo = audio.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.04 + Math.random() * 0.08;

    const lfoGain = audio.createGain();
    lfoGain.gain.value = 6;

    lfo.connect(lfoGain).connect(osc.detune);
    osc.connect(gain).connect(dest);

    osc.start();
    lfo.start();
    made.push({ osc, gain, lfo, lfoGain });
  }
  return made;
}

export async function startAudio(scale: keyof typeof SCALES = 'cool') {
  if (ctx) return;
  const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  ctx = new Ctor();
  await ctx.resume();
  currentScale = scale;

  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1300;
  filter.Q.value = 0.6;
  filter.connect(master);

  voices = buildVoices(ctx, filter, SCALES[scale]);
  master.gain.linearRampToValueAtTime(TARGET_VOLUME, ctx.currentTime + 2.5);
}

export function stopAudio() {
  if (!ctx || !master) return;
  const audio = ctx;
  const m = master;
  const vs = voices;
  m.gain.cancelScheduledValues(audio.currentTime);
  m.gain.linearRampToValueAtTime(0, audio.currentTime + 1.2);
  setTimeout(() => {
    for (const v of vs) {
      try { v.osc.stop(); v.lfo.stop(); } catch {}
    }
    audio.close().catch(() => {});
  }, 1400);
  ctx = null;
  master = null;
  filter = null;
  voices = [];
}

export function setAudioScale(scale: keyof typeof SCALES) {
  if (!ctx || !filter || !master || scale === currentScale) return;
  const audio = ctx;
  const oldVoices = voices;
  for (const v of oldVoices) {
    v.gain.gain.cancelScheduledValues(audio.currentTime);
    v.gain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.8);
    setTimeout(() => { try { v.osc.stop(); v.lfo.stop(); } catch {} }, 1000);
  }
  voices = buildVoices(audio, filter, SCALES[scale]);
  for (const v of voices) {
    v.gain.gain.value = 0;
    v.gain.gain.linearRampToValueAtTime(0.07, audio.currentTime + 1.2);
  }
  currentScale = scale;
}

export function isAudioOn() {
  return !!ctx;
}

export const SCENE_TO_SCALE: Record<string, keyof typeof SCALES> = {
  bubbles: 'warm', petals: 'warm', stardust: 'cool', liquid: 'warm',
  threads: 'cool', confetti: 'bright', plasma: 'bright', crystal: 'cool',
  aurora: 'cool', fireworks: 'bright', mandala: 'warm', ripple: 'cool',
  neuron: 'dark', comet: 'cool', honeycomb: 'warm', spiro: 'bright',
  galaxy: 'dark', rain: 'cool', butterfly: 'warm', circuit: 'dark',
  ink: 'dark', vortex: 'dark', forest: 'warm', stipple: 'bright',
  lightning: 'dark', solar: 'warm', interference: 'cool', ice: 'cool',
  peacock: 'bright', checker: 'bright', snowflake: 'cool', dna: 'cool',
  constellation: 'dark', dandelion: 'warm', iris: 'cool', web: 'dark',
};
