import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export type IntentGateMode = 'enrich' | 'explain';
export type IntentGateChoice = 'ask' | 'questions' | 'continue' | 'edit' | 'upload';

@Component({
    selector: 'app-intent-gate-modal',
    templateUrl: './intent-gate-modal.component.html',
    styleUrls: ['./intent-gate-modal.component.scss'],
    standalone: false
})
export class IntentGateModalComponent {
    @Input() mode: IntentGateMode = 'enrich';
    @Input() reason = '';

    constructor(public activeModal: NgbActiveModal) {}

    get isExplain(): boolean {
        return this.mode === 'explain';
    }

    get isNonMedical(): boolean {
        return this.reason === 'non_medical';
    }

    get isMissingData(): boolean {
        return this.reason === 'missing_patient_data';
    }

    get canContinue(): boolean {
        // The classifier suggests a path. It must never block differential diagnosis.
        return true;
    }

    get canAskQuestions(): boolean {
        return !this.isNonMedical;
    }

    get titleKey(): string {
        if (this.isExplain) {
            return 'land.enrichment.ask_title';
        }
        if (this.isNonMedical) {
            return 'land.enrichment.non_medical_title';
        }
        if (this.isMissingData) {
            return 'land.enrichment.missing_title';
        }
        return 'land.enrichment.title';
    }

    get descriptionKey(): string {
        if (this.isExplain) {
            return 'land.enrichment.ask_description';
        }
        if (this.isNonMedical) {
            return 'land.enrichment.non_medical_description';
        }
        if (this.isMissingData) {
            return 'land.enrichment.missing_description';
        }
        return 'land.enrichment.description';
    }

    choose(choice: IntentGateChoice): void {
        this.activeModal.close(choice);
    }

    dismiss(): void {
        this.activeModal.dismiss();
    }
}
