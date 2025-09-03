import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { Router } from '@angular/router';
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

    constructor( public translate: TranslateService, public insightsService: InsightsService, private uuidService: UuidService, private router: Router) {
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

    goHome() {
        this.router.navigate(['/']);
    }

    scrollToBenchmarking() {
        const element = document.getElementById('benchmarking');
        if (element) {
            const elementPosition = element.offsetTop;
            const offsetPosition = elementPosition - 100; // Ajuste para no superar el título
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    scrollToRegulacion() {
        const element = document.getElementById('regulacion');
        if (element) {
            const elementPosition = element.offsetTop;
            const offsetPosition = elementPosition - 100;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

}
