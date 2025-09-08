import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BrandingService } from 'app/shared/services/branding.service';

@Component({
  selector: 'app-collaboration',
  templateUrl: './collaboration.component.html',
  styleUrls: ['./collaboration.component.scss']
})
export class CollaborationComponent implements OnInit {
  @ViewChild('sendMsgModal') sendMsgModal!: TemplateRef<any>;
  modalMode: 'clinicalData' | 'datasets' | 'subscribe' | 'contact' = 'contact';
  private modalRef: NgbModalRef;

  constructor(
    public brandingService: BrandingService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    // Inicialización del componente
  }

  openContactModal(): void {
    this.modalMode = 'contact';
    this.modalRef = this.modalService.open(this.sendMsgModal, { 
      size: 'lg',
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  getModalTitle(): string {
    return 'Contact us';
  }
}
