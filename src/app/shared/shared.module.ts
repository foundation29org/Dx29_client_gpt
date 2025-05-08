import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { PipeModule } from 'app/shared/pipes/pipe.module';

//COMPONENTS
import { NavbarD29Component } from "./navbar-dx29/navbar-dx29.component";
import { FooterComponent } from 'app/shared/footer/footer.component'
import { TermFormComponent } from 'app/pages/land/termsform/termsform.component';
import { SendMsgComponent } from 'app/pages/land/send-msg/send-msg.component';
import { DeploymentLogoComponent } from './components/deployment-logo/deployment-logo.component';
import { MatCheckboxModule } from '@angular/material/checkbox';

// SERVICES
import { DeploymentConfigService } from './services/deployment-config.service';

@NgModule({
    exports: [
        CommonModule,
        NavbarD29Component,
        NgbModule,
        TranslateModule,
        FooterComponent,
        TermFormComponent,
        SendMsgComponent,
        DeploymentLogoComponent
    ],
    imports: [
        RouterModule,
        CommonModule,
        NgbModule,
        TranslateModule,
        FormsModule,
        ReactiveFormsModule,
        PipeModule,
        MatCheckboxModule
    ],
    declarations: [
        NavbarD29Component,
        FooterComponent,
        TermFormComponent,
        SendMsgComponent,
        DeploymentLogoComponent
    ],
    providers: [
        DeploymentConfigService
    ]
})
export class SharedModule { }
