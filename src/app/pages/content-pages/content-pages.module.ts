import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { CustomFormsModule } from 'ngx-custom-validators';
import { ContentPagesRoutingModule } from "./content-pages-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { ErrorPageComponent } from "./error/error-page.component";
import { TermsConditionsPageComponent } from "./terms-conditions/terms-conditions-page.component";
import { DataProcessingAgreementComponent } from "./data-processing-agreement/data-processing-agreement.component";
import { PrivacyPolicyPageComponent } from "./privacy-policy/privacy-policy.component";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {MatCheckboxModule} from '@angular/material/checkbox';

@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        ContentPagesRoutingModule,
        FormsModule,
        TranslateModule,
        CustomFormsModule,
        NgbModule,
        MatCheckboxModule
    ],
    declarations: [
        ErrorPageComponent,
        TermsConditionsPageComponent,
        DataProcessingAgreementComponent,
        PrivacyPolicyPageComponent
    ],
    entryComponents:[TermsConditionsPageComponent, DataProcessingAgreementComponent]
})
export class ContentPagesModule { }
