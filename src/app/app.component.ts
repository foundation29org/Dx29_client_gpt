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

  ngAfterContentInit() {
    if (!this.document) return;
    
    if(environment.production) {
      ((h: any, o: Document, t: string, j: string, a?: any, r?: any) => {
        h.hj = h.hj || function() {
          (h.hj.q = h.hj.q || []).push(arguments);
        };
        h._hjSettings = { 
          hjid: environment.hotjarSiteId, 
          hjsv: 6,
          cookieDomain: 'https://dxgpt.app',
          cookieSecure: true,
          cookieSameSite: 'Lax'
        };
        a = o.getElementsByTagName('head')[0];
        r = o.createElement('script');
        r.async = 1;
        r.defer = true;
        r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
        // Cargar Hotjar después de que la página esté lista
        setTimeout(() => {
          a?.appendChild(r);
        }, 2000);
      })(window as any, this.document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
    }
  }

  ngOnInit() {
    this.iconsService.loadIcons();
    
    // Inicializar el servicio de branding
    this.brandingService.brandingConfig$.subscribe(config => {
      if (config) {
        console.log('Branding config loaded:', config.name);
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
          this.ccService.destroy(); //remove previous cookie bar (with default messages)
          this.ccService.init(this.ccService.getConfig()); // update config with translated messages
        });
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
      sessionStorage.setItem('lang', lang);


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
          this.ccService.destroy();//remove previous cookie bar (with default messages)
          this.ccService.init(this.ccService.getConfig()); // update config with translated messages
        });

    });

    this.ccService.getConfig().cookie.domain = window.location.hostname;


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
        this.ccService.destroy();//remove previous cookie bar (with default messages)
        this.ccService.init(this.ccService.getConfig()); // update config with translated messages
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
  }

  changeMeta() {
    this.meta.updateTag({ name: 'keywords', content: this.translate.instant("seo.home.keywords") });
    this.meta.updateTag({ name: 'description', content: this.translate.instant("seo.home.description") });
    this.meta.updateTag({ name: 'title', content: this.translate.instant("seo.home.title") });
  }



}