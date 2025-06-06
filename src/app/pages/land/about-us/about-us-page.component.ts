import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InsightsService } from 'app/shared/services/azureInsights.service';
declare let gtag: any;
import { UuidService } from 'app/shared/services/uuid.service';

@Component({
    selector: 'app-about-us-page',
    templateUrl: './about-us-page.component.html',
    styleUrls: ['./about-us-page.component.scss'],
})

export class AboutUsPageComponent {

    _startTime: any;
    myuuid: string;

    constructor( public translate: TranslateService, public insightsService: InsightsService, private uuidService: UuidService) {
        this._startTime = Date.now();
        this.myuuid = this.uuidService.getUuid();
    }

    getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
    };

    lauchEvent(category) {
        var secs = this.getElapsedSeconds();
        gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
    }


    openWeb(){
        window.open('https://www.foundation29.org', '_blank');
    }


      

}
