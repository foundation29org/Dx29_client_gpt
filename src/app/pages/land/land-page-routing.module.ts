import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AboutUsPageComponent } from "./about-us/about-us-page.component";
import { UndiagnosedPageComponent } from "./undiagnosed/undiagnosed-page.component";
import { FeedbackPageComponent } from "./feedback/feedback-page.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '.',
        component: UndiagnosedPageComponent,
        data: {
          title: 'DxGPT'
        },
      },
      {
        path: 'aboutus',
        component: AboutUsPageComponent,
        data: {
          title: 'menu.About us'
        }
      },
      {
        path: 'feedback',
        component: FeedbackPageComponent,
        data: {
          title: 'Feedback'
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandPageRoutingModule { }
