import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { PerfectScrollbarModule } from "ngx-perfect-scrollbar";

import { PipeModule } from 'app/shared/pipes/pipe.module';

//COMPONENTS
import { NavbarD29Component } from "./navbar-dx29/navbar-dx29.component";
import { FooterComponent } from 'app/shared/footer/footer.component'
import {MatCheckboxModule} from '@angular/material/checkbox';


@NgModule({
    exports: [
        CommonModule,
        NavbarD29Component,
        NgbModule,
        TranslateModule,
        FooterComponent
    ],
    imports: [
        RouterModule,
        CommonModule,
        NgbModule,
        TranslateModule,
        FormsModule,
        ReactiveFormsModule ,
        PerfectScrollbarModule,
        PipeModule,
        MatCheckboxModule
    ],
    declarations: [
        NavbarD29Component,
        FooterComponent
    ]
})
export class SharedModule { }
