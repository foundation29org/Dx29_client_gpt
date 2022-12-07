import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.scss']
})

export class PrivacyPolicyPageComponent {
  constructor(public translate: TranslateService) {
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }

  back(){
    window.history.back();
  }
}
