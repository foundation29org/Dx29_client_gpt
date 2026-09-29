import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'environments/environment';

// Codes map to i18n keys under "voice.errors.*".
export type DictationErrorCode = 'not-supported' | 'permission-denied' | 'no-microphone' | 'no-speech' | 'network' | 'service-unavailable' | 'unknown';

export class DictationError extends Error {
  constructor(public readonly code: DictationErrorCode) {
    super(code);
  }
}

// Must stay below the Server upload limit (10 MB ≈ 10 min of Opus).
export const MAX_RECORDING_MS = 5 * 60 * 1000;
const MIN_RECORDING_MS = 600;

// First supported wins: Chrome/Edge/Firefox/Opera record WebM or Ogg, Safari records MP4.
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

/**
 * Records the microphone and transcribes it on the Server (gpt-4o-transcribe),
 * which detects the spoken language itself. Same path in every browser.
 */
@Injectable({
  providedIn: 'root'
})
export class VoiceDictationService {
  private readonly isBrowser: boolean;
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  isSupported(): boolean {
    return this.isBrowser && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  }

  async start(): Promise<void> {
    if (!this.isSupported()) throw new DictationError('not-supported');
    if (this.recorder) return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (error: any) {
      throw new DictationError(
        error?.name === 'NotAllowedError' || error?.name === 'SecurityError' ? 'permission-denied'
        : error?.name === 'NotFoundError' || error?.name === 'NotReadableError' ? 'no-microphone'
        : 'unknown'
      );
    }

    // A second start() may have won the race while the permission prompt was open.
    if (this.recorder) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    this.stream = stream;

    const mimeType = MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    this.recorder.ondataavailable = (event) => {
      if (event.data.size) this.chunks.push(event.data);
    };
    this.recorder.start(1000);
    this.startedAt = Date.now();
  }

  /**
   * Stops recording and resolves with the transcribed text.
   * `languageHint` (ISO-639-1) steers language detection; speech in another language is still transcribed as spoken.
   */
  async stop(languageHint?: string): Promise<string> {
    const durationMs = Date.now() - this.startedAt;
    const audio = await this.finishRecording();
    if (!audio?.size || durationMs < MIN_RECORDING_MS) throw new DictationError('no-speech');

    const form = new FormData();
    if (languageHint) form.append('language', languageHint);
    form.append('audio', audio, 'dictation');
    let text = '';
    try {
      const response = await firstValueFrom(this.http.post<{ text: string }>(`${environment.api}/speech/transcribe`, form));
      text = (response?.text || '').trim();
    } catch (error: any) {
      throw new DictationError(error?.status === 0 ? 'network' : 'service-unavailable');
    }
    if (!text) throw new DictationError('no-speech');
    return text;
  }

  /** Stops recording and discards the audio. */
  cancel(): void {
    void this.finishRecording();
  }

  private finishRecording(): Promise<Blob | null> {
    const recorder = this.recorder;
    this.recorder = null;
    if (!recorder) {
      this.releaseMicrophone();
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      const collect = () => {
        const audio = new Blob(this.chunks, { type: recorder.mimeType || 'audio/webm' });
        this.chunks = [];
        this.releaseMicrophone();
        resolve(audio);
      };
      if (recorder.state === 'inactive') {
        collect();
      } else {
        recorder.onstop = collect;
        recorder.stop();
      }
    });
  }

  private releaseMicrophone(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}
