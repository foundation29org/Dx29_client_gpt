import { Injectable, NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { TranslateLoader } from '@ngx-translate/core';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Observable, of } from 'rxjs';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';

@Injectable()
class ServerTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<Record<string, unknown>> {
    const translationPath = join(process.cwd(), 'src', 'assets', 'i18n', `${lang}.json`);
    return of(JSON.parse(readFileSync(translationPath, 'utf8')));
  }
}

@NgModule({
  imports: [
    AppModule,
    ServerModule,
  ],
  providers: [
    {
      provide: TranslateLoader,
      useClass: ServerTranslateLoader,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
