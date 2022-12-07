import { Component, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LangService } from 'app/shared/services/lang.service';
import { Subscription } from 'rxjs/Subscription';
import { EventsService} from 'app/shared/services/events.service';
import { Injectable, Injector } from '@angular/core';


@Component({
    selector: 'app-navbar-nolog',
    templateUrl: './navbar-nolog.component.html',
    styleUrls: ['./navbar-nolog.component.scss'],
    providers: [LangService]
})

@Injectable()
export class NavbarComponentNolog implements OnDestroy{
    currentLang = 'en';
    toggleClass = 'ft-maximize';
    langs: any;
    private subscription: Subscription = new Subscription();

    constructor(public translate: TranslateService, private langService:LangService, private inj: Injector) {
      /*this.translate.use('en');
      sessionStorage.setItem('lang', 'en');*/
      this.loadLanguages();
    }

    ngOnDestroy() {
      this.subscription.unsubscribe();
    }

    loadLanguages() {
        this.subscription.add( this.langService.getLangs()
        .subscribe( (res : any) => {
          this.langs=res;
          if(sessionStorage.getItem('lang')){
            this.translate.use(sessionStorage.getItem('lang'));
          }else{
            const browserLang: string = this.translate.getBrowserLang();
            var foundlang = false;
            for(let lang of this.langs) {
              if(browserLang.match(lang.code)){
                this.translate.use(lang.code);
                sessionStorage.setItem('lang', lang.code);
                foundlang = true;
              }
            }
            if(!foundlang){
              sessionStorage.setItem('lang', this.translate.store.currentLang);
            }
          }

         }, (err) => {
           console.log(err);
         }));
    }


    ChangeLanguage(language: string) {
        this.translate.use(language);
        this.currentLang = language;
        sessionStorage.setItem('lang', language);
        var eventsLang = this.inj.get(EventsService);
        eventsLang.broadcast('changelang', language);
    }

}
