import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { LandPageLayoutComponent } from "./layouts/land-page/land-page-layout.component";
import { Land_Pages_ROUTES } from "./shared/routes/land-page-layout.routes"

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '.',
    pathMatch: 'full',
  },
  { path: '', component: LandPageLayoutComponent, data: { title: 'Land Page' }, children: Land_Pages_ROUTES },
  {
    path: '**',
    redirectTo: '.'
  }
];

@NgModule({
  //imports: [RouterModule.forRoot(appRoutes, { preloadingStrategy: PreloadAllModules, relativeLinkResolution: 'legacy' })],
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})

export class AppRoutingModule {
}
