import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { SharedModule } from 'app/shared/shared.module';
import { FaqsPageComponent } from './faqs-page.component';

@NgModule({
  declarations: [
    FaqsPageComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild([
      {
        path: '',
        component: FaqsPageComponent
      }
    ])
  ]
})
export class FaqsModule { }