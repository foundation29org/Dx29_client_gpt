import { Component, AfterViewChecked } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Injectable } from '@angular/core';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { HighlightService } from 'app/shared/services/highlight.service';

@Component({
    selector: 'app-testimonials',
    templateUrl: './testimonials.component.html',
    styleUrls: ['./testimonials.component.scss'],
    providers: [NgbCarouselConfig]
})

@Injectable({ providedIn: 'root' })
export class TestimonialsComponent implements AfterViewChecked{

    constructor(public translate: TranslateService, config: NgbCarouselConfig, private highlightService: HighlightService) {
        config.interval = 10000;
        config.wrap = false;
        config.keyboard = false;
        config.pauseOnHover = false;
    }

    ngAfterViewChecked() {
        this.highlightService.highlightAll();
      }

}
