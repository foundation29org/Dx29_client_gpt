import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { UuidService } from 'app/shared/services/uuid.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-medical-answer-feedback',
  templateUrl: './medical-answer-feedback.component.html',
  styleUrls: ['./medical-answer-feedback.component.scss']
})
export class MedicalAnswerFeedbackComponent {
  @Input() question: string = '';
  @Input() initialVote: 'up' | 'down' | null = null;
  @Input() model: string = '';
  @Input() fileNames: string = '';
  @Input() answerHtml: string = '';
  @Input() references: any[] = [];
  @Input() detectedLang: string = '';

  form: FormGroup;
  sending: boolean = false;
  myuuid: string;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private http: HttpClient,
    public translate: TranslateService,
    public insightsService: InsightsService,
    private uuidService: UuidService,
  ) {
    this.myuuid = this.uuidService.getUuid();
    this.form = this.fb.group({
      helpful: [null, Validators.required],
      comments: [''],
      email: ['', Validators.email]
    });
  }

  ngOnInit() {
    if (this.initialVote) {
      this.form.patchValue({ helpful: this.initialVote === 'up' });
    }
    try {
      this.insightsService.trackEvent('medical_answer_feedback_open', {
        initialVote: this.initialVote || null,
        model: this.model || 'unknown',
        detectedLang: this.detectedLang || 'unknown',
        hasFileNames: !!this.fileNames,
        fileCount: this.fileNames ? this.fileNames.split(',').filter(s => s.trim()).length : 0
      });
    } catch {}
  }

  private submitted = false;

  submit() {
    if (this.form.invalid) return;
    this.sending = true;
    const payload = {
      type: 'medical_answer',
      helpful: !!this.form.value.helpful,
      comments: this.form.value.comments,
      email: (this.form.value.email || '').toLowerCase(),
      question: this.question,
      model: this.model,
      detectedLang: this.detectedLang || 'unknown',
      fileNames: this.fileNames,
      answerHtml: this.answerHtml,
      references: this.references,
      myuuid: this.myuuid,
      lang: this.translate.store.currentLang
    };

    this.http.post(environment.api + '/internal/questionsfeedback/', payload)
      .subscribe({
        next: () => {
          this.sending = false;
          this.submitted = true;
          try {
            this.insightsService.trackEvent('medical_answer_feedback_submit', {
              helpful: !!this.form.value.helpful,
              commentLength: (this.form.value.comments || '').length,
              hasEmail: !!this.form.value.email,
              model: this.model || 'unknown',
              detectedLang: this.detectedLang || 'unknown',
              hasFileNames: !!this.fileNames,
              fileCount: this.fileNames ? this.fileNames.split(',').filter(s => s.trim()).length : 0,
              answerLength: (this.answerHtml || '').length,
              numReferences: Array.isArray(this.references) ? this.references.length : 0
            });
          } catch {}
          try {
            Swal.fire({
              icon: 'success',
              html: this.translate.instant('feedback.thanks'),
              title: this.translate.instant('feedback.Submitted'),
              showConfirmButton: true,
              allowOutsideClick: false
            });
          } catch {}
          this.activeModal.close('submitted');
        },
        error: (err) => {
          this.sending = false;
          this.insightsService.trackException(err);
        }
      });
  }

  ngOnDestroy() {
    // Auto-enviar feedback mínimo si el usuario cierra sin enviar
    if (!this.submitted) {
      const minimal = {
        type: 'medical_answer',
        minimal: true,
        helpful: this.form.value.helpful === null ? null : !!this.form.value.helpful,
        question: this.question,
        model: this.model,
        detectedLang: this.detectedLang || 'unknown',
        answerHtml: this.answerHtml,
        references: this.references,
        myuuid: this.myuuid,
        lang: this.translate.store.currentLang
      };
      try {
        this.insightsService.trackEvent('medical_answer_feedback_auto_submit', {
          helpful: minimal.helpful,
          model: this.model || 'unknown',
          detectedLang: this.detectedLang || 'unknown',
          answerLength: (this.answerHtml || '').length,
          numReferences: Array.isArray(this.references) ? this.references.length : 0
        });
      } catch {}
      // Mostrar un toast ligero de agradecimiento
      try {
        Swal.fire({
          toast: true,
          position: 'top-end',
          timer: 1600,
          timerProgressBar: true,
          icon: 'success',
          title: this.translate.instant('feedback.thanks'),
          showConfirmButton: false
        });
      } catch {}
      this.http.post(environment.api + '/internal/questionsfeedback/', minimal).subscribe({
        error: (err) => this.insightsService.trackException(err)
      });
    }
  }
}


