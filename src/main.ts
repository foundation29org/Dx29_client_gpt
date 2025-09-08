import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Polyfill para StorageType.persistent deprecated
if ('storage' in navigator && 'persist' in navigator.storage) {
  navigator.storage.persist().then(granted => {
    if (granted) {
      console.log('Storage persistence granted');
    } else {
      console.log('Storage persistence denied');
    }
  }).catch(err => {
    console.log('Storage persistence error:', err);
  });
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
