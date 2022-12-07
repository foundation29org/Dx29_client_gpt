import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { CustomFormsModule } from 'ngx-custom-validators';
import { RouterModule } from "@angular/router";

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { PerfectScrollbarModule } from "ngx-perfect-scrollbar";
import {MatCheckboxModule} from '@angular/material/checkbox';

//COMPONENTS
import { FooterComponent } from "./footer/footer.component";
import { Footer2Component } from "./footer2/footer2.component";
import { FooterLandComponent } from "./footer-land/footer-land.component";
import { NavbarComponentNolog } from "./navbar-nolog/navbar-nolog.component";
import { NavbarD29Component } from "./navbar-dx29/navbar-dx29.component";
import { SidebarComponent } from "./sidebar/sidebar.component";

//DIRECTIVES
import { ToggleFullscreenDirective } from "./directives/toggle-fullscreen.directive";
import { SidebarDirective } from './directives/sidebar.directive';
import { SidebarLinkDirective } from './directives/sidebarlink.directive';
import { SidebarListDirective } from './directives/sidebarlist.directive';
import { SidebarAnchorToggleDirective } from './directives/sidebaranchortoggle.directive';
import { SidebarToggleDirective } from './directives/sidebartoggle.directive';



@NgModule({
    exports: [
        CommonModule,
        FooterComponent,
        Footer2Component,
        FooterLandComponent,
        NavbarComponentNolog,
        NavbarD29Component,
        SidebarComponent,
        ToggleFullscreenDirective,
        SidebarDirective,
        NgbModule,
        TranslateModule
    ],
    imports: [
      FormsModule,
      CustomFormsModule,
        RouterModule,
        CommonModule,
        NgbModule,
        TranslateModule,
        PerfectScrollbarModule,
        MatCheckboxModule
    ],
    declarations: [
        FooterComponent,
        Footer2Component,
        FooterLandComponent,
        NavbarComponentNolog,
        NavbarD29Component,
        SidebarComponent,
        ToggleFullscreenDirective,
        SidebarDirective,
        SidebarLinkDirective,
        SidebarListDirective,
        SidebarAnchorToggleDirective,
        SidebarToggleDirective
    ]
})
export class SharedModule { }
