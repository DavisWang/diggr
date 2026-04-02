import { hashSeed, mulberry32 } from '../lib/random';
import { loadAudioEnabledPreference, persistAudioEnabledPreference } from '../lib/storage';

type WaveShape = 'sine' | 'triangle' | 'square' | 'saw';
type AudioLoopKey = 'drill' | 'thruster' | 'earthquake';

export type AudioCue =
  | 'toggle_on'
  | 'shop_open'
  | 'drill_start'
  | 'drill_break'
  | 'lava_burn'
  | 'ore_gain'
  | 'ore_treasure'
  | 'cargo_discard'
  | 'fall_impact'
  | 'sell_cargo'
  | 'buy_success_upgrade'
  | 'buy_success_consumable'
  | 'service'
  | 'save'
  | 'repair_use'
  | 'fuel_use'
  | 'explosive_small'
  | 'explosive_large'
  | 'teleport_use'
  | 'fissurizer_launch'
  | 'earthquake_start'
  | 'earthquake_settle'
  | 'game_over';

interface StereoTrack {
  sampleRate: number;
  length: number;
  left: Float32Array;
  right: Float32Array;
}

interface LoopHandle {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

const MASTER_VOLUME = 0.92;
const MUSIC_VOLUME = 0.18;
const SFX_VOLUME = 0.84;
const LOOP_TARGET_GAINS: Record<AudioLoopKey, number> = {
  drill: 0.075,
  thruster: 0.1,
  earthquake: 0.16,
};

const CUE_GAINS: Record<AudioCue, number> = {
  toggle_on: 0.68,
  shop_open: 0.55,
  drill_start: 0.34,
  drill_break: 0.56,
  lava_burn: 0.8,
  ore_gain: 0.72,
  ore_treasure: 0.84,
  cargo_discard: 0.56,
  fall_impact: 0.8,
  sell_cargo: 0.84,
  buy_success_upgrade: 0.76,
  buy_success_consumable: 0.72,
  service: 0.7,
  save: 0.66,
  repair_use: 0.68,
  fuel_use: 0.66,
  explosive_small: 0.82,
  explosive_large: 0.9,
  teleport_use: 0.74,
  fissurizer_launch: 0.84,
  earthquake_start: 0.86,
  earthquake_settle: 0.6,
  game_over: 0.84,
};

export class AudioManager {
  private enabled = loadAudioEnabledPreference();
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private readyPromise: Promise<void> | null = null;
  private cueBuffers = new Map<AudioCue, AudioBuffer>();
  private loopBuffers = new Map<AudioLoopKey, AudioBuffer>();
  private musicBuffer: AudioBuffer | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private activeLoops: Partial<Record<AudioLoopKey, LoopHandle>> = {};

  isEnabled(): boolean {
    return this.enabled;
  }

  toggleEnabled(): boolean {
    if (this.enabled) {
      this.enabled = false;
      persistAudioEnabledPreference(false);
      this.stopAllAudio();
      return false;
    }

    this.enabled = true;
    persistAudioEnabledPreference(true);
    void this.ensureReady().then(() => {
      this.syncMasterVolume();
      this.startMusic();
      this.playCueNow('toggle_on');
    });
    return true;
  }

  registerUserGesture(): void {
    if (!this.enabled) {
      return;
    }

    void this.ensureReady().then(() => {
      this.syncMasterVolume();
      this.startMusic();
    });
  }

  playCue(cue: AudioCue): void {
    if (!this.enabled) {
      return;
    }

    void this.ensureReady().then(() => {
      this.playCueNow(cue);
    });
  }

  setLoopActive(loop: AudioLoopKey, active: boolean): void {
    if (!active) {
      this.stopLoop(loop);
      return;
    }

    if (!this.enabled) {
      return;
    }

    void this.ensureReady().then(() => {
      this.startLoop(loop);
    });
  }

  dispose(): void {
    this.stopAllAudio();
    if (!this.context) {
      return;
    }

    const context = this.context;
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.readyPromise = null;
    this.cueBuffers.clear();
    this.loopBuffers.clear();
    this.musicBuffer = null;
    void context.close();
  }

