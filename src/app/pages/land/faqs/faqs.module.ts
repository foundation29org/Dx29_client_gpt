import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaqsPageComponent } from "./faqs-page.component";
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';

const routes: Routes = [
  { path: '', component: FaqsPageComponent }
];

@NgModule({
  declarations: [FaqsPageComponent],
  imports: [
    SharedModule,
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class FaqsModule { }
