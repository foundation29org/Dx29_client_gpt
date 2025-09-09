import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-integration',
  templateUrl: './integration.component.html',
  styleUrls: ['./integration.component.scss']
})
export class IntegrationComponent implements OnInit {
  @ViewChild('sendMsgModal') sendMsgModal!: TemplateRef<any>;
  modalMode: 'clinicalData' | 'datasets' | 'subscribe' | 'contact' = 'contact';
  private modalRef: NgbModalRef;

  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {
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

   getModalTitle(): string {
    return 'Contact us';
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

}