  private async ensureReady(): Promise<void> {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = (async () => {
      const AudioContextCtor = resolveAudioContextCtor();
      if (!AudioContextCtor) {
        return;
      }

      if (!this.context) {
        const context = new AudioContextCtor();
        const masterGain = context.createGain();
        const musicGain = context.createGain();
        const sfxGain = context.createGain();

        masterGain.gain.value = 0;
        musicGain.gain.value = MUSIC_VOLUME;
        sfxGain.gain.value = SFX_VOLUME;

        musicGain.connect(masterGain);
        sfxGain.connect(masterGain);
        masterGain.connect(context.destination);

        this.context = context;
        this.masterGain = masterGain;
        this.musicGain = musicGain;
        this.sfxGain = sfxGain;
      }

      if (this.context?.state === 'suspended') {
        try {
          await this.context.resume();
        } catch {
          return;
        }
      }

      this.syncMasterVolume();
      if (this.enabled) {
        this.startMusic();
      }
    })();

    return this.readyPromise;
  }

  private syncMasterVolume(): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    const currentTime = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(currentTime);
    this.masterGain.gain.setTargetAtTime(this.enabled ? MASTER_VOLUME : 0, currentTime, 0.03);
  }

  private startMusic(): void {
    if (!this.context || !this.musicGain || this.musicSource || !this.enabled) {
      return;
    }

    if (!this.musicBuffer) {
      this.musicBuffer = createMainMusicBuffer(this.context);
    }

    const source = this.context.createBufferSource();
    source.buffer = this.musicBuffer;
    source.loop = true;
    source.connect(this.musicGain);
    source.start();
    this.musicSource = source;
  }

  private stopMusic(): void {
    if (!this.context || !this.musicSource) {
      return;
    }

    const source = this.musicSource;
    this.musicSource = null;
    try {
      source.stop(this.context.currentTime + 0.08);
    } catch {
      // Ignore stop races during teardown/toggle churn.
    }
    source.disconnect();
  }

  private startLoop(loop: AudioLoopKey): void {
    if (!this.context || !this.sfxGain || this.activeLoops[loop]) {
      return;
    }

    if (!this.loopBuffers.has(loop)) {
      this.loopBuffers.set(loop, createLoopBuffer(this.context, loop));
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    gain.gain.value = 0;
    source.buffer = this.loopBuffers.get(loop) ?? null;
    source.loop = true;
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
    gain.gain.setTargetAtTime(LOOP_TARGET_GAINS[loop], this.context.currentTime, 0.05);
    this.activeLoops[loop] = { source, gain };
  }

  private stopLoop(loop: AudioLoopKey): void {
    if (!this.context || !this.activeLoops[loop]) {
      return;
    }

    const active = this.activeLoops[loop] as LoopHandle;
    delete this.activeLoops[loop];

    active.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.03);
    try {
      active.source.stop(this.context.currentTime + 0.08);
    } catch {
      // Ignore stop races during rapid state changes.
    }
    active.source.disconnect();
    active.gain.disconnect();
  }

  private stopAllAudio(): void {
    (Object.keys(this.activeLoops) as AudioLoopKey[]).forEach((loop) => this.stopLoop(loop));
    this.stopMusic();

    if (!this.context || !this.masterGain) {
      return;
    }

    this.masterGain.gain.cancelScheduledValues(this.context.currentTime);
    this.masterGain.gain.setTargetAtTime(0, this.context.currentTime, 0.02);
  }

  private playCueNow(cue: AudioCue): void {
    if (!this.context || !this.sfxGain || !this.enabled) {
      return;
    }

    if (!this.cueBuffers.has(cue)) {
      this.cueBuffers.set(cue, createCueBuffer(this.context, cue));
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    gain.gain.value = CUE_GAINS[cue];
    source.buffer = this.cueBuffers.get(cue) ?? null;
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start();
  }
}

function resolveAudioContextCtor(): typeof AudioContext | null {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  const value = (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).AudioContext;
  if (value) {
    return value;
  }

  return (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null;
}

function createMainMusicBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 30);
  const beatSeconds = 60 / 96;
  const barRoots = [45, 45, 43, 43, 41, 41, 36, 36, 45, 43, 41, 36];
  const leadPatterns: Array<Array<number | null>> = [
    [57, null, 60, 62, 64, null, 62, 60],
    [57, 60, null, 64, 65, null, 64, 62],
    [55, null, 58, 60, 62, 60, null, 58],
    [52, null, 55, 57, 59, null, 57, 55],
  ];

  for (let beatIndex = 0; beatIndex < 48; beatIndex += 1) {
    const start = beatIndex * beatSeconds;
    const position = beatIndex % 4;

    if (position === 0 || position === 2) {
      mixKick(track, start, 0.72);
    }

    if (position === 1 || position === 3) {
      mixSnare(track, start, 0.34);
    }

    mixHat(track, start + beatSeconds * 0.5, 0.14);
    if (position === 3) {
      mixHat(track, start + beatSeconds * 0.78, 0.1);
    }
  }

