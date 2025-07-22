import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { BrandingService } from 'app/shared/services/branding.service';
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
    activeTab: number = 1;
    expandedSections: { [key: string]: boolean } = {};
    expandedQuestions: { [key: string]: boolean } = {};

    constructor( 
        public translate: TranslateService, 
        public insightsService: InsightsService, 
        private uuidService: UuidService,
        private brandingService: BrandingService
    ) {
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

    setActiveTab(tabNumber: number) {
        this.activeTab = tabNumber;
        // Close all sections when switching tabs
        this.expandedSections = {};
        this.expandedQuestions = {};
    }

    toggleSection(sectionId: string) {
        this.expandedSections[sectionId] = !this.expandedSections[sectionId];
        // Close all questions in this section when collapsing the section
        if (!this.expandedSections[sectionId]) {
            Object.keys(this.expandedQuestions).forEach(key => {
                if (key.startsWith(sectionId)) {
                    this.expandedQuestions[key] = false;
                }
            });
        }
    }

    toggleQuestion(questionId: string) {
        // Close all other questions in the same section
        const sectionPrefix = questionId.substring(0, 4); // P1S1, P1S2, etc.
        Object.keys(this.expandedQuestions).forEach(key => {
            if (key.startsWith(sectionPrefix) && key !== questionId) {
                this.expandedQuestions[key] = false;
            }
        });
        
        // Toggle the clicked question
        this.expandedQuestions[questionId] = !this.expandedQuestions[questionId];
    }

    /**
     * Obtiene el gradiente de fondo para la página About Us
     */
    getAboutUsGradient(): string {
        return this.brandingService.getAboutUsGradient();
    }

    /**
     * Obtiene el overlay de fondo para la página About Us
     */
    getAboutUsOverlay(): string {
        return this.brandingService.getAboutUsOverlay();
    }

    /**
     * Obtiene todos los estilos para la página About Us
     */
    getAboutUsStyles(): any {
        return {
            'padding-bottom': '3rem !important',
            'padding-top': '3rem !important',
            'background': this.getAboutUsGradient(),
            '--about-us-overlay': this.getAboutUsOverlay()
        };
    }

}
