import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { CustomFormsModule } from 'ngx-custom-validators';
import { LandPageRoutingModule } from "./land-page-routing.module";
import { TranslateModule } from '@ngx-translate/core';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { AboutUsPageComponent } from "./about-us/about-us-page.component";
import { UndiagnosedPageComponent } from "./undiagnosed/undiagnosed-page.component";

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatSelectModule} from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';
import {DndDirective} from "app/shared/directives/dnd.directive";
import { UiSwitchModule } from 'ngx-ui-switch';

@NgModule({
    exports: [
        TranslateModule,
        MatDatepickerModule,
        MatNativeDateModule 
    ],
    imports: [
        CommonModule,
        LandPageRoutingModule,
        FormsModule,
        TranslateModule,
        CustomFormsModule,
        NgbModule,
        MatCheckboxModule,
        MatExpansionModule,
        MatSelectModule,
        MatRadioModule,
        MatDatepickerModule,
        MatNativeDateModule,
        UiSwitchModule.forRoot({
            size: 'medium',
            color: '#ff0000',
            switchColor: '#fff',
            defaultBgColor: '#fff',
            defaultBoColor : '#ff0000'
          })
    ],
    declarations: [
        AboutUsPageComponent,
        UndiagnosedPageComponent,
        DndDirective
    ]
})
export class LandPageModule { }
