import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ContentLayoutComponent } from "./layouts/content/content-layout.component";
import { LandPageLayoutComponent } from "./layouts/land-page/land-page-layout.component";

import { CONTENT_ROUTES } from "./shared/routes/content-layout.routes";

import { Land_Pages_ROUTES } from "./shared/routes/land-page-layout.routes"

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '.',
    pathMatch: 'full',
  },
  { path: '', component: LandPageLayoutComponent, data: { title: 'Land Page' }, children: Land_Pages_ROUTES },
  { path: '', component: ContentLayoutComponent, data: { title: 'content Views' }, children: CONTENT_ROUTES },
  { path: '**', redirectTo: '.'}
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})

export class AppRoutingModule {

}
