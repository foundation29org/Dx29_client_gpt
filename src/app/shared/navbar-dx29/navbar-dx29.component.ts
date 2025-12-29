import { Component, HostListener, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { LangService } from 'app/shared/services/lang.service';
import { EventsService } from 'app/shared/services/events.service';
import { Injectable, Injector } from '@angular/core';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { BrandingService } from 'app/shared/services/branding.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { filter } from 'rxjs/operators';
declare let gtag: any;

@Component({
  selector: 'app-navbar-dx29',
  templateUrl: './navbar-dx29.component.html',
  styleUrls: ['./navbar-dx29.component.scss'],
  providers: [LangService]
})

@Injectable()
export class NavbarD29Component implements OnDestroy {
  currentLang = 'en';


  langs: any;
  isHomePage: boolean = false;
  isAboutPage: boolean = false;
  isCollaborationPage: boolean = false;
  isFoundation29Page: boolean = false;
  isIntegrationPage: boolean = false;
  isFaqPage: boolean = false;
  isPrivacyPolicyPage: boolean = false;
  isReportsPage: boolean = false;
  isBetaPage: boolean = false;
  _startTime: any;
  private subscription: Subscription = new Subscription();
  isMenuExpanded = false;
  headerLogo: string = 'assets/img/logo-Dx29.webp';
  shouldShowDonate: boolean = true;
  shouldShowBeta: boolean = false;
  
  // Referencia al modal
  private modalRef: NgbModalRef;
  
  // Referencia al template del modal
  @ViewChild('sendMsgModal') sendMsgModal!: TemplateRef<any>;
  
  // Modo del modal
  modalMode: 'clinicalData' | 'datasets' | 'subscribe' | 'contact' = 'contact';

  constructor(
    public translate: TranslateService, 
    private langService: LangService, 
    private router: Router, 
    private inj: Injector, 
    public insightsService: InsightsService,
    private brandingService: BrandingService,
    private modalService: NgbModal
  ) {
    this.loadLanguages();
    this.router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd)
    ).subscribe(
      event => {
        const tempUrl = (event.url).toString();
        if (tempUrl.indexOf('/.') != -1 || tempUrl == '/') {
          this.isHomePage = true;
          this.isAboutPage = false;
          this.isCollaborationPage = false;
          this.isFoundation29Page = false;
          this.isIntegrationPage = false;
          this.isFaqPage = false;
          this.isPrivacyPolicyPage = false;
          this.isReportsPage = false;
          this.isBetaPage = false;
        } else if (tempUrl.indexOf('/aboutus') != -1) {
          this.isHomePage = false;
          this.isAboutPage = true;
          this.isCollaborationPage = false;
          this.isFoundation29Page = false;
          this.isIntegrationPage = false;
          this.isFaqPage = false;
          this.isPrivacyPolicyPage = false;
          this.isReportsPage = false;
          this.isBetaPage = false;
        } else if (tempUrl.indexOf('/collaboration') != -1) {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isCollaborationPage = true;
          this.isFoundation29Page = false;
          this.isIntegrationPage = false;
          this.isFaqPage = false;
          this.isPrivacyPolicyPage = false;
          this.isReportsPage = false;
          this.isBetaPage = false;
        } else if (tempUrl.indexOf('/foundation29') != -1) {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isCollaborationPage = false;
          this.isFoundation29Page = true;
          this.isIntegrationPage = false;
          this.isFaqPage = false;
          this.isPrivacyPolicyPage = false;
          this.isReportsPage = false;
          this.isBetaPage = false;
        } else if (tempUrl.indexOf('/integration') != -1) {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isCollaborationPage = false;
          this.isFoundation29Page = false;
          this.isIntegrationPage = true;
          this.isFaqPage = false;
          this.isPrivacyPolicyPage = false;
          this.isReportsPage = false;
          this.isBetaPage = false;
        } else if (tempUrl.indexOf('/faq') != -1) {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isCollaborationPage = false;
          this.isFoundation29Page = false;
          this.isIntegrationPage = false;
          this.isFaqPage = true;
          this.isPrivacyPolicyPage = false;
          this.isReportsPage = false;
          this.isBetaPage = false;
        } else if (tempUrl.indexOf('/reports') != -1) {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isCollaborationPage = false;
          this.isFoundation29Page = false;
          this.isIntegrationPage = false;
          this.isFaqPage = false;
          this.isPrivacyPolicyPage = false;
          this.isReportsPage = true;
          this.isBetaPage = false;
         } else if (tempUrl.indexOf('/beta') != -1) {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isCollaborationPage = false;
          this.isFoundation29Page = false;
          this.isIntegrationPage = false;
          this.isFaqPage = false;
          this.isPrivacyPolicyPage = false;
          this.isReportsPage = false;
          this.isBetaPage = true;
         } else if (tempUrl.indexOf('/privacy-policy') != -1) {
            this.isHomePage = false;
            this.isAboutPage = false;
            this.isCollaborationPage = false;
            this.isFoundation29Page = false;
            this.isIntegrationPage = false;
            this.isFaqPage = false;
            this.isPrivacyPolicyPage = true;
            this.isReportsPage = false;
            this.isBetaPage = false;
        } else {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isCollaborationPage = false;
          this.isFoundation29Page = false;
          this.isIntegrationPage = false;
          this.isFaqPage = false;
          this.isPrivacyPolicyPage = false;
          this.isReportsPage = false;
          this.isBetaPage = false;
        }
      }
    );

    this._startTime = Date.now();
    
    // Cargar configuración de branding
    this.loadBrandingConfig();
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Valida si un código de idioma está en la lista de idiomas disponibles
   */
  private isValidLangCode(langCode: string | null): boolean {
    if (!langCode || langCode === 'undefined' || langCode === 'null' || langCode.trim() === '') {
      return false;
    }
    return this.langs.some(lang => lang.code === langCode);
  }

  /**
   * Obtiene el idioma de localStorage de forma segura, validando que sea válido
   */
  private getValidLangFromStorage(): string | null {
    const storedLang = localStorage.getItem('lang');
    if (this.isValidLangCode(storedLang)) {
      return storedLang;
    }
    // Si el valor es inválido, limpiarlo del localStorage
    if (storedLang) {
      localStorage.removeItem('lang');
    }
    return null;
  }

  loadLanguages() {
    this.langs = [
      {
        "name": "Deutsch",
        "code": "de"
      },
      {
        "name": "English",
        "code": "en"
      },
      {
        "name": "Español",
        "code": "es"
      },
      {
        "name": "Français",
        "code": "fr"
      },
      {
        "name": "Polski",
        "code": "pl"
      },
      {
        "name": "Русский",
        "code": "ru"
      },
      {
        "name": "Українська",
        "code": "uk"
      },
      {
        "name": "Català",
        "code": "ca"        
      }
    ];
    
    // Intentar obtener un idioma válido del localStorage
    const storedLang = this.getValidLangFromStorage();
    
    if (storedLang) {
      this.translate.use(storedLang);
      this.searchLangName(storedLang);
    } else {
      // No hay idioma válido en localStorage, intentar detectar del navegador
      const browserLang: string = this.translate.getBrowserLang();
      var foundlang = false;
      if (browserLang) {
        for (let lang of this.langs) {
          if (browserLang.match(lang.code)) {
            this.translate.use(lang.code);
            foundlang = true;
            localStorage.setItem('lang', lang.code);
            this.searchLangName(lang.name);
            break;
          }
        }
      }
      if (!foundlang) {
        // Usar 'en' como idioma por defecto si no se encuentra el idioma del navegador
        const defaultLang = 'en';
        this.translate.use(defaultLang);
        localStorage.setItem('lang', defaultLang);
        this.searchLangName(defaultLang);
      }
    }
    var eventsLang = this.inj.get(EventsService);
    eventsLang.broadcast('loadLang', localStorage.getItem('lang'));
    /*this.subscription.add(this.langService.getLangs()
      .subscribe((res: any) => {
        this.langs = res;
        if (localStorage.getItem('lang')) {
          this.translate.use(localStorage.getItem('lang'));
          this.searchLangName(localStorage.getItem('lang'));
        } else {
          const browserLang: string = this.translate.getBrowserLang();
          var foundlang = false;
          for (let lang of this.langs) {
            if (browserLang.match(lang.code)) {
              this.translate.use(lang.code);
              foundlang = true;
              localStorage.setItem('lang', lang.code);
              this.searchLangName(lang.name);
            }
          }
          if (!foundlang) {
            localStorage.setItem('lang', this.translate.store.currentLang);
          }
        }
        var eventsLang = this.inj.get(EventsService);
        eventsLang.broadcast('loadLang', localStorage.getItem('lang'));

      }, (err) => {
        console.log(err);
        this.insightsService.trackException(err);
      }));*/
  }

  /**
   * Obtiene el idioma actual de forma segura, con validación
   * Útil para otros componentes que necesiten obtener el idioma
   */
  getCurrentLang(): string {
    const validLang = this.getValidLangFromStorage();
    return validLang || 'en';
  }

  searchLangName(code: string) {
    if (this.isValidLangCode(code)) {
      this.currentLang = code;
    } else {
      // Si el código no es válido, usar el idioma por defecto
      this.currentLang = 'en';
    }
  }

  ChangeLanguage(language: string) {
    // Validar que el idioma sea válido antes de guardarlo
    if (!this.isValidLangCode(language)) {
      console.warn(`Idioma inválido: ${language}. Usando 'en' como fallback.`);
      language = 'en';
    }
    this.translate.use(language);
    localStorage.setItem('lang', language);
    this.searchLangName(language);
    var eventsLang = this.inj.get(EventsService);
    eventsLang.broadcast('changelang', language);
  }

  lauchEvent(category) {
    var secs = this.getElapsedSeconds();
    gtag('event', category, { 'myuuid': localStorage.getItem('uuid'), 'event_label': secs });
  }

  getElapsedSeconds() {
    var endDate = Date.now();
    var seconds = (endDate - this._startTime) / 1000;
    return seconds;
  };

  goBackEvent() {
    // Solo ejecutar el evento si estamos en la página principal
    if (this.isHomePage) {
      var eventsLang = this.inj.get(EventsService);
      eventsLang.broadcast('backEvent', true);
    }
  }

  /**
   * Carga la configuración de branding
   */
  private loadBrandingConfig(): void {
    this.subscription.add(
      this.brandingService.brandingConfig$.subscribe(config => {
        if (config) {
          this.headerLogo = config.logos.header;
          this.shouldShowDonate = config.links.donate !== null;
          this.shouldShowBeta = config.links.beta === true;
        }
      })
    );
  }
  toggleMenu() {
    this.isMenuExpanded = !this.isMenuExpanded;
  }

  closeMenu() {
    this.isMenuExpanded = false;
  }

   @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInsideMenu = target.closest('.navbar-collapse');
    const clickedToggleButton = target.closest('.navbar-toggler');
    const clickedInsideDropdown = target.closest('.dropdown-menu') || target.closest('[ngbDropdown]');

    // Solo cerrar el menú si:
    // 1. No se hizo clic dentro del menú Y no se hizo clic en el botón toggle
    // 2. O se hizo clic dentro del menú pero NO en el dropdown
    if (!clickedInsideMenu && !clickedToggleButton) {
      this.closeMenu();
    } else if (clickedInsideMenu && !clickedToggleButton && !clickedInsideDropdown) {
      this.closeMenu();
    }
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
      case 'clinicalData':
        return this.translate.instant('menu.DONATE_DROPDOWN_2');
      case 'datasets':
        return this.translate.instant('menu.DONATE_DROPDOWN_3');
      case 'subscribe':
        return this.translate.instant('support.NAV_SUBSCRIBE_TITLE');
      case 'contact':
      default:
        return this.translate.instant('menu.Contact us');
    }
  }

  /**
   * Alterna el modo Beta ON/OFF y navega a la ruta correspondiente
   */
  toggleBeta(): void {
    const goingToBeta = !this.isBetaPage;
    try {
      localStorage.setItem('betaEnabled', goingToBeta ? 'true' : 'false');
    } catch {}
    this.lauchEvent(`Toggle - Beta ${goingToBeta ? 'On' : 'Off'}`);
    if (goingToBeta) {
      this.router.navigate(['/beta']);
    } else {
      this.router.navigate(['/']);
    }
  }

}
