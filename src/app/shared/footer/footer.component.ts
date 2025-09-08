import { Component, ViewChild, ViewChildren, ElementRef, QueryList, Renderer2, TemplateRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { PrivacyPolicyPageComponent } from 'app/pages/land/privacy-policy/privacy-policy.component';
import { CookiesPageComponent } from 'app/pages/land/cookies/cookies.component';
import { UuidService } from 'app/shared/services/uuid.service';
import { BrandingService } from 'app/shared/services/branding.service';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})

export class FooterComponent{

  isHomePage: boolean = false;
  isResultPage: boolean = false;
  isPolicyPage: boolean = false;
  isCookiesPage: boolean = false;
  modalReference: NgbModalRef;
  modalReference2: NgbModalRef;
  sending: boolean = false;
  msgfeedBack: string = '';
  userName: string = '';
  checkSubscribe: boolean = false;
  acceptTerms: boolean = false;
  showErrorForm: boolean = false;
  terms3: boolean = false;
  @ViewChild('f') dataForm: NgForm;
  @ViewChildren('autoajustable') textAreas: QueryList<ElementRef>;
  email: string = '';
  myuuid: string;
  footerLogo: string = 'assets/img/Foundation29logo.webp';
  foundationLink: string = 'https://foundation29.org';
  shouldShowDonate: boolean = true;
  
  // Propiedades para el modal send-msg
  @ViewChild('sendMsgModal') sendMsgModal!: TemplateRef<any>;
  modalMode: 'clinicalData' | 'datasets' | 'subscribe' | 'contact' = 'contact';
  private modalRef: NgbModalRef;

  constructor(
    private modalService: NgbModal, 
    private http: HttpClient, 
    public translate: TranslateService, 
    private renderer: Renderer2, 
    private router: Router, 
    private uuidService: UuidService,
    public brandingService: BrandingService
  ) { 
    this.myuuid = this.uuidService.getUuid();
    this.router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd)
    ).subscribe(
      event => {
        const tempUrl = (event.url).toString();
        if (tempUrl.indexOf('/.') != -1 || tempUrl == '/') {
          this.isHomePage = true;
          this.isPolicyPage = false;
          this.isCookiesPage = false;
          this.isResultPage = false;
        }else if(tempUrl == '/privacy-policy'){
          this.isHomePage = false;
          this.isPolicyPage = true;
          this.isCookiesPage = false;
          this.isResultPage = false;
        }else if(tempUrl == '/cookies'){
          this.isHomePage = false;
          this.isPolicyPage = false;
          this.isCookiesPage = true;
          this.isResultPage = false;
        }else if(tempUrl == '/result'){
          this.isHomePage = false;
          this.isPolicyPage = false;
          this.isCookiesPage = false;
          this.isResultPage = true;
        }
        else {
          this.isHomePage = false;
          this.isPolicyPage = false;
          this.isCookiesPage = false;
          this.isResultPage = true;
        }
      }
    );
    
    // Cargar configuración de branding
    this.loadBrandingConfig();
  }

  openSupport(content){
    let ngbModalOptions: NgbModalOptions = {
        keyboard: true,
        windowClass: 'ModalClass-sm'// xl, lg, sm
      };
    this.modalReference = this.modalService.open(content, ngbModalOptions);
    this.scrollTo();
}

submitInvalidForm() {
  this.showErrorForm = true;
  if (!this.dataForm) { return; }
  const base = this.dataForm;
  for (const field in base.form.controls) {
      if (!base.form.controls[field].valid) {
          base.form.controls[field].markAsTouched()
      }
  }
}

