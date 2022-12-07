import * as $ from 'jquery';
import { NgModule ,LOCALE_ID  } from '@angular/core';
import es from '@angular/common/locales/es'
import { registerLocaleData } from '@angular/common';
registerLocaleData(es);
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from "./shared/shared.module";
import { ToastrModule } from "ngx-toastr";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HTTP_INTERCEPTORS, HttpClientModule, HttpClient } from "@angular/common/http";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";

import {
    PerfectScrollbarModule,
    PERFECT_SCROLLBAR_CONFIG,
    PerfectScrollbarConfigInterface
  } from 'ngx-perfect-scrollbar';

import { AppComponent } from './app.component';
import { ContentLayoutComponent } from "./layouts/content/content-layout.component";
import { LandPageLayoutComponent } from "./layouts/land-page/land-page-layout.component";

import { AuthInterceptor } from './shared/auth/auth.interceptor';
import { DatePipe } from '@angular/common';
import { DateService } from 'app/shared/services/date.service';
import { SearchFilterPipe } from 'app/shared/services/search-filter.service';
import { HighlightSearch } from 'app/shared/services/search-filter-highlight.service';
import { TextTransform } from 'app/shared/services/transform-text.service';
import { LocalizedDatePipe } from 'app/shared/services/localizedDatePipe.service';
import { SortService } from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { EventsService } from 'app/shared/services/events.service';
import { DialogService } from 'app/shared/services/dialog.service';
import { Data } from 'app/shared/services/data.service';
import { environment } from 'environments/environment';

import { Angulartics2Module } from 'angulartics2';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';
import { NgxHotjarModule } from 'ngx-hotjar';
import {GoogleAnalyticsService} from './shared/services/google-analytics.service';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
    suppressScrollX: true,
    wheelPropagation: false
  };

  export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
  }


  @NgModule({
    declarations: [AppComponent, ContentLayoutComponent, LandPageLayoutComponent, SearchFilterPipe, HighlightSearch, TextTransform, LocalizedDatePipe],
    imports: [
      CommonModule,
      BrowserAnimationsModule,
      AppRoutingModule,
      SharedModule,
      HttpClientModule,
      ToastrModule.forRoot(),
      NgbModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient]
        }
      }),
      Angulartics2Module.forRoot(),
      PerfectScrollbarModule,
      NgxHotjarModule.forRoot(environment.hotjarSiteId)
    ],
    providers: [
      {
        provide : HTTP_INTERCEPTORS,
        useClass: AuthInterceptor,
        multi   : true
      },
      DatePipe,
      DateService,
      SearchFilterPipe,
      HighlightSearch,
      TextTransform,
      LocalizedDatePipe,
      { provide: LOCALE_ID, useValue: 'es-ES' },
      SortService,
      SearchService,
      EventsService,
      DialogService,
      Data,
      {
        provide: PERFECT_SCROLLBAR_CONFIG,
        useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
      },
      { provide: PERFECT_SCROLLBAR_CONFIG, useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG },
      GoogleAnalyticsService
    ],
    bootstrap: [AppComponent]
  })
  export class AppModule {}
