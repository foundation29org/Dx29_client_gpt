import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LandPageRoutingModule } from "./land-page-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { ReportsPageComponent } from "./reports/reports-page.component";
import { UndiagnosedPageComponent } from "./undiagnosed/undiagnosed-page.component";
import { MedicalInfoModalComponent } from "./medical-info-modal/medical-info-modal.component";
import { FeedbackPageComponent } from "./feedback/feedback-page.component";
import { PrivacyPolicyPageComponent } from "./privacy-policy/privacy-policy.component";
import { CookiesPageComponent } from "./cookies/cookies.component";
import { TestimonialsComponent } from "./testimonials/testimonials.component";
import { PermalinkViewPageComponent } from "./permalink-view/permalink-view-page.component";
import { CollaborationComponent } from "./collaboration/collaboration.component";
import { Foundation29Component } from "./foundation29/foundation29.component";

import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { PipeModule } from 'app/shared/pipes/pipe.module';
import { SharedModule } from 'app/shared/shared.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    exports: [
        TranslateModule,
    ],
    imports: [
        CommonModule,
        LandPageRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        NgbModule,
        MatCheckboxModule,
        MatRadioModule,
        PipeModule,
        SharedModule,
        MatProgressBarModule,
        MatProgressSpinnerModule
    ],
    declarations: [
        ReportsPageComponent,
        UndiagnosedPageComponent,
        MedicalInfoModalComponent,
        FeedbackPageComponent,
        PrivacyPolicyPageComponent,
        CookiesPageComponent,
        TestimonialsComponent,
        PermalinkViewPageComponent,
        CollaborationComponent,
        Foundation29Component
    ]
})
export class LandPageModule { }