  for (let barIndex = 0; barIndex < barRoots.length; barIndex += 1) {
    const barStart = barIndex * beatSeconds * 4;
    const root = barRoots[barIndex];
    const chord = minorChord(root + 12);
    const bassPattern = [root, root + 7, root + 12, root + 7];
    const leadPattern = leadPatterns[barIndex % leadPatterns.length];

    chord.forEach((midi, chordIndex) => {
      mixTone(track, {
        start: barStart,
        duration: beatSeconds * 3.5,
        frequency: midiToFrequency(midi),
        gain: 0.032,
        wave: chordIndex === 1 ? 'sine' : 'triangle',
        pan: chordIndex === 0 ? -0.22 : chordIndex === 2 ? 0.24 : 0,
        attack: 0.08,
        release: 0.42,
        vibratoDepth: 0.8,
        vibratoHz: 1.6,
      });
    });

    bassPattern.forEach((midi, beatOffset) => {
      const start = barStart + beatOffset * beatSeconds;
      mixTone(track, {
        start,
        duration: beatSeconds * 0.44,
        frequency: midiToFrequency(midi),
        gain: 0.11,
        wave: 'square',
        pan: -0.12,
        attack: 0.01,
        release: 0.1,
      });
      mixTone(track, {
        start,
        duration: beatSeconds * 0.56,
        frequency: midiToFrequency(midi - 12),
        gain: 0.04,
        wave: 'sine',
        pan: 0,
        attack: 0.005,
        release: 0.12,
      });
    });

    leadPattern.forEach((midi, step) => {
      if (midi === null) {
        return;
      }

      mixTone(track, {
        start: barStart + step * beatSeconds * 0.5,
        duration: beatSeconds * 0.26,
        frequency: midiToFrequency(midi),
        gain: 0.046,
        wave: 'square',
        pan: step % 2 === 0 ? 0.14 : -0.08,
        attack: 0.004,
        release: 0.08,
        vibratoDepth: 1.6,
        vibratoHz: 4.4,
      });
    });
  }

  applyLoFiFinish(track, 88, 4, 1.2);
  sealLoopEdges(track, 768);
  normalizeTrack(track, 0.76);
  return trackToBuffer(context, track);
}

function createLoopBuffer(context: AudioContext, loop: AudioLoopKey): AudioBuffer {
  switch (loop) {
    case 'drill':
      return createDrillLoopBuffer(context);
    case 'thruster':
      return createThrusterLoopBuffer(context);
    case 'earthquake':
      return createEarthquakeLoopBuffer(context);
    default:
      return createDrillLoopBuffer(context);
  }
}

function createCueBuffer(context: AudioContext, cue: AudioCue): AudioBuffer {
  switch (cue) {
    case 'toggle_on':
      return buildUiBleepBuffer(context, [560, 760], 'triangle', 0.07, 0.03);
    case 'shop_open':
      return buildUiBleepBuffer(context, [420, 520, 680], 'square', 0.05, 0.025);
    case 'drill_start':
      return buildDrillStartBuffer(context);
    case 'drill_break':
      return buildDrillBreakBuffer(context);
    case 'lava_burn':
      return buildLavaBurnBuffer(context);
    case 'ore_gain':
      return buildCoinBuffer(context, [720, 960]);
    case 'ore_treasure':
      return buildCoinBuffer(context, [820, 1100, 1460]);
    case 'cargo_discard':
      return buildDiscardBuffer(context);
    case 'fall_impact':
      return buildImpactBuffer(context, 0.42, 110, 38);
    case 'sell_cargo':
      return buildSellBuffer(context);
    case 'buy_success_upgrade':
      return buildUiBleepBuffer(context, [480, 680, 920], 'triangle', 0.06, 0.025);
    case 'buy_success_consumable':
      return buildUiBleepBuffer(context, [440, 620, 820], 'triangle', 0.055, 0.025);
    case 'service':
      return buildServiceBuffer(context);
    case 'save':
      return buildUiBleepBuffer(context, [700, 980, 1260], 'square', 0.04, 0.022);
    case 'repair_use':
      return buildUiBleepBuffer(context, [620, 920, 1280], 'triangle', 0.045, 0.02);
    case 'fuel_use':
      return buildFuelBuffer(context);
    case 'explosive_small':
      return buildExplosionBuffer(context, false);
    case 'explosive_large':
      return buildExplosionBuffer(context, true);
    case 'teleport_use':
      return buildWarpBuffer(context, false);
    case 'fissurizer_launch':
      return buildWarpBuffer(context, true);
    case 'earthquake_start':
      return buildEarthquakeStartBuffer(context);
    case 'earthquake_settle':
      return buildEarthquakeSettleBuffer(context);
    case 'game_over':
      return buildGameOverBuffer(context);
    default:
      return buildUiBleepBuffer(context, [440, 660], 'triangle', 0.05, 0.02);
  }
}

function createDrillLoopBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.88);
  for (let pulse = 0; pulse < 7; pulse += 1) {
    const start = pulse * 0.12;
    mixTone(track, {
      start,
      duration: 0.11,
      frequency: 98,
      endFrequency: 122,
      gain: 0.055,
      wave: 'triangle',
      pan: pulse % 2 === 0 ? -0.08 : 0.08,
      attack: 0.01,
      release: 0.04,
    });
    mixNoise(track, {
      start,
      duration: 0.07,
      gain: 0.045,
      pan: 0,
      attack: 0.002,
      release: 0.03,
      color: 0.26,
      seed: 1_200 + pulse,
    });
  }
  applyLoFiFinish(track, 84, 3, 1.1);
  sealLoopEdges(track, 384);
  normalizeTrack(track, 0.68);
  return trackToBuffer(context, track);
}

function createThrusterLoopBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.96);
  for (let pulse = 0; pulse < 6; pulse += 1) {
    const start = pulse * 0.16;
    mixTone(track, {
      start,
      duration: 0.16,
      frequency: 176,
      endFrequency: 214,
      gain: 0.05,
      wave: 'triangle',
      pan: pulse % 2 === 0 ? 0.1 : -0.1,
      attack: 0.01,
      release: 0.05,
    });
    mixNoise(track, {
      start,
      duration: 0.14,
      gain: 0.055,
      pan: 0,
      attack: 0.004,
      release: 0.05,
      color: 0.45,
      seed: 2_200 + pulse,
    });
  }
  applyLoFiFinish(track, 92, 3, 1.08);
  sealLoopEdges(track, 384);
  normalizeTrack(track, 0.64);
  return trackToBuffer(context, track);
}

function createEarthquakeLoopBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 1.6);
  mixTone(track, {
    start: 0,
    duration: 1.58,
    frequency: 38,
    endFrequency: 34,
    gain: 0.08,
    wave: 'sine',
    pan: -0.05,
    attack: 0.05,
    release: 0.2,
    vibratoDepth: 0.4,
    vibratoHz: 1.2,
  });
  mixTone(track, {
    start: 0,
    duration: 1.58,
    frequency: 57,
    endFrequency: 49,
    gain: 0.04,
    wave: 'triangle',
    pan: 0.08,
    attack: 0.04,
    release: 0.2,
    vibratoDepth: 0.7,
    vibratoHz: 0.9,
  });
  mixNoise(track, {
    start: 0,
    duration: 1.58,
    gain: 0.09,
    pan: 0,
    attack: 0.03,
    release: 0.18,
    color: 0.08,
    seed: 3_300,
  });
  applyLoFiFinish(track, 96, 5, 1.18);
  sealLoopEdges(track, 512);
  normalizeTrack(track, 0.72);
  return trackToBuffer(context, track);
}

function buildUiBleepBuffer(
  context: AudioContext,
  frequencies: number[],
  wave: WaveShape,
  noteDuration: number,
  gapDuration: number,
): AudioBuffer {
  const totalDuration = frequencies.length * noteDuration + Math.max(0, frequencies.length - 1) * gapDuration + 0.06;
  const track = createTrack(context.sampleRate, totalDuration);

  frequencies.forEach((frequency, index) => {
    mixTone(track, {
      start: index * (noteDuration + gapDuration),
      duration: noteDuration,
      frequency,
      gain: 0.18,
      wave,
      pan: index % 2 === 0 ? -0.08 : 0.08,
      attack: 0.004,
      release: 0.03,
    });
  });

  applyLoFiFinish(track, 96, 3, 1.05);
  normalizeTrack(track, 0.72);
  return trackToBuffer(context, track);
}

function buildCoinBuffer(context: AudioContext, frequencies: number[]): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.34);
  frequencies.forEach((frequency, index) => {
    mixTone(track, {
      start: index * 0.055,
      duration: 0.08,
      frequency,
      gain: 0.2,
      wave: 'triangle',
      pan: index % 2 === 0 ? -0.06 : 0.12,
      attack: 0.003,
      release: 0.05,
      vibratoDepth: 3,
      vibratoHz: 11,
    });
  });
  normalizeTrack(track, 0.76);
  return trackToBuffer(context, track);
}

function buildDrillStartBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.18);
  mixTone(track, {
    start: 0,
    duration: 0.11,
    frequency: 160,
    endFrequency: 108,
    gain: 0.11,
    wave: 'triangle',
    pan: -0.06,
    attack: 0.003,
    release: 0.05,
  });
  mixNoise(track, {
    start: 0.01,
    duration: 0.08,
    gain: 0.05,
    pan: 0.08,
    attack: 0.003,
    release: 0.04,
    color: 0.28,
    seed: 4_001,
  });
  normalizeTrack(track, 0.74);
  return trackToBuffer(context, track);
}

function buildDrillBreakBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.24);
  mixNoise(track, {
    start: 0,
    duration: 0.16,
    gain: 0.11,
    pan: 0,
    attack: 0.002,
    release: 0.07,
    color: 0.24,
    seed: 4_101,
  });
  mixTone(track, {
    start: 0,
    duration: 0.14,
    frequency: 142,
    endFrequency: 70,
    gain: 0.09,
    wave: 'triangle',
    pan: -0.08,
    attack: 0.003,
    release: 0.06,
  });
  normalizeTrack(track, 0.78);
  return trackToBuffer(context, track);
}

function buildDiscardBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.24);
  mixTone(track, {
    start: 0,
    duration: 0.09,
    frequency: 180,
    endFrequency: 120,
    gain: 0.12,
    wave: 'square',
    pan: -0.05,
    attack: 0.002,
    release: 0.04,
  });
  mixTone(track, {
    start: 0.06,
    duration: 0.11,
    frequency: 126,
    endFrequency: 86,
    gain: 0.1,
    wave: 'triangle',
    pan: 0.07,
    attack: 0.002,
    release: 0.05,
  });
  normalizeTrack(track, 0.72);
  return trackToBuffer(context, track);
}

function buildImpactBuffer(context: AudioContext, duration: number, startFrequency: number, endFrequency: number): AudioBuffer {
  const track = createTrack(context.sampleRate, duration);
  mixTone(track, {
    start: 0,
    duration: duration * 0.9,
    frequency: startFrequency,
    endFrequency,
    gain: 0.22,
    wave: 'sine',
    pan: 0,
    attack: 0.002,
    release: 0.16,
  });
  mixNoise(track, {
    start: 0,
    duration: duration * 0.5,
    gain: 0.12,
    pan: 0,
    attack: 0.002,
    release: 0.12,
    color: 0.14,
    seed: 4_201,
  });
  normalizeTrack(track, 0.8);
  return trackToBuffer(context, track);
}

function buildSellBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.42);
  [420, 560, 700, 860].forEach((frequency, index) => {
    mixTone(track, {
      start: index * 0.05,
      duration: 0.08,
      frequency,
      gain: 0.16,
      wave: 'triangle',
      pan: index % 2 === 0 ? -0.08 : 0.1,
      attack: 0.003,
      release: 0.05,
    });
  });
  mixNoise(track, {
    start: 0.02,
    duration: 0.12,
    gain: 0.05,
    pan: 0,
    attack: 0.002,
    release: 0.04,
    color: 0.35,
    seed: 4_401,
  });
  normalizeTrack(track, 0.8);
  return trackToBuffer(context, track);
}

function buildServiceBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.36);
  mixNoise(track, {
    start: 0,
    duration: 0.08,
    gain: 0.08,
    pan: -0.08,
    attack: 0.002,
    release: 0.03,
    color: 0.18,
    seed: 4_501,
  });
  [360, 480, 620].forEach((frequency, index) => {
    mixTone(track, {
      start: 0.08 + index * 0.05,
      duration: 0.08,
      frequency,
      gain: 0.14,
      wave: 'triangle',
      pan: index === 1 ? 0 : 0.08,
      attack: 0.003,
      release: 0.05,
    });
  });
  normalizeTrack(track, 0.76);
  return trackToBuffer(context, track);
}

function buildFuelBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.32);
  mixTone(track, {
    start: 0,
    duration: 0.2,
    frequency: 180,
    endFrequency: 360,
    gain: 0.16,
    wave: 'saw',
    pan: 0.08,
    attack: 0.004,
    release: 0.08,
  });
  mixNoise(track, {
    start: 0.01,
    duration: 0.11,
    gain: 0.05,
    pan: -0.05,
    attack: 0.003,
    release: 0.04,
    color: 0.24,
    seed: 4_601,
  });
  normalizeTrack(track, 0.76);
  return trackToBuffer(context, track);
}

