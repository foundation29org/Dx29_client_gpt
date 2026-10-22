import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    FormsModule,
    RouterModule.forChild(routes),
  ]
})
export class AboutUsModule { }
