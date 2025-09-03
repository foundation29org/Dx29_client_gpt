import { Component, HostListener, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  @ViewChild('clinicalDataModal', { static: true }) clinicalDataModal: TemplateRef<any>;
  @ViewChild('datasetsModal', { static: true }) datasetsModal: TemplateRef<any>;

  currentLang = 'en';
  langs: any;
  isHomePage: boolean = false;
  isAboutPage: boolean = false;
  isQuienesSomosPage: boolean = false;
  isTransparenciaPage: boolean = false;
  isFaqPage: boolean = false;
  isPrivacyPolicyPage: boolean = false;
  isReportsPage: boolean = false;
  _startTime: any;
  private subscription: Subscription = new Subscription();
  isMenuExpanded = false;
  headerLogo: string = 'assets/img/logo-Dx29.webp';
  shouldShowDonate: boolean = true;

  // Form properties
  clinicalDataForm: FormGroup;
  datasetsForm: FormGroup;
  private modalRef: NgbModalRef;

  constructor(
    public translate: TranslateService, 
    private langService: LangService, 
    private router: Router, 
    private inj: Injector, 
    public insightsService: InsightsService,
    private brandingService: BrandingService,
    private modalService: NgbModal, 
    private formBuilder: FormBuilder
  ) {
    this.initializeForms();
    this.loadLanguages();
    this.router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd)
    ).subscribe(
      event => {
        const tempUrl = (event.url).toString();
        
        // Reset all flags first
        this.resetAllPageFlags();
        
        // Set active page based on URL
        if (tempUrl.indexOf('/.') != -1 || tempUrl == '/') {
          this.isHomePage = true;
        } else if (tempUrl.indexOf('/aboutus') != -1) {
          this.isAboutPage = true;
        } else if (tempUrl.indexOf('/quienes-somos') != -1 || tempUrl.indexOf('/fundacion-29') != -1) {
          this.isQuienesSomosPage = true;
        } else if (tempUrl.indexOf('/transparencia') != -1) {
          this.isTransparenciaPage = true;
        } else if (tempUrl.indexOf('/faq') != -1) {
          this.isFaqPage = true;
        } else if (tempUrl.indexOf('/reports') != -1) {
          this.isReportsPage = true;
        } else if (tempUrl.indexOf('/privacy-policy') != -1) {
          this.isPrivacyPolicyPage = true;
        }
        // Note: If no match, all flags remain false (which is correct)
      }
    );

    this._startTime = Date.now();
    
    // Cargar configuración de branding
    this.loadBrandingConfig();
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Helper method to reset all page flags
  private resetAllPageFlags() {
    this.isHomePage = false;
    this.isAboutPage = false;
    this.isQuienesSomosPage = false;
    this.isTransparenciaPage = false;
    this.isFaqPage = false;
    this.isPrivacyPolicyPage = false;
    this.isReportsPage = false;
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
      }
    ];
    if (sessionStorage.getItem('lang')) {
      this.translate.use(sessionStorage.getItem('lang'));
      this.searchLangName(sessionStorage.getItem('lang'));
    } else {
      const browserLang: string = this.translate.getBrowserLang();
      var foundlang = false;
      for (let lang of this.langs) {
        if (browserLang.match(lang.code)) {
          this.translate.use(lang.code);
          foundlang = true;
          sessionStorage.setItem('lang', lang.code);
          this.searchLangName(lang.name);
        }
      }
      if (!foundlang) {
        sessionStorage.setItem('lang', this.translate.store.currentLang);
      }
    }
    var eventsLang = this.inj.get(EventsService);
    eventsLang.broadcast('loadLang', sessionStorage.getItem('lang'));
    /*this.subscription.add(this.langService.getLangs()
      .subscribe((res: any) => {
        this.langs = res;
        if (sessionStorage.getItem('lang')) {
          this.translate.use(sessionStorage.getItem('lang'));
          this.searchLangName(sessionStorage.getItem('lang'));
        } else {
          const browserLang: string = this.translate.getBrowserLang();
          var foundlang = false;
          for (let lang of this.langs) {
            if (browserLang.match(lang.code)) {
              this.translate.use(lang.code);
              foundlang = true;
              sessionStorage.setItem('lang', lang.code);
              this.searchLangName(lang.name);
            }
          }
          if (!foundlang) {
            sessionStorage.setItem('lang', this.translate.store.currentLang);
          }
        }
        var eventsLang = this.inj.get(EventsService);
        eventsLang.broadcast('loadLang', sessionStorage.getItem('lang'));

      }, (err) => {
        console.log(err);
        this.insightsService.trackException(err);
      }));*/
  }

  searchLangName(code: string) {
    for (let lang of this.langs) {
      var actualLang = sessionStorage.getItem('lang');
      if (actualLang == lang.code) {
        this.currentLang = lang.code;
      }
    }
  }

  ChangeLanguage(language: string) {
    this.translate.use(language);
    sessionStorage.setItem('lang', language);
    this.searchLangName(language);
    var eventsLang = this.inj.get(EventsService);
    eventsLang.broadcast('changelang', language);
  }

  lauchEvent(category) {
    var secs = this.getElapsedSeconds();
    gtag('event', category, { 'myuuid': sessionStorage.getItem('uuid'), 'event_label': secs });
  }

  getElapsedSeconds() {
    var endDate = Date.now();
    var seconds = (endDate - this._startTime) / 1000;
    return seconds;
  };

  goBackEvent() {
    var eventsLang = this.inj.get(EventsService);
    eventsLang.broadcast('backEvent', true);
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
        }
      })
    );
  }

  // Unified navigation method that ALWAYS scrolls to top
  navigateWithScroll(route: string, eventName?: string) {
    // Execute analytics if provided
    if (eventName) {
      this.lauchEvent(eventName);
    }
    
    // Close mobile menu if open
    this.closeMenu();
    
    // Always scroll to top immediately (before navigation to prevent flash)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    
    // Force navigation even to same route by using navigateByUrl
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([route]).then(() => {
        // For home page, trigger the back event AFTER successful navigation
        if (route === '/.') {
          setTimeout(() => this.goBackEvent(), 100);
        }
      });
    });
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

    if (!clickedInsideMenu && !clickedToggleButton) {
      this.closeMenu();
    } else if (clickedInsideMenu && !clickedToggleButton) {
      this.closeMenu();
    }
  }

  // Initialize forms
  private initializeForms() {
    this.clinicalDataForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required]]
    });

    this.datasetsForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required]]
    });
  }

  // Modal methods for donation
  openClinicalDataModal() {
    this.clinicalDataForm.reset();
    this.modalRef = this.modalService.open(this.clinicalDataModal, { 
      size: 'lg',
      centered: true 
    });
  }

  openDatasetsModal() {
    this.datasetsForm.reset();
    this.modalRef = this.modalService.open(this.datasetsModal, { 
      size: 'lg',
      centered: true 
    });
  }

  // Submit methods with email functionality
  submitClinicalDataForm() {
    if (this.clinicalDataForm.valid) {
      const formData = this.clinicalDataForm.value;
      const subject = 'Formulario: botón para donar datos clínicos individuales';
      const body = `${subject}\n\nNombre: ${formData.name}\nEmail: ${formData.email}\n\nMensaje:\n${formData.message}`;
      
      // Create mailto link
      const mailtoLink = `mailto:support@foundation29.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open email client
      window.location.href = mailtoLink;
      
      // Close modal
      this.modalRef.close();
      
      // Show success message
      alert('Se ha abierto tu cliente de correo con la información lista para enviar.');
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.clinicalDataForm.controls).forEach(key => {
        this.clinicalDataForm.get(key)?.markAsTouched();
      });
    }
  }

  submitDatasetsForm() {
    if (this.datasetsForm.valid) {
      const formData = this.datasetsForm.value;
      const subject = 'Formulario: botón para donar datasets (instituciones/investigación)';
      const body = `${subject}\n\nNombre: ${formData.name}\nEmail: ${formData.email}\n\nMensaje:\n${formData.message}`;
      
      // Create mailto link
      const mailtoLink = `mailto:support@foundation29.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open email client
      window.location.href = mailtoLink;
      
      // Close modal
      this.modalRef.close();
      
      // Show success message
      alert('Se ha abierto tu cliente de correo con la información lista para enviar.');
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.datasetsForm.controls).forEach(key => {
        this.datasetsForm.get(key)?.markAsTouched();
      });
    }
  }

}
