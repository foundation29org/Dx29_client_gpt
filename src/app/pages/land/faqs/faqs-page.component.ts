import { Component, OnInit} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BrandingService } from 'app/shared/services/branding.service';

@Component({
    selector: 'app-faqs-page',
    templateUrl: './faqs-page.component.html',
    styleUrls: ['./faqs-page.component.scss'],
    standalone: false
})

export class FaqsPageComponent implements OnInit {
    readonly faqNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
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
