import { Component, OnInit, OnDestroy, NgZone, Inject, DOCUMENT, Optional, PLATFORM_ID, REQUEST } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, mergeMap } from 'rxjs/operators';
import { Title, Meta } from '@angular/platform-browser';
import { EventsService } from 'app/shared/services/events.service';
import { IconsService } from 'app/shared/services/icon.service';

import { UuidService } from './shared/services/uuid.service';
import { BrandingService } from './shared/services/branding.service';
import { AnalyticsService } from './shared/services/analytics.service';
import { DEFAULT_SEO, getSeoForUrl, SeoRouteConfig } from './shared/seo/seo-routes';

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

  subscription!: Subscription;
  tituloEvent: string = '';
  private seoTitleEvent: string = DEFAULT_SEO.seoTitle;
  private seoDescriptionEvent: string = DEFAULT_SEO.seoDescription;
  private canonicalPath: string = DEFAULT_SEO.canonicalPath || '/';
  private robotsContent: string = 'index, follow';
  private brandingDisplayName: string = 'DxGPT';
  private brandingDescription: string = 'AI-powered diagnostic assistance';
  private requiresCookieConsent: boolean = false;
  private unloadGuardEnabled: boolean = false;
  private statusChangeSubscription?: Subscription;
  private langChangeSubscription?: Subscription;
  private cookieInitializedSubscription?: Subscription;
  private cookieConsentInitialized: boolean = false;
  private cookieConsentPopupInitialized: boolean = false;
  private cookieConsentScriptPromise?: Promise<void>;
  private cookieConsentConfig?: NgcCookieConsentConfig;
  // Confirmacion nativa del navegador ante recarga/cierre mientras hay un diagnostico en pantalla.
  private readonly boundBeforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = '';
  };

  constructor(
    @Inject(DOCUMENT) private document: Document, 
    @Inject(PLATFORM_ID) private platformId: Object,
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
    private analyticsService: AnalyticsService,
    @Optional() @Inject(REQUEST) private request: Request | null
  ) {
    // Inicializar el UUID al inicio de la aplicación
    this.uuidService.getUuid();

    // Detectar específicamente navegación hacia atrás
    if (isPlatformBrowser(this.platformId)) {
      window.onpopstate = (event) => {
        this.ngZone.run(() => {
          this.eventsService.broadcast('backEvent', event);
        });
      };
    }
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
    config.cookie = config.cookie || {};
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

        if (this.ccService.hasConsented() && !this.analyticsService.hasCookieConsent()) {
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
    const isBrowser = isPlatformBrowser(this.platformId);
    if (isBrowser) {
      this.iconsService.loadIcons();
    }
    
    // Inicializar el servicio de branding y configurar cookies cuando esté listo
    this.brandingService.brandingConfig$.subscribe(config => {
      if (config) {
        console.log('Branding config loaded:', config.name);
        this.brandingDisplayName = config.displayName;
        this.brandingDescription = config.description;
        this.changeMeta();
        // Inicializar el sistema de cookies una vez que tenemos la configuración
        if (isBrowser) {
          this.initializeCookieConsent();
        }
      }
    });

    this.setDocumentLang(this.translate.currentLang || this.translate.getDefaultLang());
    this.langChangeSubscription = this.translate.onLangChange.subscribe(({ lang }) => this.setDocumentLang(lang));

    const initialUrl = this.request?.url ||
      (isBrowser ? this.document.location.pathname : this.router.url);
    this.applySeoConfig(getSeoForUrl(initialUrl));
    this.changeMeta();

    // Listener para el evento loadLang que se emite desde navbar-dx29
    this.eventsService.on('loadLang', async (lang: string) => {
      await this.delay(500);
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
        
        if (isBrowser && fragment) {
          // Si hay fragmento, esperar a que se renderice y hacer scroll al elemento
          setTimeout(() => {
            const element = this.document.getElementById(fragment);
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
        } else if (isBrowser) {
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
        const urlSeo = getSeoForUrl(this.router.url);
        this.tituloEvent = event['title'] || 'menu.Home';
        this.seoTitleEvent = event['seoTitle'] || urlSeo.seoTitle;
        this.seoDescriptionEvent = event['seoDescription'] || urlSeo.seoDescription;
        this.canonicalPath = event['canonicalPath'] || urlSeo.canonicalPath || this.getCurrentCanonicalPath();
        this.robotsContent = event['robots'] || urlSeo.robots || 'index, follow';
        const titulo = this.translate.instant(this.tituloEvent);
        this.changeMeta();
        
        // Track page view con analytics
        if (isBrowser) {
          this.analyticsService.trackPageView(titulo, {
            url: this.router.url,
            title: titulo,
            fragment: fragment || null
          });
        }
      })();
    });

    this.eventsService.on('changelang', async (lang: string) => {
      await this.delay(500);
      this.changeMeta();
      if (isBrowser) {
        localStorage.setItem('lang', lang);
      }

      // Solo actualizar el banner si el usuario requiere consentimiento
      if (this.requiresCookieConsent) {
        this.updateCookieBannerTranslations();
      }
    });

    // Mientras hay diagnosticos en pantalla, una recarga (F5, menu del navegador, etc.) los borraria:
    // se delega la confirmacion al navegador, que es la unica via fiable de bloquearla.
    this.eventsService.on('hasDiagnostics', (hasDiagnostics: boolean) => {
      this.updateUnloadGuard(hasDiagnostics);
    });
  }

  private updateUnloadGuard(shouldEnable: boolean) {
    if (!isPlatformBrowser(this.platformId)) return;

    if (shouldEnable && !this.unloadGuardEnabled) {
      window.addEventListener('beforeunload', this.boundBeforeUnload);
      this.unloadGuardEnabled = true;
      return;
    }

    if (!shouldEnable && this.unloadGuardEnabled) {
      window.removeEventListener('beforeunload', this.boundBeforeUnload);
      this.unloadGuardEnabled = false;
    }
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
    this.langChangeSubscription?.unsubscribe();
    this.updateUnloadGuard(false);
  }

  // WCAG 3.1.1: screen readers pick pronunciation from <html lang>.
  private setDocumentLang(lang: string | undefined): void {
    if (lang) {
      this.document.documentElement.setAttribute('lang', lang);
    }
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

  changeMeta(): void {
    const isPublicDxgpt =
      this.brandingService.getCurrentTenant() === 'dxgpt' ||
      this.brandingService.getCurrentTenant() === 'dxeugpt';
    const routeTitle = this.translate.instant(this.tituloEvent || 'menu.Home');
    const title = isPublicDxgpt
      ? this.translate.instant(this.seoTitleEvent)
      : routeTitle && routeTitle !== 'DxGPT'
        ? `${routeTitle} | ${this.brandingDisplayName}`
        : this.brandingDisplayName;
    const description = isPublicDxgpt
      ? this.translate.instant(this.seoDescriptionEvent)
      : this.brandingDescription;

    this.titleService.setTitle(title);
    this.meta.updateTag({ name: 'keywords', content: this.translate.instant("seo.home.keywords") });
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'title', content: title });
    this.meta.updateTag({ name: 'robots', content: this.robotsContent });
    this.meta.updateTag({ property: 'og:title', content: title }, "property='og:title'");
    this.meta.updateTag({ property: 'og:description', content: description }, "property='og:description'");
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    const canonicalUrl = new URL(
      this.canonicalPath || this.getCurrentCanonicalPath(),
      isPlatformBrowser(this.platformId)
        ? this.document.location?.origin || 'https://dxgpt.app'
        : 'https://dxgpt.app'
    ).toString();
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl }, "property='og:url'");
    this.updateCanonicalLink(canonicalUrl);
  }

  private applySeoConfig(config: SeoRouteConfig): void {
    this.seoTitleEvent = config.seoTitle;
    this.seoDescriptionEvent = config.seoDescription;
    this.canonicalPath = config.canonicalPath || this.getCurrentCanonicalPath();
    this.robotsContent = config.robots || 'index, follow';
  }

  private getCurrentCanonicalPath(): string {
    const path = this.router.url.split(/[?#]/, 1)[0];
    return !path || path === '/.' ? '/' : path;
  }

  private updateCanonicalLink(canonicalUrl: string): void {
    let canonicalLink = this.document.querySelector<HTMLLinkElement>("link[rel='canonical']");

    if (!canonicalLink) {
      canonicalLink = this.document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonicalLink);
    }

    canonicalLink.setAttribute('href', canonicalUrl);
  }



}