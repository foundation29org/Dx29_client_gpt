import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransparenciaPageComponent } from './transparencia-page.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';

const routes: Routes = [
  { path: '', component: TransparenciaPageComponent, data: { title: 'navbar.TAB_4' } }
];

@NgModule({
  declarations: [TransparenciaPageComponent],
  imports: [
    SharedModule,
    CommonModule,
    RouterModule.forChild(routes),
  ]
})
export class TransparenciaModule { }