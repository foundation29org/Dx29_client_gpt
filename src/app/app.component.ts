import { Component, OnInit, OnDestroy, NgZone, Inject } from '@angular/core';
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
  NgcCookieConsentConfig,
  NgcCookieConsentService,
  NgcStatusChangeEvent,
} from "ngx-cookieconsent";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: false
})
export class AppComponent implements OnInit, OnDestroy {

  subscription: Subscription;
  tituloEvent: string = '';
  private startY: number = 0;
  private startX: number = 0;
  private scrollPosition: number = 0;
  private ticking: boolean = false;
  private isOpenSwal: boolean = false;
  private requiresCookieConsent: boolean = false;
  private hasDiagnostics: boolean = false;
  private touchGuardEnabled: boolean = false;
  private statusChangeSubscription?: Subscription;
  private cookieInitializedSubscription?: Subscription;
  private cookieConsentInitialized: boolean = false;
  private cookieConsentPopupInitialized: boolean = false;
  private cookieConsentScriptPromise?: Promise<void>;
  private cookieConsentConfig?: NgcCookieConsentConfig;
  private readonly boundTouchStart = (event: TouchEvent) => this.onTouchStart(event);
  private readonly boundTouchMove = (event: TouchEvent) => this.onTouchMove(event);

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
   * Inicializa el sistema de cookies según la ubicación probable del usuario.
   * - Europa: muestra banner opt-in y carga analytics solo tras consentimiento.
   * - Resto: carga analytics inmediatamente sin mostrar el banner.
   */
  private initializeCookieConsent(): void {
    if (this.cookieConsentInitialized) return;
    this.cookieConsentInitialized = true;

    this.requiresCookieConsent = this.shouldRequireCookieConsent();

    if (this.requiresCookieConsent) {
      void this.initializeEuModeCookies();
    } else {
      this.analyticsService.setCookieConsent(true);
    }
  }

  /**
   * Muestra consentimiento solo para el DxGPT público:
   * - tenant europeo explícito (euMode)
   * - tenant normal dxgpt cuando el usuario parece estar en Europa
   *
   * Los tenants internos sanitarios no cargan marketing analytics y no necesitan este banner.
   */
  private shouldRequireCookieConsent(): boolean {
    if (this.brandingService.isEuMode()) return true;

    const isPublicDxgptTenant = this.brandingService.getCurrentTenant() === 'dxgpt';
    if (!isPublicDxgptTenant) return false;

    return this.isLikelyEuropeanUser();
  }

  /**
   * Heurística local y sin llamadas externas. Para cumplimiento estricto convendría
   * resolverlo en backend/CDN por país, pero evita geolocation de terceros en el arranque.
   */
  private isLikelyEuropeanUser(): boolean {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return timeZone.startsWith('Europe/') ||
      timeZone === 'Africa/Ceuta' ||
      timeZone === 'Atlantic/Canary' ||
      timeZone === 'Atlantic/Madeira' ||
      timeZone === 'Atlantic/Azores' ||
      timeZone === 'Atlantic/Faroe' ||
      timeZone === 'Atlantic/Reykjavik' ||
      timeZone === 'Asia/Cyprus' ||
      timeZone === 'Asia/Famagusta' ||
      timeZone === 'Asia/Nicosia';
  }

