import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'app/shared/shared.module';

import { Fundacion29PageComponent } from './fundacion-29-page.component';

@NgModule({
  declarations: [
    Fundacion29PageComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', component: Fundacion29PageComponent, data: { title: 'Quiénes somos' } }
    ]),
    TranslateModule,
    SharedModule
  ]
})
export class Fundacion29Module { }