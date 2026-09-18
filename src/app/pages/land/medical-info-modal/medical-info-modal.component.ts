import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { MedicalAnswerData } from './medical-answer.model';

@Component({
  selector: 'app-medical-info-modal',
  templateUrl: './medical-info-modal.component.html',
  styleUrls: ['./medical-info-modal.component.scss'],
  standalone: false
})
export class MedicalInfoModalComponent implements OnInit {
  @Input() content = '';
  @Input() title = '';
  @Input() sonarData: unknown = '';
  @Input() model = '';
  @Input() selectedFiles: Array<{ name?: string }> = [];
  @Input() detectedLang = '';

  answer!: MedicalAnswerData;
  closeButtonText = '';

  constructor(
    public readonly activeModal: NgbActiveModal,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.closeButtonText = this.translate.instant('generics.Close');
    this.answer = {
      question: this.title,
      content: this.content,
      sonarData: this.sonarData,
      model: this.model,
      selectedFiles: this.selectedFiles || [],
      detectedLang: this.detectedLang
    };
  }
}
