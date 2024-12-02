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
      script.src = 'https://kit.fontawesome.com/e1638781bd.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        this.loaded = true;
        resolve();
      };
      document.body.appendChild(script);
    });
  }
}
