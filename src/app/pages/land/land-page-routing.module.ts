import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ReportsPageComponent } from "./reports/reports-page.component";
import { UndiagnosedPageComponent } from "./undiagnosed/undiagnosed-page.component";
import { FeedbackPageComponent } from "./feedback/feedback-page.component";
import { PrivacyPolicyPageComponent } from "./privacy-policy/privacy-policy.component";
import { CookiesPageComponent } from "./cookies/cookies.component";
import { PermalinkViewPageComponent } from "./permalink-view/permalink-view-page.component";
import { CollaborationComponent } from "./collaboration/collaboration.component";
import { Foundation29Component } from "./foundation29/foundation29.component";
import { IntegrationComponent } from "./integration/integration.component";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '.',
        component: UndiagnosedPageComponent,
        data: {
          title: 'menu.Home'
        },
      },
      {
        path: 'aboutus',
        loadChildren: () => import('./about-us/about-us.module').then(m => m.AboutUsModule),
        data: { title: 'menu.About us' }
      },
      {
        path: 'collaboration',
        component: CollaborationComponent,
        data: { title: 'menu.Collaboration' }
      },
      {
        path: 'integration',
        component: IntegrationComponent,
        data: { title: 'integration.title' }
      },
      {
        path: 'foundation29',
        component: Foundation29Component,
        data: { title: 'foundation29.hero.title' }
      },
      {
        path: 'faq',
        loadChildren: () => import('./faqs/faqs.module').then(m => m.FaqsModule),
        data: { title: 'FAQs' }
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
          title: 'menu.Privacy'
        }
      },
      {
        path: 'cookies',
        component: CookiesPageComponent,
        data: {
          title: 'cookies.title'
        }
      },
      {
        path: 'result/:id',
        component: PermalinkViewPageComponent,
        data: {
          title: 'permalink.title'
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