function buildExplosionBuffer(context: AudioContext, large: boolean): AudioBuffer {
  const track = createTrack(context.sampleRate, large ? 0.74 : 0.52);
  mixNoise(track, {
    start: 0,
    duration: large ? 0.52 : 0.34,
    gain: large ? 0.22 : 0.18,
    pan: 0,
    attack: 0.002,
    release: large ? 0.22 : 0.14,
    color: 0.16,
    seed: large ? 4_702 : 4_701,
  });
  mixTone(track, {
    start: 0,
    duration: large ? 0.46 : 0.3,
    frequency: large ? 120 : 148,
    endFrequency: large ? 34 : 52,
    gain: large ? 0.22 : 0.18,
    wave: 'sine',
    pan: -0.08,
    attack: 0.003,
    release: large ? 0.18 : 0.12,
  });
  normalizeTrack(track, 0.84);
  return trackToBuffer(context, track);
}

function buildWarpBuffer(context: AudioContext, chaotic: boolean): AudioBuffer {
  const track = createTrack(context.sampleRate, chaotic ? 0.74 : 0.58);
  mixTone(track, {
    start: 0,
    duration: chaotic ? 0.52 : 0.4,
    frequency: chaotic ? 180 : 260,
    endFrequency: chaotic ? 920 : 760,
    gain: 0.16,
    wave: chaotic ? 'saw' : 'triangle',
    pan: -0.06,
    attack: 0.003,
    release: 0.08,
    vibratoDepth: chaotic ? 14 : 6,
    vibratoHz: chaotic ? 15 : 8,
  });
  mixTone(track, {
    start: chaotic ? 0.08 : 0.06,
    duration: chaotic ? 0.38 : 0.28,
    frequency: chaotic ? 360 : 520,
    endFrequency: chaotic ? 82 : 180,
    gain: 0.12,
    wave: 'sine',
    pan: 0.1,
    attack: 0.003,
    release: 0.08,
  });
  mixNoise(track, {
    start: 0.02,
    duration: chaotic ? 0.28 : 0.18,
    gain: chaotic ? 0.08 : 0.04,
    pan: 0,
    attack: 0.002,
    release: 0.05,
    color: chaotic ? 0.34 : 0.44,
    seed: chaotic ? 4_802 : 4_801,
  });
  normalizeTrack(track, 0.82);
  return trackToBuffer(context, track);
}

function buildEarthquakeStartBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.66);
  mixTone(track, {
    start: 0,
    duration: 0.44,
    frequency: 74,
    endFrequency: 32,
    gain: 0.2,
    wave: 'sine',
    pan: -0.06,
    attack: 0.003,
    release: 0.14,
  });
  mixNoise(track, {
    start: 0,
    duration: 0.42,
    gain: 0.18,
    pan: 0,
    attack: 0.002,
    release: 0.12,
    color: 0.1,
    seed: 4_901,
  });
  normalizeTrack(track, 0.84);
  return trackToBuffer(context, track);
}

function buildEarthquakeSettleBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.42);
  mixTone(track, {
    start: 0,
    duration: 0.32,
    frequency: 120,
    endFrequency: 62,
    gain: 0.14,
    wave: 'triangle',
    pan: 0,
    attack: 0.01,
    release: 0.12,
  });
  normalizeTrack(track, 0.72);
  return trackToBuffer(context, track);
}

function buildGameOverBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.74);
  [320, 246, 184].forEach((frequency, index) => {
    mixTone(track, {
      start: index * 0.15,
      duration: 0.24,
      frequency,
      gain: 0.16,
      wave: 'triangle',
      pan: index === 1 ? -0.05 : 0.05,
      attack: 0.004,
      release: 0.12,
    });
  });
  mixTone(track, {
    start: 0.42,
    duration: 0.18,
    frequency: 138,
    endFrequency: 82,
    gain: 0.12,
    wave: 'sine',
    pan: 0,
    attack: 0.004,
    release: 0.08,
  });
  normalizeTrack(track, 0.82);
  return trackToBuffer(context, track);
}

