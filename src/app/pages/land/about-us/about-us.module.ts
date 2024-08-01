import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutUsPageComponent } from "./about-us-page.component";
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';

const routes: Routes = [
  { path: '', component: AboutUsPageComponent }
];

@NgModule({
  declarations: [AboutUsPageComponent],
  imports: [
    SharedModule,
    CommonModule,
    RouterModule.forChild(routes),
  ]
})
export class AboutUsModule { }
