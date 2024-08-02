import { Component, Optional  } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-cookies',
    templateUrl: './cookies.component.html',
    styleUrls: ['./cookies.component.scss']
})

export class CookiesPageComponent {
  lang: string = 'en';
  constructor(public translate: TranslateService, private router: Router, @Optional() public activeModal: NgbActiveModal) {
    this.lang = this.translate.store.currentLang
  }

  goTo(url){
    document.getElementById(url).scrollIntoView({behavior: "smooth"});
  }
  
  isDirectRoute(): boolean {
    return this.router.url === '/cookies';
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
