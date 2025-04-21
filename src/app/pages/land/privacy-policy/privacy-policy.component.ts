import { Component, Optional  } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.scss']
})

export class PrivacyPolicyPageComponent {
  isShortVersion: boolean = true;
  constructor(public translate: TranslateService, private router: Router, @Optional() public activeModal: NgbActiveModal) {
  }

  goTo(url){
    document.getElementById(url).scrollIntoView({behavior: "smooth"});
  }
  
  isDirectRoute(): boolean {
    return this.router.url === '/privacy-policy';
  }

  goHome() {
    this.router.navigate(['/']);
  }

  toggleShortVersion() {
    this.isShortVersion = !this.isShortVersion;
  }
}