  private async loadCookieConsentScript(): Promise<void> {
    if (typeof window === 'undefined' || (window as any).cookieconsent) return;

    if (!this.cookieConsentScriptPromise) {
      this.cookieConsentScriptPromise = new Promise<void>((resolve, reject) => {
        const script = this.document.createElement('script');
        script.src = 'assets/js/cookieconsent.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Could not load cookieconsent.min.js'));
        this.document.body.appendChild(script);
      });
    }

    return this.cookieConsentScriptPromise;
  }

  private getCookieConsentConfig(): NgcCookieConsentConfig {
    if (this.cookieConsentConfig) return this.cookieConsentConfig;

    this.cookieConsentConfig = {
      cookie: {
        domain: window.location.hostname
      },
      palette: {
        popup: {
          background: '#fff'
        },
        button: {
          background: '#000000'
        }
      },
      theme: 'edgeless',
      type: 'opt-in',
      enabled: true,
      revokable: true
    } as NgcCookieConsentConfig;

    return this.cookieConsentConfig;
  }

  /**
   * Inicializa el sistema de cookies para modo EU (GDPR)
   * - Configura el banner como opt-in
   * - Suscribe a eventos de cambio de estado
   * - Verifica si ya existe consentimiento previo
   */
  private async initializeEuModeCookies(): Promise<void> {
    console.log('Inicializando modo EU (GDPR) para cookies');

    try {
      await this.loadCookieConsentScript();
    } catch (error) {
      console.warn('No se pudo cargar el banner de consentimiento de cookies', error);
      this.analyticsService.setCookieConsent(false);
      return;
    }

    const config = this.getCookieConsentConfig();

    // Configurar el cookie consent como opt-in y habilitarlo
    config.type = 'opt-in';
    config.enabled = true;
    config.revokable = true; // Permitir cambiar de opinión en Europa
    config.cookie.domain = window.location.hostname;

    // Suscribirse a cambios de estado del consentimiento
    if (!this.statusChangeSubscription) {
      this.statusChangeSubscription = this.ccService.statusChange$.subscribe(
        (event: NgcStatusChangeEvent) => {
          this.handleCookieConsentChange(event);
        }
      );
    }

    if (!this.cookieInitializedSubscription) {
      this.cookieInitializedSubscription = this.ccService.initialized$.subscribe(() => {
        this.cookieConsentPopupInitialized = true;

        if (this.ccService.hasConsented()) {
          console.log('Consentimiento de cookies existente detectado');
          this.analyticsService.setCookieConsent(true);
        }
      });
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

    this.meta.updateTag({ name: 'keywords', content: this.translate.instant("seo.home.keywords") });
    this.meta.updateTag({ name: 'description', content: this.translate.instant("seo.home.description") });
    this.meta.updateTag({ name: 'title', content: this.translate.instant("seo.home.title") });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // Listener para el evento loadLang que se emite desde navbar-dx29
    this.eventsService.on('loadLang', async (lang) => {
      await this.delay(500);
      const titulo = this.translate.instant(this.tituloEvent || "seo.home.title");
      this.titleService.setTitle(titulo);
      this.changeMeta();

      // Solo actualizar el banner si el usuario requiere consentimiento
      if (this.requiresCookieConsent) {
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

      // Solo actualizar el banner si el usuario requiere consentimiento
      if (this.requiresCookieConsent) {
        this.updateCookieBannerTranslations();
      }
    });

    window.addEventListener('scroll', this.onScroll.bind(this), true);

    // Escuchar cuando hay diagnósticos activos para mostrar popup de confirmación
    this.eventsService.on('hasDiagnostics', (hasDiagnostics: boolean) => {
      this.hasDiagnostics = hasDiagnostics;
      this.updateTouchGuard(hasDiagnostics);
    });
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

  private updateTouchGuard(shouldEnable: boolean) {
    if (shouldEnable && !this.touchGuardEnabled) {
      document.addEventListener('touchstart', this.boundTouchStart, { passive: true });
      document.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      this.touchGuardEnabled = true;
      return;
    }

    if (!shouldEnable && this.touchGuardEnabled) {
      document.removeEventListener('touchstart', this.boundTouchStart);
      document.removeEventListener('touchmove', this.boundTouchMove);
      this.touchGuardEnabled = false;
    }
  }

  private onTouchMove(e: TouchEvent) {
    const y = e.touches[0].pageY;
    const x = e.touches[0].pageX;
    
    // Calcula la distancia y el ángulo del gesto
    const deltaY = y - this.startY;
    const deltaX = x - this.startX;
    const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
    
    // Si el gesto es principalmente vertical (ángulo > 60°), hacia abajo y con suficiente desplazamiento
    // Solo mostrar popup si hay diagnósticos que perder
    if (angle > 60 && deltaY > 80 && this.scrollPosition <= 0 && this.hasDiagnostics) {
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
      confirmButtonColor: '#B0B6BB',
      cancelButtonColor: config?.colors.primary || '#B30000',
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
    if (this.cookieInitializedSubscription) {
      this.cookieInitializedSubscription.unsubscribe();
    }
    this.updateTouchGuard(false);
  }

  /**
   * Actualiza las traducciones del banner de cookies (solo para EU mode)
   */
  private updateCookieBannerTranslations(): void {
    if (!this.requiresCookieConsent || typeof window === 'undefined' || !(window as any).cookieconsent) return;

    const config = this.getCookieConsentConfig();

    this.translate
      .get(['cookie.header', 'cookie.message', 'cookie.dismiss', 'cookie.allow', 'cookie.deny', 'cookie.link', 'cookie.policy'])
      .subscribe(data => {
        config.content = config.content || {};
        // Override default messages with the translated ones
        config.content.header = data['cookie.header'];
        config.content.message = data['cookie.message'];
        config.content.dismiss = data['cookie.dismiss'];
        config.content.allow = data['cookie.allow'];
        config.content.deny = data['cookie.deny'];
        config.content.link = data['cookie.link'];
        config.content.policy = data['cookie.policy'];
        config.content.href = 'https://dxgpt.app/cookies';

        if (this.cookieConsentPopupInitialized) {
          this.ccService.destroy(); // Remove previous cookie bar before reinitializing with new language
          this.cookieConsentPopupInitialized = false;
        }

        this.ccService.init(config); // Update config with translated messages
      });
  }

  changeMeta() {
    this.meta.updateTag({ name: 'keywords', content: this.translate.instant("seo.home.keywords") });
    this.meta.updateTag({ name: 'description', content: this.translate.instant("seo.home.description") });
    this.meta.updateTag({ name: 'title', content: this.translate.instant("seo.home.title") });
  }



}