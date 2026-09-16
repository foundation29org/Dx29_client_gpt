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
import { BetaPageComponent } from "./beta/beta-page.component";
import { RESULT_SEO, SEO_ROUTES } from "../../shared/seo/seo-routes";

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '.',
        component: UndiagnosedPageComponent,
        data: {
          title: 'menu.Home',
          ...SEO_ROUTES['/']
        },
      },
      {
        path: 'beta',
        component: BetaPageComponent,
        data: {
          title: 'Beta',
          ...SEO_ROUTES['/beta']
        },
      },
      {
        path: 'aboutus',
        loadChildren: () => import('./about-us/about-us.module').then(m => m.AboutUsModule),
        data: {
          title: 'menu.About us',
          ...SEO_ROUTES['/aboutus']
        }
      },
      {
        path: 'collaboration',
        component: CollaborationComponent,
        data: {
          title: 'menu.Collaboration',
          ...SEO_ROUTES['/collaboration']
        }
      },
      {
        path: 'integration',
        component: IntegrationComponent,
        data: {
          title: 'integration.title',
          ...SEO_ROUTES['/integration']
        }
      },
      {
        path: 'foundation29',
        component: Foundation29Component,
        data: {
          title: 'foundation29.hero.title',
          ...SEO_ROUTES['/foundation29']
        }
      },
      {
        path: 'faq',
        loadChildren: () => import('./faqs/faqs.module').then(m => m.FaqsModule),
        data: {
          title: 'land.faqs.title',
          ...SEO_ROUTES['/faq']
        }
      },
      {
        path: 'reports',
        component: ReportsPageComponent,
        data: {
          title: 'menu.Usage statistics',
          ...SEO_ROUTES['/reports']
        }
      },
      {
        path: 'feedback',
        component: FeedbackPageComponent,
        data: {
          title: 'Feedback',
          ...SEO_ROUTES['/feedback']
        }
      },
      {
        path: 'privacy-policy',
        component: PrivacyPolicyPageComponent,
        data: {
          title: 'menu.Privacy',
          ...SEO_ROUTES['/privacy-policy']
        }
      },
      {
        path: 'cookies',
        component: CookiesPageComponent,
        data: {
          title: 'cookies.title',
          ...SEO_ROUTES['/cookies']
        }
      },
      {
        path: 'result/:id',
        component: PermalinkViewPageComponent,
        data: {
          title: 'permalink.title',
          ...RESULT_SEO
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
