import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AboutUsPageComponent } from "./about-us/about-us-page.component";
import { ReportsPageComponent } from "./reports/reports-page.component";
import { UndiagnosedPageComponent } from "./undiagnosed/undiagnosed-page.component";
import { FeedbackPageComponent } from "./feedback/feedback-page.component";
import { PrivacyPolicyPageComponent } from "./privacy-policy/privacy-policy.component";

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
        path: 'reports',
        component: ReportsPageComponent,
        data: {
          title: 'menu.Usage statistics'
        }
      },
      {
        path: 'feedback',
        component: FeedbackPageComponent,
        data: {
          title: 'Feedback'
        }
      },
      {
        path: 'privacy-policy',
        component: PrivacyPolicyPageComponent,
        data: {
          title: 'menu.Privacy Policy'
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
