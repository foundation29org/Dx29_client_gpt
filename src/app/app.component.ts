import { Component, OnInit, OnDestroy } from '@angular/core';
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { EventsService } from 'app/shared/services/events.service';

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

    constructor(private router: Router, public translate: TranslateService, private ccService: NgcCookieConsentService, private eventsService: EventsService) {
        this.translate.use('en');
    }

    ngOnInit() {
        this.subscription = this.router.events
            .pipe(
                filter(event => event instanceof NavigationEnd)
            )
            .subscribe(() => window.scrollTo(0, 0));

            this.eventsService.on('changelang', function (lang) {
      
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

              this.ccService.getConfig().cookie.domain = window.location.hostname;


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


    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    



}