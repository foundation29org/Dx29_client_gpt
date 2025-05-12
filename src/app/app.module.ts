import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { HTTP_INTERCEPTORS, HttpClientModule, HttpClient } from "@angular/common/http";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { NgxSpinnerModule } from 'ngx-spinner';

import { AppRoutingModule } from "./app-routing.module";
import { SharedModule } from "./shared/shared.module";
import { AppComponent } from "./app.component";
import { LandPageLayoutComponent } from "./layouts/land-page/land-page-layout.component";
import { AuthInterceptor } from './shared/auth/auth.interceptor';
import { WINDOW_PROVIDERS } from './shared/services/window.service';
import {NgcCookieConsentModule, NgcCookieConsentConfig} from 'ngx-cookieconsent';
import { environment } from '../environments/environment';

const cookieConfig:NgcCookieConsentConfig = {
  cookie: {
    domain:  environment.api // or 'your.domain.com' // it is mandatory to set a domain, for cookies to work properly (see https://goo.gl/S2Hy2A)
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
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
    NgcCookieConsentModule.forRoot(cookieConfig)
  ],
  providers: [
    {
      provide : HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi   : true
    },
    WINDOW_PROVIDERS
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