function buildLavaBurnBuffer(context: AudioContext): AudioBuffer {
  const track = createTrack(context.sampleRate, 0.52);
  mixNoise(track, {
    start: 0,
    duration: 0.38,
    gain: 0.16,
    pan: 0.06,
    attack: 0.002,
    release: 0.14,
    color: 0.62,
    seed: 5_001,
  });
  mixTone(track, {
    start: 0.01,
    duration: 0.34,
    frequency: 320,
    endFrequency: 140,
    gain: 0.14,
    wave: 'saw',
    pan: -0.08,
    attack: 0.003,
    release: 0.1,
    vibratoDepth: 6,
    vibratoHz: 5,
  });
  mixTone(track, {
    start: 0.02,
    duration: 0.28,
    frequency: 88,
    endFrequency: 52,
    gain: 0.09,
    wave: 'sine',
    pan: 0,
    attack: 0.005,
    release: 0.1,
  });
  normalizeTrack(track, 0.82);
  return trackToBuffer(context, track);
}

function createTrack(sampleRate: number, seconds: number): StereoTrack {
  const length = Math.max(1, Math.floor(sampleRate * seconds));
  return {
    sampleRate,
    length,
    left: new Float32Array(length),
    right: new Float32Array(length),
  };
}

function trackToBuffer(context: AudioContext, track: StereoTrack): AudioBuffer {
  const buffer = context.createBuffer(2, track.length, track.sampleRate);
  buffer.getChannelData(0).set(track.left);
  buffer.getChannelData(1).set(track.right);
  return buffer;
}

function mixTone(
  track: StereoTrack,
  options: {
    start: number;
    duration: number;
    frequency: number;
    endFrequency?: number;
    gain: number;
    wave: WaveShape;
    pan: number;
    attack: number;
    release: number;
    vibratoDepth?: number;
    vibratoHz?: number;
  },
): void {
  const startIndex = Math.max(0, Math.floor(options.start * track.sampleRate));
  const totalSamples = Math.max(1, Math.floor(options.duration * track.sampleRate));
  const attackSamples = Math.max(1, Math.floor(options.attack * track.sampleRate));
  const releaseSamples = Math.max(1, Math.floor(options.release * track.sampleRate));
  const endFrequency = options.endFrequency ?? options.frequency;
  const [leftPan, rightPan] = getPanGains(options.pan);
  let phase = 0;

  for (let index = 0; index < totalSamples; index += 1) {
    const sampleIndex = startIndex + index;
    if (sampleIndex >= track.length) {
      break;
    }

    const progress = totalSamples <= 1 ? 1 : index / (totalSamples - 1);
    const frequency = options.frequency + (endFrequency - options.frequency) * progress;
    const time = index / track.sampleRate;
    const vibratoOffset =
      options.vibratoDepth && options.vibratoHz
        ? Math.sin(Math.PI * 2 * options.vibratoHz * time) * options.vibratoDepth
        : 0;

    phase += (Math.PI * 2 * Math.max(1, frequency + vibratoOffset)) / track.sampleRate;

    const attackEnvelope = Math.min(1, index / attackSamples);
    const releaseEnvelope = Math.min(1, (totalSamples - index) / releaseSamples);
    const envelope = Math.max(0, Math.min(attackEnvelope, releaseEnvelope));
    const sample = sampleWave(options.wave, phase) * envelope * options.gain;

    track.left[sampleIndex] += sample * leftPan;
    track.right[sampleIndex] += sample * rightPan;
  }
}

function mixNoise(
  track: StereoTrack,
  options: {
    start: number;
    duration: number;
    gain: number;
    pan: number;
    attack: number;
    release: number;
    color: number;
    seed: number;
  },
): void {
  const startIndex = Math.max(0, Math.floor(options.start * track.sampleRate));
  const totalSamples = Math.max(1, Math.floor(options.duration * track.sampleRate));
  const attackSamples = Math.max(1, Math.floor(options.attack * track.sampleRate));
  const releaseSamples = Math.max(1, Math.floor(options.release * track.sampleRate));
  const [leftPan, rightPan] = getPanGains(options.pan);
  const random = mulberry32(hashSeed(options.seed, totalSamples));
  let filtered = 0;

  for (let index = 0; index < totalSamples; index += 1) {
    const sampleIndex = startIndex + index;
    if (sampleIndex >= track.length) {
      break;
    }

    const attackEnvelope = Math.min(1, index / attackSamples);
    const releaseEnvelope = Math.min(1, (totalSamples - index) / releaseSamples);
    const envelope = Math.max(0, Math.min(attackEnvelope, releaseEnvelope));
    const white = random() * 2 - 1;
    filtered += (white - filtered) * clamp01(options.color);
    const sample = filtered * envelope * options.gain;

    track.left[sampleIndex] += sample * leftPan;
    track.right[sampleIndex] += sample * rightPan;
  }
}

