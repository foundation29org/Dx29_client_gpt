import { Component, OnInit, OnDestroy, NgZone, Inject, AfterContentInit } from '@angular/core';
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, mergeMap } from 'rxjs/operators';
import { Title, Meta } from '@angular/platform-browser';
import { EventsService } from 'app/shared/services/events.service';
import { IconsService } from 'app/shared/services/icon.service';
import { DOCUMENT } from '@angular/common';
import Swal from 'sweetalert2';
import { UuidService } from './shared/services/uuid.service';
import { BrandingService } from './shared/services/branding.service';
import { AnalyticsService } from './shared/services/analytics.service';

import {
  NgcCookieConsentService,
  NgcNoCookieLawEvent,
  NgcStatusChangeEvent,
} from "ngx-cookieconsent";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy, AfterContentInit {

  subscription: Subscription;
  tituloEvent: string = '';
  private startY: number = 0;
  private startX: number = 0;
  private scrollPosition: number = 0;
  private ticking: boolean = false;
  private isOpenSwal: boolean = false;
  private isEuMode: boolean = false;
  private statusChangeSubscription?: Subscription;
  private cookieConsentInitialized: boolean = false;

  constructor(
    @Inject(DOCUMENT) private document: Document, 
    private router: Router, 
    public translate: TranslateService, 
    private ccService: NgcCookieConsentService, 
    private eventsService: EventsService, 
    private titleService: Title, 
    private meta: Meta, 
    private activatedRoute: ActivatedRoute, 
    private ngZone: NgZone, 
    private iconsService: IconsService,
    private uuidService: UuidService,
    private brandingService: BrandingService,
    private analyticsService: AnalyticsService
  ) {
    // Inicializar el UUID al inicio de la aplicación
    this.uuidService.getUuid();

    // Detectar específicamente navegación hacia atrás
    window.onpopstate = (event) => {
      this.ngZone.run(() => {
        this.eventsService.broadcast('backEvent', event);
      });
    };
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Inicializa el sistema de cookies según el modo (EU o no-EU)
   * - EU mode: Muestra banner opt-in, carga analytics solo tras consentimiento
   * - Non-EU mode: Carga analytics inmediatamente (sin banner)
   */
  private initializeCookieConsent(): void {
    if (this.cookieConsentInitialized) return;
    this.cookieConsentInitialized = true;

    this.isEuMode = this.brandingService.isEuMode();

    if (this.isEuMode) {
      // EU MODE: GDPR compliance - requiere consentimiento explícito
      this.initializeEuModeCookies();
    } else {
      // NON-EU MODE: Cargar analytics inmediatamente (carga diferida, sin esperar consentimiento)
      this.analyticsService.setCookieConsent(true);
    }
  }

  /**
   * Inicializa el sistema de cookies para modo EU (GDPR)
   * - Configura el banner como opt-in
   * - Suscribe a eventos de cambio de estado
   * - Verifica si ya existe consentimiento previo
   */
  private initializeEuModeCookies(): void {
    console.log('Inicializando modo EU (GDPR) para cookies');

    // Configurar el cookie consent como opt-in y habilitarlo
    this.ccService.getConfig().type = 'opt-in';
    this.ccService.getConfig().enabled = true;
    this.ccService.getConfig().revokable = true; // Permitir cambiar de opinión en EU mode
    this.ccService.getConfig().cookie.domain = window.location.hostname;

    // Suscribirse a cambios de estado del consentimiento
    this.statusChangeSubscription = this.ccService.statusChange$.subscribe(
      (event: NgcStatusChangeEvent) => {
        this.handleCookieConsentChange(event);
      }
    );

    // Verificar si ya existe consentimiento previo guardado
    const existingConsent = this.ccService.hasConsented();
    if (existingConsent) {
      console.log('Consentimiento de cookies existente detectado');
      this.analyticsService.setCookieConsent(true);
    }

    // Cargar traducciones del banner
    this.updateCookieBannerTranslations();
  }

  /**
   * Maneja los cambios de estado del consentimiento de cookies
   */
  private handleCookieConsentChange(event: NgcStatusChangeEvent): void {
    console.log('Cookie consent status changed:', event.status);
    
    if (event.status === 'allow') {
      // Usuario aceptó las cookies - cargar analytics
      this.analyticsService.setCookieConsent(true);
    } else if (event.status === 'deny') {
      // Usuario rechazó las cookies - no cargar analytics
      this.analyticsService.setCookieConsent(false);
    }
  }

  ngAfterContentInit() {
    // En EU mode, Hotjar se carga a través de analyticsService tras consentimiento
    // Solo cargar directamente si NO es EU mode y es producción
    if (!this.document) return;
    
    // Si es EU mode, no cargar Hotjar aquí - se cargará tras consentimiento
    if (this.brandingService.isEuMode()) {
      return;
    }
    
    // Non-EU mode: cargar Hotjar directamente (comportamiento legacy)
    if (environment.production && (environment.tenantId === 'dxgpt-prod' || environment.tenantId === 'dxeugpt-prod')) {
      setTimeout(() => {
        this.analyticsService.loadHotjar();
      }, 2000);
    }
  }

  ngOnInit() {
    this.iconsService.loadIcons();
    
    // Inicializar el servicio de branding y configurar cookies cuando esté listo
    this.brandingService.brandingConfig$.subscribe(config => {
      if (config) {
        console.log('Branding config loaded:', config.name);
        // Inicializar el sistema de cookies una vez que tenemos la configuración
        this.initializeCookieConsent();
      }
    });

    this.meta.addTags([
      { name: 'keywords', content: this.translate.instant("seo.home.keywords") },
      { name: 'description', content: this.translate.instant("seo.home.description") },
      { name: 'title', content: this.translate.instant("seo.home.title") },
      { name: 'robots', content: 'index, follow' }
    ]);

    // Listener para el evento loadLang que se emite desde navbar-dx29
    this.eventsService.on('loadLang', async (lang) => {
      await this.delay(500);
      const titulo = this.translate.instant(this.tituloEvent || "seo.home.title");
      this.titleService.setTitle(titulo);
      this.changeMeta();

      // Solo actualizar el banner de cookies si estamos en EU mode
      if (this.isEuMode) {
        this.updateCookieBannerTranslations();
      }
    });

    this.subscription = this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .pipe(map(() => this.activatedRoute))
    .pipe(map((route) => {
      while (route.firstChild) route = route.firstChild;
      return route;
    }))
    .pipe(filter((route) => route.outlet === 'primary'))
    .pipe(mergeMap((route) => route.data))
    .subscribe((event) => {
      (async () => {
        
        // Verificar si hay un fragmento en la URL
        const fragment = this.router.url.split('#')[1];
        
        if (fragment) {
          // Si hay fragmento, esperar a que se renderice y hacer scroll al elemento
          setTimeout(() => {
            const element = document.getElementById(fragment);
            if (element) {
              // Calcular la posición considerando la altura del navbar (4.3rem = 68.8px)
              const navbarHeight = 70; // Un poco más que 4.3rem para dar margen
              const elementPosition = element.offsetTop - navbarHeight;
              
              window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
              });
            }
          }, 600);
        } else {
          // Si no hay fragmento, hacer scroll al top
          setTimeout(() => {
            window.scrollTo({
              top: 0,
              left: 0,
              behavior: 'auto'
            });
          }, 500);
        }
        
        await this.delay(500);
        this.tituloEvent = event['title'];
        const titulo = this.translate.instant(this.tituloEvent);
        this.titleService.setTitle(titulo);
        this.changeMeta();
        
        // Track page view con analytics
        this.analyticsService.trackPageView(titulo, {
          url: this.router.url,
          title: titulo,
          fragment: fragment || null
        });
      })();
    });

    this.eventsService.on('changelang', async (lang) => {
      await this.delay(500);
      const titulo = this.translate.instant(this.tituloEvent);
      this.titleService.setTitle(titulo);
      this.changeMeta();
      localStorage.setItem('lang', lang);

      // Solo actualizar el banner de cookies si estamos en EU mode
      if (this.isEuMode) {
        this.updateCookieBannerTranslations();
      }
    });

    window.addEventListener('scroll', this.onScroll.bind(this), true);
      document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
      document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
  }

  private onScroll() {
    this.scrollPosition = window.pageYOffset;
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  private onTouchStart(e: TouchEvent) {
    this.startY = e.touches[0].pageY;
    this.startX = e.touches[0].pageX;
  }

  private onTouchMove(e: TouchEvent) {
    const y = e.touches[0].pageY;
    const x = e.touches[0].pageX;
    
    // Calcula la distancia y el ángulo del gesto
    const deltaY = y - this.startY;
    const deltaX = x - this.startX;
    const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
    
    // Si el gesto es principalmente vertical (ángulo > 60°) y hacia abajo
    if (angle > 60 && deltaY > 0 && this.scrollPosition <= 0) {
      e.preventDefault();
      this.ngZone.run(() => {
        this.showReloadConfirmation();
      });
    }
  }

  private showReloadConfirmation() {
    if (this.isOpenSwal) {
      return;
    }
    this.isOpenSwal = true;
    const config = this.brandingService.getBrandingConfig();
    Swal.fire({
      title: this.translate.instant("generics.Reload the page"),
      text: this.translate.instant("generics.Unsaved changes will be lost"),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: config?.colors.primary || '#B30000',
      cancelButtonColor: '#B0B6BB',
      confirmButtonText: this.translate.instant("generics.Yes, reload"),
      cancelButtonText: this.translate.instant("generics.Cancel")
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      }
      this.isOpenSwal = false;
    });
  }


  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.statusChangeSubscription) {
      this.statusChangeSubscription.unsubscribe();
    }
  }

  /**
   * Actualiza las traducciones del banner de cookies (solo para EU mode)
   */
  private updateCookieBannerTranslations(): void {
    this.translate
      .get(['cookie.header', 'cookie.message', 'cookie.dismiss', 'cookie.allow', 'cookie.deny', 'cookie.link', 'cookie.policy'])
      .subscribe(data => {
        this.ccService.getConfig().content = this.ccService.getConfig().content || {};
        // Override default messages with the translated ones
        this.ccService.getConfig().content.header = data['cookie.header'];
        this.ccService.getConfig().content.message = data['cookie.message'];
        this.ccService.getConfig().content.dismiss = data['cookie.dismiss'];
        this.ccService.getConfig().content.allow = data['cookie.allow'];
        this.ccService.getConfig().content.deny = data['cookie.deny'];
        this.ccService.getConfig().content.link = data['cookie.link'];
        this.ccService.getConfig().content.policy = data['cookie.policy'];
        this.ccService.getConfig().content.href = 'https://dxgpt.app/cookies';
        this.ccService.destroy(); // Remove previous cookie bar (with default messages)
        this.ccService.init(this.ccService.getConfig()); // Update config with translated messages
      });
  }

  changeMeta() {
    this.meta.updateTag({ name: 'keywords', content: this.translate.instant("seo.home.keywords") });
    this.meta.updateTag({ name: 'description', content: this.translate.instant("seo.home.description") });
    this.meta.updateTag({ name: 'title', content: this.translate.instant("seo.home.title") });
  }



}