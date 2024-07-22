import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { CustomFormsModule } from 'ngx-custom-validators';
import { LandPageRoutingModule } from "./land-page-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { AboutUsPageComponent } from "./about-us/about-us-page.component";
import { ReportsPageComponent } from "./reports/reports-page.component";
import { UndiagnosedPageComponent } from "./undiagnosed/undiagnosed-page.component";
import { FeedbackPageComponent } from "./feedback/feedback-page.component";
import { PrivacyPolicyPageComponent } from "./privacy-policy/privacy-policy.component";
import { TestimonialsComponent } from "./testimonials/testimonials.component";

import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { PipeModule } from 'app/shared/pipes/pipe.module';

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
        CustomFormsModule,
        NgbModule,
        MatCheckboxModule,
        MatRadioModule,
        PipeModule
    ],
    declarations: [
        AboutUsPageComponent,
        ReportsPageComponent,
        UndiagnosedPageComponent,
        FeedbackPageComponent,
        PrivacyPolicyPageComponent,
        TestimonialsComponent
    ]
})
export class LandPageModule { }
