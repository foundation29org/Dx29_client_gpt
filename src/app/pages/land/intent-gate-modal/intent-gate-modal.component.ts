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
    @Input() hasUploadedImages = false;
    @Input() hasPatientDescription = true;

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

    get hasImageContext(): boolean {
        return this.hasUploadedImages && !this.isExplain;
    }

    get canContinue(): boolean {
        // The classifier suggests a path. It must never block differential diagnosis.
        return true;
    }

    get canAskQuestions(): boolean {
        if (this.hasImageContext && !this.hasPatientDescription) {
            return false;
        }
        return this.hasImageContext || !this.isNonMedical;
    }

    get canUpload(): boolean {
        return !this.isExplain && !this.hasImageContext;
    }

    get recommendAddingDetails(): boolean {
        return this.hasImageContext && !this.hasPatientDescription;
    }

    get titleKey(): string {
        if (this.isExplain) {
            return 'land.enrichment.ask_title';
        }
        if (this.hasImageContext) {
            return 'land.enrichment.image_title';
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
        if (this.hasImageContext) {
            return 'land.enrichment.image_description';
        }
        if (this.isNonMedical) {
            return 'land.enrichment.non_medical_description';
        }
        if (this.isMissingData) {
            return 'land.enrichment.missing_description';
        }
        return 'land.enrichment.description';
    }

    get continueLabelKey(): string {
        return this.hasImageContext
            ? 'land.enrichment.image_continue'
            : 'land.enrichment.continue';
    }

    get continueHintKey(): string {
        return this.hasImageContext
            ? 'land.enrichment.image_continue_hint'
            : 'land.enrichment.continue_hint';
    }

    get editLabelKey(): string {
        return this.hasImageContext
            ? 'land.enrichment.image_edit'
            : 'land.enrichment.edit';
    }

    get editHintKey(): string {
        return this.hasImageContext
            ? 'land.enrichment.image_edit_hint'
            : 'land.enrichment.edit_hint';
    }

    choose(choice: IntentGateChoice): void {
        this.activeModal.close(choice);
    }

    dismiss(): void {
        this.activeModal.dismiss();
    }
}
