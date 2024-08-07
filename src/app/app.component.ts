import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { Title, Meta } from '@angular/platform-browser';
import { EventsService } from 'app/shared/services/events.service';
import Swal from 'sweetalert2';

import {
  NgcCookieConsentService,
  NgcNoCookieLawEvent,
  NgcStatusChangeEvent,
} from "ngx-cookieconsent";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {

  subscription: Subscription;
  tituloEvent: string = '';
  private startY: number = 0;
  private startX: number = 0;
  private scrollPosition: number = 0;
  private ticking: boolean = false;
  private isOpenSwal: boolean = false;
  constructor(private router: Router, public translate: TranslateService, private ccService: NgcCookieConsentService, private eventsService: EventsService, private titleService: Title, private meta: Meta, private activatedRoute: ActivatedRoute, private ngZone: NgZone) {
    this.translate.use('en');
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ngOnInit() {

    this.meta.addTags([
      { name: 'keywords', content: this.translate.instant("seo.home.keywords") },
      { name: 'description', content: this.translate.instant("seo.home.description") },
      { name: 'title', content: this.translate.instant("seo.home.title") },
      { name: 'robots', content: 'index, follow' }
    ]);

    this.subscription = this.router.events
      .filter((event) => event instanceof NavigationEnd)
      .map(() => this.activatedRoute)
      .map((route) => {
        while (route.firstChild) route = route.firstChild;
        return route;
      })
      .filter((route) => route.outlet === 'primary')
      .mergeMap((route) => route.data)
      .subscribe((event) => {
        (async () => {
          window.scrollTo(0, 0);
          await this.delay(500);
          this.tituloEvent = event['title'];
          var titulo = this.translate.instant(this.tituloEvent);
          this.titleService.setTitle(titulo);
          this.changeMeta();
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
          this.ccService.getConfig().content.href = environment.serverapi + '/cookies';
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
        this.ccService.getConfig().content.href = environment.serverapi + '/cookies';
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
    Swal.fire({
      title: this.translate.instant("generics.Reload the page"),
      text: this.translate.instant("generics.Unsaved changes will be lost"),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#B30000',
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