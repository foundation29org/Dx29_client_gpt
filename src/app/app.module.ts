import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { HTTP_INTERCEPTORS, HttpClientModule, HttpClient } from "@angular/common/http";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';

import {
  PerfectScrollbarModule,
  PERFECT_SCROLLBAR_CONFIG,
  PerfectScrollbarConfigInterface
} from 'ngx-perfect-scrollbar';

import { AppRoutingModule } from "./app-routing.module";
import { SharedModule } from "./shared/shared.module";
import { AppComponent } from "./app.component";
import { LandPageLayoutComponent } from "./layouts/land-page/land-page-layout.component";
import { AuthInterceptor } from './shared/auth/auth.interceptor';
import { WINDOW_PROVIDERS } from './shared/services/window.service';
import {NgcCookieConsentModule, NgcCookieConsentConfig} from 'ngx-cookieconsent';
import { NgxGoogleAnalyticsModule } from 'ngx-google-analytics';
import { environment } from '../environments/environment';

const cookieConfig:NgcCookieConsentConfig = {
  cookie: {
    domain: 'localhost' // or 'your.domain.com' // it is mandatory to set a domain, for cookies to work properly (see https://goo.gl/S2Hy2A)
  },
  palette: {
    popup: {
      background: '#fff'
    },
    button: {
      background: '#000000'
    }
  },
  theme: 'edgeless',
  type: 'opt-out'
};

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
  wheelPropagation: false
};

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

@NgModule({
  declarations: [AppComponent, LandPageLayoutComponent],
  imports: [
    BrowserAnimationsModule,
    AppRoutingModule,
    SharedModule,
    HttpClientModule,
    NgbModule,
    NgxSpinnerModule,
    ToastrModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
    PerfectScrollbarModule,
    NgcCookieConsentModule.forRoot(cookieConfig),
    NgxGoogleAnalyticsModule.forRoot(environment.GA_ID)
  ],
  providers: [
    {
      provide : HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi   : true
    },
    { provide: PERFECT_SCROLLBAR_CONFIG, useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG },
    WINDOW_PROVIDERS
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
