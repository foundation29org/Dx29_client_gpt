import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.scss']
})

export class PrivacyPolicyPageComponent {
  constructor(public translate: TranslateService) {
    setTimeout(function () {
      this.goTo('initpos');
    }.bind(this), 300);
  }

  goTo(url){
    document.getElementById(url).scrollIntoView({behavior: "smooth"});
  }
}
