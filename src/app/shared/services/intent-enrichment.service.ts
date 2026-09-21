import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
    IntentGateChoice,
    IntentGateModalComponent,
    IntentGateMode
} from 'app/pages/land/intent-gate-modal/intent-gate-modal.component';

@Injectable({ providedIn: 'root' })
export class IntentEnrichmentService {
    constructor(private modalService: NgbModal) {}

    chooseNextStep(
        reason: string,
        hasUploadedImages = false,
        hasPatientDescription = true
    ): Promise<IntentGateChoice | null> {
        return this.openGate('enrich', reason, hasUploadedImages, hasPatientDescription);
    }

    chooseExplainRedirect(): Promise<IntentGateChoice | null> {
        return this.openGate('explain');
    }

    private async openGate(
        mode: IntentGateMode,
        reason = '',
        hasUploadedImages = false,
        hasPatientDescription = true
    ): Promise<IntentGateChoice | null> {
        const modalRef = this.modalService.open(IntentGateModalComponent, {
            size: 'md',
            centered: true,
            backdrop: 'static',
            keyboard: true,
            windowClass: 'intent-gate-window'
        });
        modalRef.componentInstance.mode = mode;
        modalRef.componentInstance.reason = reason || '';
        modalRef.componentInstance.hasUploadedImages = hasUploadedImages;
        modalRef.componentInstance.hasPatientDescription = hasPatientDescription;

        try {
            return await modalRef.result;
        } catch {
            return null;
        }
    }
}
