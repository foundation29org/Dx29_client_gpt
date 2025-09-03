import { Component, ViewChild, ViewChildren, ElementRef, QueryList, Renderer2 } from '@angular/core';
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
  modalReference3: NgbModalRef;
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
  footerLogo: string = 'assets/img/logo-f29-white.webp';
  foundationLink: string = 'https://foundation29.org';
  currentYear: number;

  // Subscribe modal properties
  subscribeSending: boolean = false;
  subscribeUserName: string = '';
  subscribeEmail: string = '';
  subscribeAcceptTerms: boolean = false;
  showSubscribeErrorForm: boolean = false;

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
    this.currentYear = new Date().getFullYear();
    this.router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd)
    ).subscribe(
      event => {
        const tempUrl = (event.url).toString();
        
        // Reset all flags first
        this.isHomePage = false;
        this.isPolicyPage = false;
        this.isCookiesPage = false;
        this.isResultPage = false;
        
        // Set active page based on URL (using consistent detection method)
        if (tempUrl.indexOf('/.') != -1 || tempUrl == '/') {
          this.isHomePage = true;
        } else if (tempUrl.indexOf('/privacy-policy') != -1) {
          this.isPolicyPage = true;
        } else if (tempUrl.indexOf('/cookies') != -1) {
          this.isCookiesPage = true;
        } else if (tempUrl.indexOf('/result') != -1) {
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
    // No hacer scroll al abrir modal - preservar posición actual
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
  let ngbModalOptions: NgbModalOptions = {
      keyboard: true,
      windowClass: 'ModalClass-sm'// xl, lg, sm
  };
  // No hacer scroll al abrir modal - preservar posición actual
  this.modalService.open(PrivacyPolicyPageComponent, ngbModalOptions);
}

openModalCookies() {
  let ngbModalOptions: NgbModalOptions = {
      keyboard: true,
      windowClass: 'ModalClass-sm'// xl, lg, sm
  };
  // No hacer scroll al abrir modal - preservar posición actual
  this.modalService.open(CookiesPageComponent, ngbModalOptions);
}


async openModal(panel) {
  let ngbModalOptions: NgbModalOptions = {
    backdrop : 'static',
      keyboard: true,
      windowClass: 'ModalClass-sm'// xl, lg, sm
  };
  this.modalReference2 = this.modalService.open(panel, ngbModalOptions);
}

onTermsAccepted() {
  this.acceptTerms = true;
  this.modalReference2.close();
}

onTermsAcceptedAndClose(closeFn: any) {
  this.acceptTerms = true;
  closeFn(); // Cierra el modal usando la función de NgBootstrap
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

// Subscribe modal methods
openSubscribe(content) {
  let ngbModalOptions: NgbModalOptions = {
      keyboard: true,
      windowClass: 'ModalClass-sm'
  };
  this.modalReference3 = this.modalService.open(content, ngbModalOptions);
}

closeSubscribe() {
  this.subscribeUserName = '';
  this.subscribeEmail = '';
  this.subscribeAcceptTerms = false;
  this.showSubscribeErrorForm = false;
  this.modalReference3.close();
}

submitInvalidSubscribeForm() {
  this.showSubscribeErrorForm = true;
}

onSubmitSubscription() {
  this.subscribeSending = true;
  var params = { 
    userName: this.subscribeUserName, 
    email: this.subscribeEmail, 
    lang: sessionStorage.getItem('lang'), 
    subscribe: true, 
    myuuid: this.myuuid 
  };
  this.http.post(environment.api + '/internal/homesupport/', params)
      .subscribe((res: any) => {
          this.subscribeSending = false;
          this.subscribeUserName = '';
          this.subscribeEmail = '';
          this.subscribeAcceptTerms = false;
          this.modalReference3.close();
          Swal.fire({
              icon: 'success',
              html: '¡Gracias por suscribirte! Recibirás actualizaciones sobre DxGPT.',
              showCancelButton: false,
              showConfirmButton: false,
              allowOutsideClick: false
          })
          setTimeout(function () {
              Swal.close();
          }, 3000);
      }, (err) => {
          console.log(err);
          this.subscribeSending = false;
          this.subscribeAcceptTerms = false;
          Swal.fire({
            icon: 'error',
            html: this.translate.instant('generics.error try again'),
            showCancelButton: false,
            showConfirmButton: true,
            allowOutsideClick: false
          });
      });
}

// Open donation modal - redirect to navbar functionality
openDonateModal() {
  // Since the navbar handles donation modals, we could either:
  // 1. Duplicate the modal here, or
  // 2. Show a simple alert directing to the navbar dropdown
  alert('Puedes encontrar las opciones de donación en el menú principal "Donar"');
  // TODO: Consider implementing donation modal here or redirecting appropriately
}

// Método para navegación normal (siempre al top)
navigateToTop(route: string) {
  // Solo navegar, el app.component.ts se encarga del scroll automático
  this.router.navigate([route]);
}

// Método para navegación con scroll directo a sección
navigateToSection(route: string, sectionId: string) {
  const currentRoute = this.router.url.split('#')[0]; // Obtener ruta sin fragment
  
  if (currentRoute === route) {
    // Ya estamos en la página, solo hacer scroll
    this.scrollToElement(sectionId);
  } else {
    // Navegar sin fragment para que app.component maneje scroll al top primero
    this.router.navigate([route]).then(() => {
      // Luego intentar scroll a sección específica con fallback
      this.scrollToElementWithFallback(sectionId);
    });
  }
}

// Scroll a elemento con fallback a top si no existe
scrollToElementWithFallback(elementId: string) {
  let attempts = 0;
  const maxAttempts = 20;
  
  const tryScroll = () => {
    attempts++;
    const element = document.getElementById(elementId);
    
    if (element) {
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - 100;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else if (attempts < maxAttempts) {
      setTimeout(tryScroll, 50);
    } else {
      // Fallback: si elemento no existe después de intentos, ir al top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  
  // Delay inicial para que la página se cargue
  setTimeout(tryScroll, 300);
}

// Scroll suave para cuando ya estamos en la página
scrollToElement(elementId: string) {
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.offsetTop;
    const offsetPosition = elementPosition - 100;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

goToPrecision() {
  this.navigateToSection('/aboutus', 'benchmarking');
}

goToSociosTecnologicos() {
  this.navigateToSection('/transparencia', 'socios-tecnologicos');
}

goToPatrocinadores() {
  this.navigateToSection('/transparencia', 'patrocinadores');
}

goToImplementaciones() {
  this.navigateToSection('/transparencia', 'implementaciones');
}

goToColaborar() {
  this.navigateToSection('/transparencia', 'colabora-con-nosotros');
}

goToSistemasSalud() {
  this.navigateToSection('/transparencia', 'implementaciones-sistemas-salud');
}

}
