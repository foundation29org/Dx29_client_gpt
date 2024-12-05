import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IconsService {
  private loaded = false;

  loadIcons(): Promise<void> {
    if (this.loaded) {
      return Promise.resolve();
    }
   return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'assets/js/e1638781bd.js';
      script.onload = () => {
        this.loaded = true;
        resolve();
      };
      document.body.appendChild(script);
    });

    /*return new Promise((resolve) => {
      // Cargar CSS principal
      const link = document.createElement('link');
      link.href = 'assets/fontawesome/free.min.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // No es necesario cargar el script JS
      resolve();
    });*/
  }
}
