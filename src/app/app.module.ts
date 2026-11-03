import { NgModule, PLATFORM_ID, inject, provideAppInitializer } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { firstValueFrom } from "rxjs";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { TranslateModule, TranslateLoader, TranslateService } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { NgxSpinnerModule } from 'ngx-spinner';

import { AppRoutingModule } from "./app-routing.module";
import { SharedModule } from "./shared/shared.module";
import { AppComponent } from "./app.component";
import { LandPageLayoutComponent } from "./layouts/land-page/land-page-layout.component";
import { AuthInterceptor } from './shared/auth/auth.interceptor';
import { WINDOW_PROVIDERS } from './shared/services/window.service';
import {NgcCookieConsentModule, NgcCookieConsentConfig} from 'ngx-cookieconsent';
import { LangService } from './shared/services/lang.service';

// Configuración base del cookie consent
// El tipo se configura dinámicamente en app.component.ts según si es EU mode o no
// - EU mode: type 'opt-in' (GDPR requiere consentimiento previo)
// - Non-EU mode: no se muestra el banner (enabled: false)
const cookieConfig: NgcCookieConsentConfig = {
  cookie: {
    domain: 'https://dxgpt.app' // Se actualiza dinámicamente con window.location.hostname
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
  type: 'opt-in', // GDPR compliance: requiere consentimiento explícito
  enabled: false, // Se habilita dinámicamente solo para EU mode en app.component.ts
  revokable: false // Ocultar el botón de revoke en non-EU mode
};

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

// Al arrancar, Angular sustituye el HTML prerenderizado. Si lo hace antes de tener el JSON de idioma,
// pinta la home con los textos vacíos y, cuando llegan, el título (centrado en vertical) salta: era
// la mayor parte del CLS de ordenador. Mientras se espera, sigue visible el HTML prerenderizado.
// navbar-dx29 vuelve a llamar a use() con el mismo idioma, pero ya no se descarga de nuevo.
export function loadInitialLang(): Promise<unknown> {
  const translate = inject(TranslateService);
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return firstValueFrom(translate.use('en')).catch(() => undefined);
  }
  const loaded = firstValueFrom(translate.use(LangService.resolveInitialLang(translate.getBrowserLang())))
    .catch(() => undefined);
  // Si el JSON no llega (red caída), no se bloquea el arranque más de 3 s: se pinta como antes
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise(resolve => { timer = setTimeout(resolve, 3000); });
  return Promise.race([loaded, timeout]).finally(() => clearTimeout(timer));
}

@NgModule({ declarations: [AppComponent, LandPageLayoutComponent],
    bootstrap: [AppComponent], imports: [BrowserAnimationsModule,
        AppRoutingModule,
        SharedModule,
        NgbModule,
        NgxSpinnerModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient]
            }
        }),
        NgcCookieConsentModule.forRoot(cookieConfig)], providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        WINDOW_PROVIDERS,
        provideHttpClient(withInterceptorsFromDi()),
        provideAppInitializer(loadInitialLang)
    ] })
export class AppModule {}
