import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UnifiedModalFormComponent } from '../components/unified-modal-form.component';
import { MODAL_FORM_CONFIGS } from './modal-form.config';

@Injectable({
  providedIn: 'root'
})
export class UnifiedModalService {
  private currentModalRef?: NgbModalRef;

  constructor(private modalService: NgbModal) {}

  openContactModal(onSubmit: (data: any) => void, onTermsOpen?: () => void): void {
    this.openModal('contact', onSubmit, onTermsOpen);
  }

  openSubscribeModal(onSubmit: (data: any) => void, onTermsOpen?: () => void): void {
    this.openModal('subscribe', onSubmit, onTermsOpen);
  }

  openClinicalDataModal(onSubmit: (data: any) => void): void {
    this.openModal('clinicalData', onSubmit);
  }

  openDatasetsModal(onSubmit: (data: any) => void): void {
    this.openModal('datasets', onSubmit);
  }

  private openModal(
    configKey: string, 
    onSubmit: (data: any) => void, 
    onTermsOpen?: () => void
  ): void {
    this.currentModalRef = this.modalService.open(UnifiedModalFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    const component = this.currentModalRef.componentInstance;
    component.config = MODAL_FORM_CONFIGS[configKey];

    // Handle form submission
    component.formSubmit.subscribe((result: any) => {
      onSubmit(result.data);
    });

    // Handle modal cancel
    component.modalCancel.subscribe(() => {
      this.closeModal();
    });

    // Handle terms modal opening
    if (onTermsOpen) {
      component.termsOpen.subscribe(() => {
        onTermsOpen();
      });
    }
  }

  closeModal(): void {
    if (this.currentModalRef) {
      this.currentModalRef.close();
      this.currentModalRef = undefined;
    }
  }

  resetCurrentForm(): void {
    if (this.currentModalRef?.componentInstance) {
      this.currentModalRef.componentInstance.resetForm();
    }
  }

  getCurrentModalRef(): NgbModalRef | undefined {
    return this.currentModalRef;
  }
}