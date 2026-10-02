// Long dictations are recorded in segments that are transcribed one by one while the user
// keeps talking. Reasons for the numbers (measured against gpt-4o-transcribe):
//  - The model writes at most ~2000 tokens per request (~7600 characters, ~8 min of speech)
//    and cuts the text silently beyond that. A 5 min segment stays well below.
//  - A 5 min segment is ~4-5 MB (Server limit: 10 MB) and transcribes in ~11 s, inside the
//    30 s the Static Web App allows for a request.

export const SEGMENT_TARGET_MS = 4.5 * 60 * 1000;
export const SEGMENT_MAX_MS = 5 * 60 * 1000;
/** Silence needed to cut between two words rather than through one. */
export const PAUSE_MS = 500;
/** Level (RMS, 0..1) under which the microphone counts as silent. */
export const SILENCE_RMS = 0.01;

export interface SegmentTiming {
  targetMs: number;
  maxMs: number;
  pauseMs: number;
}

export const DEFAULT_SEGMENT_TIMING: SegmentTiming = {
  targetMs: SEGMENT_TARGET_MS,
  maxMs: SEGMENT_MAX_MS,
  pauseMs: PAUSE_MS
};

/**
 * From the target length on, cut at the first pause. At the maximum length, cut anyway:
 * a noisy room may never be silent, and a cut mid-word beats a truncated transcription.
 * `silentForMs` is null when the level cannot be measured: then only the maximum applies.
 */
export function shouldCutSegment(segmentMs: number, silentForMs: number | null, timing: SegmentTiming = DEFAULT_SEGMENT_TIMING): boolean {
  if (segmentMs >= timing.maxMs) return true;
  return silentForMs !== null && segmentMs >= timing.targetMs && silentForMs >= timing.pauseMs;
}

/** Tells for how long the signal has been below the silence level. */
export class SilenceTracker {
  private silentSince: number | null = null;

  constructor(private readonly threshold: number = SILENCE_RMS) {}

  push(rms: number, now: number): void {
    if (rms >= this.threshold) {
      this.silentSince = null;
    } else if (this.silentSince === null) {
      this.silentSince = now;
    }
  }

  silentForMs(now: number): number {
    return this.silentSince === null ? 0 : now - this.silentSince;
  }

  reset(): void {
    this.silentSince = null;
  }
}

/** Reads the loudness of a microphone stream. Without Web Audio it simply reports nothing. */
export class AudioLevelMeter {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private samples: Float32Array<ArrayBuffer> | null = null;

  constructor(stream: MediaStream) {
    const Context = typeof window === 'undefined' ? undefined : window.AudioContext || (window as any).webkitAudioContext;
    if (!Context) return;
    try {
      this.context = new Context();
      void this.context.resume();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      // Not connected to the destination: the user must not hear themselves.
      this.context.createMediaStreamSource(stream).connect(this.analyser);
      this.samples = new Float32Array(this.analyser.fftSize);
    } catch {
      this.close();
    }
  }

  /** Current RMS level, or null while it cannot be measured (no Web Audio, or the context is suspended). */
  rms(): number | null {
    if (!this.context || !this.analyser || !this.samples || this.context.state !== 'running') return null;
    this.analyser.getFloatTimeDomainData(this.samples);
    let sum = 0;
    for (const sample of this.samples) sum += sample * sample;
    return Math.sqrt(sum / this.samples.length);
  }

  close(): void {
    void this.context?.close().catch(() => undefined);
    this.context = null;
    this.analyser = null;
    this.samples = null;
  }
}
