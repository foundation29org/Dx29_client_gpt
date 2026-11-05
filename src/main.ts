import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Una sola detección de cambios por frame aunque un gesto dispare varios eventos (pointerdown,
// focus, click…): menos trabajo por toque, que es lo que más pesa en el INP móvil.
platformBrowserDynamic().bootstrapModule(AppModule, { ngZoneEventCoalescing: true });
