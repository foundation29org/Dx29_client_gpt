import { Inject, Injectable, NgZone, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EmptyError, Subject, firstValueFrom, takeUntil } from 'rxjs';
import { environment } from 'environments/environment';
import { UuidService } from './uuid.service';
import { AudioLevelMeter, SilenceTracker, shouldCutSegment } from './dictation-segmenter';

// Codes map to i18n keys under "voice.errors.*".
export type DictationErrorCode = 'not-supported' | 'permission-denied' | 'no-microphone' | 'no-speech' | 'network' | 'service-unavailable' | 'unknown';

export class DictationError extends Error {
  constructor(public readonly code: DictationErrorCode) {
    super(code);
  }
}

// Recordings are transcribed in segments (see dictation-segmenter.ts), so this is a product
// choice and not a technical limit: the longest consultation we want to capture.
export const MAX_RECORDING_MS = 30 * 60 * 1000;
const MIN_RECORDING_MS = 600;

// How often to look for a pause when a segment is due to be cut.
const WATCH_INTERVAL_MS = 100;
// A segment that fails to transcribe is retried: losing minutes of a consultation is not acceptable.
const MAX_UPLOAD_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// First supported wins: Chrome/Edge/Firefox/Opera record WebM or Ogg, Safari records MP4.
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

/** One piece of the recording, with the recorder that fills it. */
interface Segment {
  recorder: MediaRecorder;
  chunks: Blob[];
  startedAt: number;
}

/**
 * Records the microphone and transcribes it on the Server (gpt-4o-transcribe),
 * which detects the spoken language itself. Same path in every browser.
 *
 * Long recordings are cut in segments at a pause and each one is sent while the user keeps
 * talking, so that stopping only waits for the last one. A dictation shorter than a segment
 * is a single upload, exactly as before.
 */
@Injectable({
  providedIn: 'root'
})
export class VoiceDictationService {
  private readonly isBrowser: boolean;
  private stream: MediaStream | null = null;
  private current: Segment | null = null;
  private starting = false;
  private startedAt = 0;
  private languageHint: string | undefined;
  /** Transcriptions of the closed segments, in recording order. */
  private transcriptions: Promise<string>[] = [];
  private meter: AudioLevelMeter | null = null;
  private silence = new SilenceTracker();
  private watcher: ReturnType<typeof setInterval> | null = null;
  private cancelled$ = new Subject<void>();
  /** Changes on every cancel: work queued before it must not reach the Server. */
  private generation = 0;

