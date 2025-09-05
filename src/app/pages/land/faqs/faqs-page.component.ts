import { Component, OnInit} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BrandingService } from 'app/shared/services/branding.service';

@Component({
    selector: 'app-faqs-page',
    templateUrl: './faqs-page.component.html',
    styleUrls: ['./faqs-page.component.scss'],
})

export class FaqsPageComponent implements OnInit {
    expandedFaqs: { [key: number]: boolean } = {};

    constructor( 
        public translate: TranslateService,
        public brandingService: BrandingService
    ) {
    }

    ngOnInit(): void {
        // Inicialización del componente
    }

    toggleFaq(faqNumber: number): void {
        this.expandedFaqs[faqNumber] = !this.expandedFaqs[faqNumber];
    }
}
