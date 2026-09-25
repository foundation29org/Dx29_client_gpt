import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DictationError, DictationErrorCode, MAX_RECORDING_MS, VoiceDictationService } from 'app/shared/services/voice-dictation.service';
import { InsightsService } from 'app/shared/services/azureInsights.service';

type DictationState = 'idle' | 'starting' | 'recording' | 'transcribing';

const EXPECTED_ERRORS: DictationErrorCode[] = ['permission-denied', 'no-microphone', 'no-speech'];

let nextId = 0;

/**
 * Microphone button that sits inside a text field (bottom-right corner).
 * The host positions itself absolutely: the field's wrapper must be `position: relative`
 * and the field needs ~3.25rem of bottom padding so text does not run under the button.
 *
 * Usage: <app-dictation-button [text]="value" (textChange)="value = $event" (dictatingChange)="busy = $event">
 * The transcription is appended to `text`.
 */
@Component({
  selector: 'app-dictation-button',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './dictation-button.component.html',
  styleUrls: ['./dictation-button.component.scss']
})
export class DictationButtonComponent implements OnInit, OnChanges, OnDestroy {
  @Input() text = '';
  @Input() disabled = false;
  @Output() textChange = new EventEmitter<string>();
  /** True from the moment recording starts until the transcription has been applied. */
  @Output() dictatingChange = new EventEmitter<boolean>();

  readonly errorId = `dictation-error-${++nextId}`;

  supported = false;
  state: DictationState = 'idle';
  error = '';
  statusMessage = '';
  elapsedSeconds = 0;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private dictation: VoiceDictationService,
    private translate: TranslateService,
    private insights: InsightsService
  ) {}

  get elapsedLabel(): string {
    const minutes = Math.floor(this.elapsedSeconds / 60);
    const seconds = this.elapsedSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  ngOnInit(): void {
    this.supported = this.dictation.isSupported();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'] && this.disabled && (this.state === 'starting' || this.state === 'recording')) {
      this.cancel();
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
    if (this.state === 'starting' || this.state === 'recording') {
      this.dictation.cancel();
    }
  }

  toggle(): void {
    if (this.state === 'recording') {
      void this.finish();
    } else if (this.state === 'starting') {
      this.cancel();
    } else if (this.state === 'idle' && !this.disabled) {
      void this.begin();
    }
  }

  private async begin(): Promise<void> {
    this.error = '';
    this.setState('starting');
    try {
      await this.dictation.start();
    } catch (error) {
      this.fail(error);
      return;
    }
    if (this.state !== 'starting') {
      this.dictation.cancel();
      return;
    }
    this.setState('recording');
    this.statusMessage = this.translate.instant('voice.Dictation started');
    this.startTimer();
  }

  private async finish(): Promise<void> {
    this.stopTimer();
    this.setState('transcribing');
    this.statusMessage = this.translate.instant('voice.Transcribing');
    try {
      const spoken = await this.dictation.stop(this.translate.currentLang);
      const base = (this.text || '').trim();
      this.textChange.emit(base ? `${base} ${spoken}` : spoken);
      this.statusMessage = this.translate.instant('voice.Dictation added');
      this.setState('idle');
    } catch (error) {
      this.fail(error);
    }
  }

  private cancel(): void {
    this.stopTimer();
    this.dictation.cancel();
    this.setState('idle');
  }

  private fail(error: unknown): void {
    this.stopTimer();
    const code: DictationErrorCode = error instanceof DictationError ? error.code : 'unknown';
    this.error = this.translate.instant('voice.errors.' + code);
    this.setState('idle');
    if (!EXPECTED_ERRORS.includes(code)) {
      this.insights.trackException({ message: 'Dictation error', code });
    }
  }

  private startTimer(): void {
    this.elapsedSeconds = 0;
    this.timer = setInterval(() => {
      this.elapsedSeconds++;
      if (this.elapsedSeconds * 1000 >= MAX_RECORDING_MS) {
        void this.finish();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private setState(state: DictationState): void {
    const wasBusy = this.state !== 'idle';
    this.state = state;
    const busy = state !== 'idle';
    if (busy !== wasBusy) {
      this.dictatingChange.emit(busy);
    }
  }
}