  constructor(
    private http: HttpClient,
    private uuidService: UuidService,
    private zone: NgZone,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  isSupported(): boolean {
    return this.isBrowser && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  }

  /**
   * Starts recording. `languageHint` (ISO-639-1) steers language detection; speech in another
   * language is still transcribed as spoken.
   */
  async start(languageHint?: string): Promise<void> {
    if (!this.isSupported()) throw new DictationError('not-supported');
    if (this.current || this.starting) return;

    this.starting = true;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (error: any) {
      throw new DictationError(
        error?.name === 'NotAllowedError' || error?.name === 'SecurityError' ? 'permission-denied'
        : error?.name === 'NotFoundError' || error?.name === 'NotReadableError' ? 'no-microphone'
        : 'unknown'
      );
    } finally {
      this.starting = false;
    }

    // A second start() may have won the race while the permission prompt was open.
    if (this.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    this.stream = stream;
    this.languageHint = languageHint;
    this.transcriptions = [];
    this.meter = new AudioLevelMeter(stream);
    this.silence.reset();
    this.current = this.beginSegment(stream);
    this.startedAt = this.current.startedAt;
    this.startWatcher();
  }

  /** Stops recording and resolves with the transcribed text. */
  async stop(): Promise<string> {
    const durationMs = Date.now() - this.startedAt;
    const last = this.current;
    this.current = null;
    this.stopWatcher();
    const audio = last ? await this.closeSegment(last) : null;
    const lastMs = last ? Date.now() - last.startedAt : 0;
    this.releaseMicrophone();

    const hasEarlierSegments = this.transcriptions.length > 0;
    if (!hasEarlierSegments && (!audio?.size || durationMs < MIN_RECORDING_MS)) {
      this.discardPending();
      throw new DictationError('no-speech');
    }
    // A closing sliver after a cut (a few ms) is not worth a request.
    if (audio?.size && (!hasEarlierSegments || lastMs >= MIN_RECORDING_MS)) {
      this.queueTranscription(Promise.resolve(audio));
    }

    const transcriptions = this.transcriptions;
    this.transcriptions = [];
    const texts = await Promise.all(transcriptions);
    const text = texts.filter(Boolean).join(' ').trim();
    if (!text) throw new DictationError('no-speech');
    return text;
  }

  /** Stops recording and discards the audio, including what is still being transcribed. */
  cancel(): void {
    const segment = this.current;
    this.current = null;
    this.stopWatcher();
    this.discardPending();
    if (segment) void this.closeSegment(segment);
    this.releaseMicrophone();
  }

  private beginSegment(stream: MediaStream): Segment {
    const mimeType = MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.start(1000);
    return { recorder, chunks, startedAt: Date.now() };
  }

  private closeSegment(segment: Segment): Promise<Blob> {
    const { recorder, chunks } = segment;
    return new Promise((resolve) => {
      const collect = () => resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
      if (recorder.state === 'inactive') {
        collect();
      } else {
        recorder.onstop = collect;
        recorder.stop();
      }
    });
  }

  // Ticks outside Angular's zone: a 100 ms timer would otherwise trigger change detection of the whole app.
  private startWatcher(): void {
    this.zone.runOutsideAngular(() => {
      this.watcher = setInterval(() => this.cutSegmentIfDue(), WATCH_INTERVAL_MS);
    });
  }

  private stopWatcher(): void {
    if (this.watcher) clearInterval(this.watcher);
    this.watcher = null;
    this.meter?.close();
    this.meter = null;
  }

  private cutSegmentIfDue(): void {
    const segment = this.current;
    if (!segment || !this.stream) return;

    const now = Date.now();
    const level = this.meter?.rms() ?? null;
    if (level !== null) this.silence.push(level, now);
    const silentForMs = level === null ? null : this.silence.silentForMs(now);
    if (!shouldCutSegment(now - segment.startedAt, silentForMs)) return;

    // The next recorder starts before the old one stops: nothing said in between is lost.
    this.current = this.beginSegment(this.stream);
    this.silence.reset();
    // Queued right away, before the old recorder has finished: stop() must find it even if called now.
    this.queueTranscription(this.closeSegment(segment));
  }

  private queueTranscription(audio: Promise<Blob>): void {
    const generation = this.generation;
    const transcription = audio.then((blob) => (blob.size ? this.transcribe(blob, generation) : ''));
    // The outcome is read in stop(); this only keeps a failure from being reported as unhandled before then.
    transcription.catch(() => undefined);
    this.transcriptions.push(transcription);
  }

  private async transcribe(audio: Blob, generation: number): Promise<string> {
    for (let attempt = 1; ; attempt++) {
      // cancel() was called in the meantime (also while waiting to retry): do not upload discarded audio.
      if (generation !== this.generation) throw new DictationError('unknown');
      try {
        return await this.upload(audio);
      } catch (error) {
        if (error instanceof EmptyError) throw new DictationError('unknown'); // cancelled mid-request
        const status = error instanceof HttpErrorResponse ? error.status : -1;
        const retryable = status === 0 || status === 429 || status >= 500;
        if (!retryable || attempt >= MAX_UPLOAD_ATTEMPTS) {
          throw new DictationError(status === 0 ? 'network' : 'service-unavailable');
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }

  private async upload(audio: Blob): Promise<string> {
    const form = new FormData();
    if (this.languageHint) form.append('language', this.languageHint);
    form.append('myuuid', this.uuidService.getUuid());
    form.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    form.append('audio', audio, 'dictation');
    const response = await firstValueFrom(
      this.http.post<{ text: string }>(`${environment.api}/internal/speech/transcribe`, form).pipe(takeUntil(this.cancelled$))
    );
    return (response?.text || '').trim();
  }

  private discardPending(): void {
    this.generation++;
    this.cancelled$.next();
    this.transcriptions = [];
  }

  private releaseMicrophone(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}
