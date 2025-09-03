import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'app/shared/shared.module';

import { ValidacionPageComponent } from './validacion-page.component';

@NgModule({
  declarations: [
    ValidacionPageComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: ValidacionPageComponent }
    ]),
    TranslateModule,
    SharedModule
  ]
})
export class ValidacionModule { }