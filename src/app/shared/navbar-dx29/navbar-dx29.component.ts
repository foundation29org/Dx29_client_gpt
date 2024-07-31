import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { LangService } from 'app/shared/services/lang.service';
import { EventsService } from 'app/shared/services/events.service';
import { Injectable, Injector } from '@angular/core';
import { InsightsService } from 'app/shared/services/azureInsights.service';

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
  isFaqPage: boolean = false;
  isReportsPage: boolean = false;
  _startTime: any;
  private subscription: Subscription = new Subscription();
  isMenuExpanded = false;

  constructor(public translate: TranslateService, private langService: LangService, private router: Router, private inj: Injector, public insightsService: InsightsService) {
    /*this.translate.use('en');
    sessionStorage.setItem('lang', 'en');*/
    this.loadLanguages();
    this.router.events.filter((event: any) => event instanceof NavigationEnd).subscribe(

      event => {
        var tempUrl = (event.url).toString();
        if (tempUrl.indexOf('/.') != -1 || tempUrl == '/') {
          this.isHomePage = true;
          this.isAboutPage = false;
          this.isFaqPage = false;
          this.isReportsPage = false;
        } else if (tempUrl.indexOf('/aboutus') != -1) {
          this.isHomePage = false;
          this.isAboutPage = true;
          this.isFaqPage = false;
          this.isReportsPage = false;
        }else if (tempUrl.indexOf('/faq') != -1) {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isFaqPage = true;
          this.isReportsPage = false;
        } else if (tempUrl.indexOf('/reports') != -1) {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isFaqPage = false;
          this.isReportsPage = true;
        } else {
          this.isHomePage = false;
          this.isAboutPage = false;
          this.isFaqPage = false;
          this.isReportsPage = false;
        }
      }
    );

    this._startTime = Date.now();
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadLanguages() {
    this.subscription.add(this.langService.getLangs()
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

      }, (err) => {
        console.log(err);
        this.insightsService.trackException(err);
      }));
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
  toggleMenu() {
    this.isMenuExpanded = !this.isMenuExpanded;
  }

  closeMenu() {
    this.isMenuExpanded = false;
  }

}
