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

    // El texto no describe un caso (o no hay datos del paciente): lo útil es completarlo,
    // no lanzar un diferencial. Continuar sigue disponible, pero al final.
    get editFirst(): boolean {
        return !this.isExplain && !this.hasImageContext && (this.isNonMedical || this.isMissingData);
    }

    get canContinue(): boolean {
        // The classifier suggests a path. It must never block differential diagnosis.
        return true;
    }

    get canAskQuestions(): boolean {
        return this.hasImageContext || !this.isNonMedical;
    }

    get canUpload(): boolean {
        return !this.isExplain && !this.hasImageContext;
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

    get askHintKey(): string {
        return this.hasUploadedImages
            ? 'land.enrichment.ask_open_hint_images'
            : 'land.enrichment.ask_open_hint';
    }

    get continueLabelKey(): string {
        if (this.isExplain) {
            return 'land.enrichment.explain_continue';
        }
        if (this.editFirst) {
            return 'land.enrichment.continue_anyway';
        }
        return this.hasImageContext
            ? 'land.enrichment.image_continue'
            : 'land.enrichment.continue';
    }

    get continueHintKey(): string {
        if (this.isExplain) {
            return 'land.enrichment.explain_continue_hint';
        }
        if (this.editFirst) {
            return 'land.enrichment.continue_anyway_hint';
        }
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
