import { Component, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap'
import { Subscription } from 'rxjs/Subscription';
import { Router, NavigationEnd, ActivatedRoute, NavigationStart, NavigationCancel } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { LangService } from 'app/shared/services/lang.service';
import Swal from 'sweetalert2';
import { EventsService } from 'app/shared/services/events.service';
import { NgxHotjarService } from 'ngx-hotjar';

import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';
import {
  NgcCookieConsentService,
  NgcNoCookieLawEvent,
  NgcInitializeEvent,
  NgcStatusChangeEvent,
} from "ngx-cookieconsent";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  providers: [LangService]
})
export class AppComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();
  private subscriptionIntervals: Subscription = new Subscription();
  private subscriptionTestForce: Subscription = new Subscription();
  loggerSubscription: Subscription;
  actualPage: string = '';
  hasLocalLang: boolean = false;
  actualScenarioHotjar: any = { lang: '', scenario: '' };
  tituloEvent: string = '';
  role: string = '';
  //Set toastr container ref configuration for toastr positioning on screen

  //keep refs to subscriptions to be able to unsubscribe later
  private popupOpenSubscription: Subscription;
  private popupCloseSubscription: Subscription;
  private initializeSubscription: Subscription;
  private statusChangeSubscription: Subscription;
  private revokeChoiceSubscription: Subscription;
  private noCookieLawSubscription: Subscription;

  constructor(private http: HttpClient, public toastr: ToastrService, private router: Router, private activatedRoute: ActivatedRoute, private titleService: Title, public translate: TranslateService, angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics, private langService: LangService, private eventsService: EventsService, protected $hotjar: NgxHotjarService, private meta: Meta, private ccService: NgcCookieConsentService) {

    if (sessionStorage.getItem('lang')) {
      this.translate.use(sessionStorage.getItem('lang'));
      this.hasLocalLang = true;
    } else {
      this.translate.use('en');
      sessionStorage.setItem('lang', 'en');
      this.hasLocalLang = false;
    }

    this.loadLanguages();
    this.loadCultures();

  }

  loadLanguages() {
    this.langService.getLangs()
      .subscribe((res: any) => {
        if (!this.hasLocalLang) {
          const browserLang: string = this.translate.getBrowserLang();
          for (let lang of res) {
            if (browserLang.match(lang.code)) {
              this.translate.use(lang.code);
              sessionStorage.setItem('lang', lang.code);
              this.eventsService.broadcast('changelang', lang.code);
            }
          }
        }
      }, (err) => {
        console.log(err);
      })
  }

  loadCultures() {
    const browserCulture: string = this.translate.getBrowserCultureLang();
    sessionStorage.setItem('culture', browserCulture);

  }

  launchHotjarTrigger(lang) {
    this.actualScenarioHotjar.scenario = 'fake'
    if (lang == 'es') {
      var ojb = { lang: lang, scenario: 'generalincoming_es' };
      this.testHotjarTrigger(ojb);
    } else {
      var ojb = { lang: lang, scenario: 'generalincoming_en' };
      this.testHotjarTrigger(ojb);
    }
  }

  testHotjarTrigger(obj) {
    if (obj.scenario != this.actualScenarioHotjar.scenario) {
      setTimeout(function () {
        if (obj.lang == 'es') {
          this.$hotjar.trigger(obj.scenario);
          this.actualScenarioHotjar = obj
        } else {
          this.$hotjar.trigger(obj.scenario);
          this.actualScenarioHotjar = obj
        }
      }.bind(this), 1000);
    }
  }

  ngOnInit() {
    this.meta.addTags([
      { name: 'keywords', content: this.translate.instant("seo.home.keywords") },
      { name: 'description', content: this.translate.instant("seo.home.description") },
      { name: 'title', content: this.translate.instant("seo.home.title") },
      { name: 'robots', content: 'index, follow' }
    ]);


    //evento que escucha si ha habido un error de conexión
    this.eventsService.on('http-error', function (error) {
      var msg1 = 'No internet connection';
      var msg2 = 'Trying to connect ...';

      if (sessionStorage.getItem('lang')) {
        var actuallang = sessionStorage.getItem('lang');
        if (actuallang == 'es') {
          msg1 = 'Sin conexión a Internet';
          msg2 = 'Intentando conectar ...';
        } else if (actuallang == 'pt') {
          msg1 = 'Sem conexão à internet';
          msg2 = 'Tentando se conectar ...';
        } else if (actuallang == 'de') {
          msg1 = 'Keine Internetverbindung';
          msg2 = 'Versucht zu verbinden ...';
        } else if (actuallang == 'nl') {
          msg1 = 'Geen internet verbinding';
          msg2 = 'Proberen te verbinden ...';
        }
      }
      if (error.message) {
        if (error == 'The user does not exist') {
          Swal.fire({
            icon: 'warning',
            title: this.translate.instant("errors.The user does not exist"),
            html: this.translate.instant("errors.The session has been closed")
          })
        }
      } else {

        Swal.fire({
          title: msg1,
          text: msg2,
          icon: 'warning',
          showCancelButton: false,
          confirmButtonColor: '#00B4CC',
          confirmButtonText: 'OK',
          showLoaderOnConfirm: true,
          allowOutsideClick: false,
          reverseButtons: true
        }).then((result) => {
          if (result.value) {
            location.reload();
          }

        });
      }
    }.bind(this));

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        var actualUrl = this.activatedRoute.snapshot['_routerState'].url;
        if (actualUrl.indexOf("undiagnosed;role=") != -1) {
          this.role = actualUrl.split("undiagnosed;role=")[1];
        } else if (actualUrl.indexOf("undiagnosed") != -1) {
          this.role = "undiagnosed";
        } else if (actualUrl.indexOf('diagnosed') != -1) {
          this.role = "diagnosed";
        } else {
          this.role = '';
        }

        if (sessionStorage.getItem('lang') != undefined) {
          this.launchHotjarTrigger(sessionStorage.getItem('lang'));
        } else {
          this.launchHotjarTrigger('en');
        }
      }
    })

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
          await this.delay(500);
          this.tituloEvent = event['title'];
          var titulo = this.translate.instant(this.tituloEvent);
          this.titleService.setTitle(titulo);
          if (event.title == 'homedx.Donate') {
            this.meta.updateTag({ name: 'description', content: this.translate.instant("donate.descriptionSeo") });
          } else {
            this.changeMeta();
          }

        })();

        //para los anchor de la misma páginano hacer scroll hasta arriba
        if (this.actualPage != event['title']) {
          window.scrollTo(0, 0)
        }
        this.actualPage = event['title'];
      });

    this.eventsService.on('changelang', function (lang) {
      this.launchHotjarTrigger(lang);
      (async () => {
        await this.delay(500);
        var titulo = this.translate.instant(this.tituloEvent);
        this.titleService.setTitle(titulo);
        sessionStorage.setItem('lang', lang);
        this.changeMeta();
      })();

      this.translate
      .get(['cookie.header', 'cookie.message', 'cookie.dismiss', 'cookie.allow', 'cookie.deny', 'cookie.link', 'cookie.policy'])
      .subscribe(data => {

        this.ccService.getConfig().content = this.ccService.getConfig().content || {} ;
        // Override default messages with the translated ones
        this.ccService.getConfig().content.header = data['cookie.header'];
        this.ccService.getConfig().content.message = data['cookie.message'];
        this.ccService.getConfig().content.dismiss = data['cookie.dismiss'];
        this.ccService.getConfig().content.allow = data['cookie.allow'];
        this.ccService.getConfig().content.deny = data['cookie.deny'];
        this.ccService.getConfig().content.link = data['cookie.link'];
        this.ccService.getConfig().content.policy = data['cookie.policy'];
        this.ccService.getConfig().content.href = environment.serverapi+'/privacy-policy';
        this.ccService.destroy();//remove previous cookie bar (with default messages)
        this.ccService.init(this.ccService.getConfig()); // update config with translated messages
      });


    }.bind(this));

    this.eventsService.on('changeEscenarioHotjar', function (obj) {
      this.testHotjarTrigger(obj);
    }.bind(this));

    this.ccService.getConfig().cookie.domain = window.location.hostname;

    // subscribe to cookieconsent observables to react to main events
    this.popupOpenSubscription = this.ccService.popupOpen$.subscribe(() => {
      // you can use this.ccService.getConfig() to do stuff...
    });

    this.popupCloseSubscription = this.ccService.popupClose$.subscribe(() => {
      // you can use this.ccService.getConfig() to do stuff...
    });

    this.initializeSubscription = this.ccService.initialize$.subscribe(
      (event: NgcInitializeEvent) => {
        // you can use this.ccService.getConfig() to do stuff...
      }
    );

    this.statusChangeSubscription = this.ccService.statusChange$.subscribe(
      (event: NgcStatusChangeEvent) => {
        // you can use this.ccService.getConfig() to do stuff...
      }
    );

    this.revokeChoiceSubscription = this.ccService.revokeChoice$.subscribe(
      () => {
        // you can use this.ccService.getConfig() to do stuff...
      }
    );

    this.noCookieLawSubscription = this.ccService.noCookieLaw$.subscribe(
      (event: NgcNoCookieLawEvent) => {
        // you can use this.ccService.getConfig() to do stuff...
      }
    );

    this.translate
      .get(['cookie.header', 'cookie.message', 'cookie.dismiss', 'cookie.allow', 'cookie.deny', 'cookie.link', 'cookie.policy'])
      .subscribe(data => {

        this.ccService.getConfig().content = this.ccService.getConfig().content || {} ;
        // Override default messages with the translated ones
        this.ccService.getConfig().content.header = data['cookie.header'];
        this.ccService.getConfig().content.message = data['cookie.message'];
        this.ccService.getConfig().content.dismiss = data['cookie.dismiss'];
        this.ccService.getConfig().content.allow = data['cookie.allow'];
        this.ccService.getConfig().content.deny = data['cookie.deny'];
        this.ccService.getConfig().content.link = data['cookie.link'];
        this.ccService.getConfig().content.policy = data['cookie.policy'];
        this.ccService.getConfig().content.href = environment.serverapi+'/privacy-policy';
        this.ccService.destroy();//remove previous cookie bar (with default messages)
        this.ccService.init(this.ccService.getConfig()); // update config with translated messages
      });
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  // when the component is destroyed, unsubscribe to prevent memory leaks
  ngOnDestroy() {
    if (this.loggerSubscription) {
      this.loggerSubscription.unsubscribe();
    }

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (this.subscriptionIntervals) {
      this.subscriptionIntervals.unsubscribe();
    }

    if (this.subscriptionTestForce) {
      this.subscriptionTestForce.unsubscribe();
    }

    // unsubscribe to cookieconsent observables to prevent memory leaks
    this.popupOpenSubscription.unsubscribe();
    this.popupCloseSubscription.unsubscribe();
    this.initializeSubscription.unsubscribe();
    this.statusChangeSubscription.unsubscribe();
    this.revokeChoiceSubscription.unsubscribe();
    this.noCookieLawSubscription.unsubscribe();
  }

  changeMeta() {
    var URLactual = window.location.href;
    if (URLactual.indexOf("clinician") != -1 || this.role == "physicians") {
      this.meta.updateTag({ name: 'keywords', content: this.translate.instant("seo.physicians.keywords") });
      this.meta.updateTag({ name: 'description', content: this.translate.instant("seo.physicians.description") });
      this.meta.updateTag({ name: 'title', content: this.translate.instant("seo.physicians.title") });
    } else {
      if (this.role == '' || this.role == undefined) {
        this.meta.updateTag({ name: 'keywords', content: this.translate.instant("seo.home.keywords") });
        this.meta.updateTag({ name: 'description', content: this.translate.instant("seo.home.description") });
        this.meta.updateTag({ name: 'title', content: this.translate.instant("seo.home.title") });
      } else if (this.role == "diagnosed") {
        this.meta.updateTag({ name: 'keywords', content: this.translate.instant("seo.diagnosed.keywords") });
        this.meta.updateTag({ name: 'description', content: this.translate.instant("seo.diagnosed.description") });
        this.meta.updateTag({ name: 'title', content: this.translate.instant("seo.diagnosed.title") });
      } else if (this.role == "undiagnosed") {
        this.meta.updateTag({ name: 'keywords', content: this.translate.instant("seo.undiagnosed.keywords") });
        this.meta.updateTag({ name: 'description', content: this.translate.instant("seo.undiagnosed.description") });
        this.meta.updateTag({ name: 'title', content: this.translate.instant("seo.undiagnosed.title") });
      }
    }
  }
}