onSubmitRevolution() {
  this.sending = true;
  var params = { userName: this.userName ,email: this.email, description: this.msgfeedBack, lang: sessionStorage.getItem('lang'), subscribe: this.checkSubscribe, myuuid: this.myuuid };
  this.http.post(environment.api + '/internal/homesupport/', params)
      .subscribe((res: any) => {
          this.sending = false;
          this.userName = '';
          this.msgfeedBack = '';
          this.email = '';
          this.checkSubscribe = false;
          this.acceptTerms = false;
          this.modalReference.close();
          Swal.fire({
              icon: 'success',
              html: this.translate.instant("land.Thank you"),
              showCancelButton: false,
              showConfirmButton: false,
              allowOutsideClick: false
          })
          setTimeout(function () {
              Swal.close();
          }, 2000);
      }, (err) => {
          console.log(err);
          this.sending = false;
          this.checkSubscribe = false;
          this.acceptTerms = false;
          Swal.fire({
            icon: 'error',
            html: this.translate.instant('generics.error try again'),
            showCancelButton: false,
            showConfirmButton: true,
            allowOutsideClick: false
          });
      });

}

autoResize(event: Event) {
  const textarea = event.target as HTMLTextAreaElement;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

closeSupport(){
  this.userName = '';
  this.msgfeedBack = '';
  this.email = '';
  this.modalReference.close();
  this.acceptTerms = false;
  this.checkSubscribe = false;
}

openModalPolicy() {
  // Navegar directamente a la página de política de privacidad
  this.router.navigate(['/privacy-policy']);
}

openModalCookies() {
  let ngbModalOptions: NgbModalOptions = {
      keyboard: true,
      windowClass: 'ModalClass-sm'// xl, lg, sm
  };
  this.modalService.open(CookiesPageComponent, ngbModalOptions);
  this.scrollTo();
}


async openModal(panel) {
  let ngbModalOptions: NgbModalOptions = {
    backdrop : 'static',
      keyboard: false,
      windowClass: 'ModalClass-sm'// xl, lg, sm
  };
  this.modalReference2 = this.modalService.open(panel, ngbModalOptions);
  await this.delay(400);
  document.getElementById('initpopup2').scrollIntoView(true);
}

onTermsAccepted() {
  this.acceptTerms = true;
  this.modalReference2.close();
}

async scrollTo() {
  await this.delay(400);
  //document.getElementById('initpopup').scrollIntoView(true);
  document.getElementById('initpopup').scrollIntoView({ behavior: "smooth" });
}

delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Carga la configuración de branding
 */
private loadBrandingConfig(): void {
  this.brandingService.brandingConfig$.subscribe(config => {
    if (config) {
      this.footerLogo = config.logos.footer;
      this.foundationLink = config.links.foundation;
    }
  });
}

/**
 * Abre el modal de contacto
 */
openContactModal(): void {
  this.openSendMsgModal('contact');
}

/**
 * Abre el modal de suscripción
 */
openSubscribeModal(): void {
  this.openSendMsgModal('subscribe');
}

/**
 * Abre el modal de datos clínicos
 */
openClinicalDataModal(): void {
  this.openSendMsgModal('clinicalData');
}

/**
 * Abre el modal de datasets
 */
openDatasetsModal(): void {
  this.openSendMsgModal('datasets');
}

/**
 * Abre el modal de send-msg con el modo especificado
 */
private openSendMsgModal(mode: 'clinicalData' | 'datasets' | 'subscribe' | 'contact'): void {
  // Establecer el modo del modal
  this.modalMode = mode;
  
  // Abrir el modal usando el template
  this.modalRef = this.modalService.open(this.sendMsgModal, { 
    size: 'lg',
    centered: true,
    backdrop: 'static',
    keyboard: false
  });
}

/**
 * Cierra el modal actual
 */
closeModal(): void {
  if (this.modalRef) {
    this.modalRef.close();
  }
}

/**
 * Obtiene el título del modal según el modo
 */
getModalTitle(): string {
  switch (this.modalMode) {
    case 'contact':
      return this.translate.instant('menu.Contact us');
    case 'subscribe':
      return this.translate.instant('support.NAV_SUBSCRIBE_TITLE');
    case 'clinicalData':
      return this.translate.instant('menu.DONATE_DROPDOWN_2');
    case 'datasets':
      return this.translate.instant('menu.DONATE_DROPDOWN_3');
    default:
      return this.translate.instant('menu.Contact us');
  }
}

}
