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


// 🚩 Se desactiva scrollPositionRestoration porque el proyecto implementa control manual del scroll: el layout principal (land-page-layout.component.ts:25) tiene un método scrollToTop() con smooth scroll y escucha eventos de scroll (@HostListener) para cambiar clases CSS del navbar/página según la posición; si Angular restaurara automáticamente el scroll, interferiría con estas animaciones personalizadas y la lógica de mostrar/ocultar elementos basada en la posición del scroll.
@NgModule({
  imports: [RouterModule.forRoot(appRoutes, { 
    preloadingStrategy: PreloadAllModules, 
    relativeLinkResolution: 'legacy',
    scrollPositionRestoration: 'disabled'
  })],
  exports: [RouterModule]
})

export class AppRoutingModule {
}
