import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { v4 as uuidv4 } from 'uuid';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { GoogleAnalyticsService } from 'ngx-google-analytics';

@Component({
    selector: 'app-about-us-page',
    templateUrl: './about-us-page.component.html',
    styleUrls: ['./about-us-page.component.scss'],
})

export class AboutUsPageComponent {

    _startTime: any;
    myuuid: string = uuidv4();

    constructor( public translate: TranslateService, public insightsService: InsightsService, private gaService: GoogleAnalyticsService) {
        this._startTime = Date.now();
        if(sessionStorage.getItem('uuid')!=null){
            this.myuuid = sessionStorage.getItem('uuid');
        }else{
            this.myuuid = uuidv4();
            sessionStorage.setItem('uuid', this.myuuid);
        }
    }

    getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
    };

    lauchEvent(category) {
        var secs = this.getElapsedSeconds();
        this.gaService.gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
    }


    openWeb(){
        window.open('https://www.foundation29.org', '_blank');
    }


      

}
