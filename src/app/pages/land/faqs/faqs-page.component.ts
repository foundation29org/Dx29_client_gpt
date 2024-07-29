import { Component} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-faqs-page',
    templateUrl: './faqs-page.component.html',
    styleUrls: ['./faqs-page.component.scss'],
})

export class FaqsPageComponent{

    constructor( public translate: TranslateService) {
    }

}
