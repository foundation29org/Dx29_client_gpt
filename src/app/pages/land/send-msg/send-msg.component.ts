import { Component, OnDestroy, ViewChild, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { UuidService } from 'app/shared/services/uuid.service';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { BrandingService } from 'app/shared/services/branding.service';
import Swal from 'sweetalert2';

declare let gtag: any;

@Component({
    selector: 'app-send-msg',
    templateUrl: './send-msg.component.html',
    styleUrls: ['./send-msg.component.scss']
})

export class SendMsgComponent implements OnDestroy, OnInit {

  @Input() mode: 'clinicalData' | 'datasets' | 'subscribe' | 'contact' = 'contact';
  @Output() closeModalEvent = new EventEmitter<void>();
  
  private subscription: Subscription = new Subscription();
  _startTime: any;
  role: string = '';
  myuuid: string;
  email: string = '';
  showErrorForm: boolean = false;
  sending: boolean = false;
  @ViewChild('f') mainForm: NgForm;
  checkSubscribe: boolean = false;
  acceptTerms: boolean = false;
  modalReference: NgbModalRef;
  descriptionLength: number = 0;
  
  // Propiedades dinámicas basadas en el modo
  title: string = '';
  subtitle: string = '';
  formDescription: string = '';
  showSubscribeCheckbox: boolean = true;
  currentTenant: string = 'dxgpt';

  constructor(
    public translate: TranslateService, 
    private http: HttpClient, 
    public insightsService: InsightsService, 
    private modalService: NgbModal, 
    private uuidService: UuidService,
    private route: ActivatedRoute,
    private brandingService: BrandingService
  ) {
    this._startTime = Date.now();
    this.myuuid = this.uuidService.getUuid();
  }

  ngOnInit() {
    // Leer el parámetro mode de la URL si no se proporciona como Input
    if (!this.mode || this.mode === 'contact') {
      this.route.queryParams.subscribe(params => {
        if (params['mode']) {
          this.mode = params['mode'] as 'clinicalData' | 'datasets' | 'subscribe' | 'contact';
        }
        this.configureMode();
      });
    } else {
      this.configureMode();
    }
    
    // Obtener el tenant actual
    this.currentTenant = this.brandingService.getCurrentTenant();
  }

  /**
   * Configura el componente según el modo seleccionado
   */
  private configureMode(): void {
    switch (this.mode) {
      case 'clinicalData':
        this.title = this.translate.instant('menu.DONATE_DROPDOWN_2');
        this.formDescription = this.translate.instant('support.NAV_CLINICAL_DESCRIPTION');
        this.subtitle = this.translate.instant('support.NAV_CLINICAL_SUBTITLE');
        this.showSubscribeCheckbox = true;
        break;
      case 'datasets':
        this.title = this.translate.instant('menu.DONATE_DROPDOWN_3');
        this.subtitle = this.translate.instant('support.NAV_DATASETS_SUBTITLE');
        this.formDescription = this.translate.instant('support.NAV_DATASETS_DESCRIPTION');
        this.showSubscribeCheckbox = true;
        break;
      case 'subscribe':
        this.title = this.translate.instant('support.NAV_SUBSCRIBE_TITLE');
        this.formDescription = this.translate.instant('support.NAV_SUBSCRIBE_DESCRIPTION');
        this.showSubscribeCheckbox = false;
        this.checkSubscribe = true; // Auto-marcar como suscripción
        break;
      case 'contact':
      default:
        this.title = this.translate.instant('menu.Contact us"');
        this.formDescription = this.translate.instant('support.NAV_CONTACT_DESCRIPTION');
        this.showSubscribeCheckbox = true;
        break;
    }
  }

getElapsedSeconds() {
    var endDate = Date.now();
    var seconds = (endDate - this._startTime) / 1000;
    return seconds;
};

lauchEvent(category) {
  var secs = this.getElapsedSeconds();
  gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
}
  
    ngOnDestroy() {
      this.subscription.unsubscribe();
  }

    submitInvalidForm() {
      this.showErrorForm = true;
      if (!this.mainForm) { return; }
      const base = this.mainForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    sendMsg(){
      
      this.sending = true;
        //this.mainForm.value.email = (this.mainForm.value.email).toLowerCase();
        //this.mainForm.value.lang=this.translate.store.currentLang;
        var params = this.mainForm.value;
        params.lang = sessionStorage.getItem('lang');
        params.subscribe = this.checkSubscribe;
        params.myuuid = this.myuuid;
        this.subscription.add( this.http.post(environment.api+'/internal/homesupport/', params)
        .subscribe( (res : any) => {
          this.sending = false;
          Swal.fire({
            icon: 'success',
            html: this.translate.instant('generics.Data saved successfully'),
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
          });
          setTimeout(function () {
            Swal.close();
          }, 2000);
          this.checkSubscribe = false;
          this.acceptTerms = false;
          this.showErrorForm = false;
          this.mainForm.reset();
          this.descriptionLength = 0;
          this.lauchEvent('Send email');
          this.closeModal();
         }, (err) => {
          this.insightsService.trackException(err);
           console.log(err);
           this.sending = false;
           Swal.fire({
            icon: 'error',
            html: this.translate.instant('generics.error try again'),
            showCancelButton: false,
            showConfirmButton: true,
            allowOutsideClick: false
          });
         }));
    }

    async openModal2(panel) {
      let ngbModalOptions: NgbModalOptions = {
        backdrop : 'static',
          keyboard: false,
          windowClass: 'ModalClass-sm'// xl, lg, sm
      };
      this.modalReference = this.modalService.open(panel, ngbModalOptions);
      await this.delay(400);
      document.getElementById('initpopup2').scrollIntoView(true);
    }

    delay(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    onTermsAccepted() {
      this.acceptTerms = true;
      this.modalReference.close();
    }

      autoResize(event: Event) {
    const inputElement = event.target as HTMLTextAreaElement;
    this.descriptionLength = inputElement.value.length;
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  /**
   * Cierra el modal
   */
  closeModal(): void {
    this.closeModalEvent.emit();
  }

}