function mixKick(track: StereoTrack, start: number, gain: number): void {
  const duration = 0.22;
  const startIndex = Math.max(0, Math.floor(start * track.sampleRate));
  const totalSamples = Math.max(1, Math.floor(duration * track.sampleRate));
  let phase = 0;

  for (let index = 0; index < totalSamples; index += 1) {
    const sampleIndex = startIndex + index;
    if (sampleIndex >= track.length) {
      break;
    }

    const progress = totalSamples <= 1 ? 1 : index / (totalSamples - 1);
    const frequency = 110 * Math.pow(0.16, progress) + 34;
    phase += (Math.PI * 2 * frequency) / track.sampleRate;
    const envelope = Math.exp(-progress * 7.5);
    const sample = Math.sin(phase) * envelope * gain;
    track.left[sampleIndex] += sample;
    track.right[sampleIndex] += sample;
  }
}

function mixSnare(track: StereoTrack, start: number, gain: number): void {
  mixNoise(track, {
    start,
    duration: 0.16,
    gain,
    pan: 0,
    attack: 0.002,
    release: 0.07,
    color: 0.32,
    seed: 9_010,
  });
  mixTone(track, {
    start,
    duration: 0.1,
    frequency: 210,
    endFrequency: 160,
    gain: gain * 0.26,
    wave: 'triangle',
    pan: 0,
    attack: 0.002,
    release: 0.05,
  });
}

function mixHat(track: StereoTrack, start: number, gain: number): void {
  mixNoise(track, {
    start,
    duration: 0.06,
    gain,
    pan: 0.06,
    attack: 0.001,
    release: 0.02,
    color: 0.76,
    seed: 9_110 + Math.floor(start * 1000),
  });
}

function applyLoFiFinish(track: StereoTrack, bitLevels: number, sampleHold: number, drive: number): void {
  let heldLeft = 0;
  let heldRight = 0;

  for (let index = 0; index < track.length; index += 1) {
    if (index % Math.max(1, sampleHold) === 0) {
      heldLeft = Math.round(track.left[index] * bitLevels) / bitLevels;
      heldRight = Math.round(track.right[index] * bitLevels) / bitLevels;
    }

    track.left[index] = Math.tanh(heldLeft * drive);
    track.right[index] = Math.tanh(heldRight * drive);
  }
}

function normalizeTrack(track: StereoTrack, targetPeak: number): void {
  let peak = 0;
  for (let index = 0; index < track.length; index += 1) {
    peak = Math.max(peak, Math.abs(track.left[index]), Math.abs(track.right[index]));
  }

  if (peak <= 0) {
    return;
  }

  const scale = targetPeak / peak;
  for (let index = 0; index < track.length; index += 1) {
    track.left[index] *= scale;
    track.right[index] *= scale;
  }
}

function sealLoopEdges(track: StereoTrack, edgeSamples: number): void {
  const edge = Math.min(edgeSamples, Math.floor(track.length / 6));
  if (edge <= 0) {
    return;
  }

  for (let index = 0; index < edge; index += 1) {
    const blend = index / edge;
    const tailIndex = track.length - edge + index;
    const headLeft = track.left[index];
    const headRight = track.right[index];
    const tailLeft = track.left[tailIndex];
    const tailRight = track.right[tailIndex];

    track.left[index] = tailLeft * (1 - blend) + headLeft * blend;
    track.right[index] = tailRight * (1 - blend) + headRight * blend;
    track.left[tailIndex] = headLeft * (1 - blend) + tailLeft * blend;
    track.right[tailIndex] = headRight * (1 - blend) + tailRight * blend;
  }
}

function sampleWave(shape: WaveShape, phase: number): number {
  switch (shape) {
    case 'triangle':
      return (2 / Math.PI) * Math.asin(Math.sin(phase));
    case 'square':
      return Math.sin(phase) >= 0.2 ? 1 : -0.7;
    case 'saw': {
      const normalized = phase / (Math.PI * 2);
      return 2 * (normalized - Math.floor(normalized + 0.5));
    }
    case 'sine':
    default:
      return Math.sin(phase);
  }
}

function getPanGains(pan: number): [number, number] {
  const clamped = Math.max(-1, Math.min(1, pan));
  return [clamped <= 0 ? 1 : 1 - clamped, clamped >= 0 ? 1 : 1 + clamped];
}

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function minorChord(rootMidi: number): number[] {
  return [rootMidi, rootMidi + 3, rootMidi + 7];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
