import { Injectable, NgZone } from '@angular/core';
import type { CLSMetricWithAttribution, INPMetricWithAttribution, LCPMetricWithAttribution } from 'web-vitals/attribution';
import { InsightsService } from './azureInsights.service';

type ReportedMetric = CLSMetricWithAttribution | INPMetricWithAttribution | LCPMetricWithAttribution;

/**
 * Core Web Vitals de usuarios reales (LCP, INP, CLS) con atribución, enviados a Application Insights
 * como evento "WebVital". Son las mismas métricas que Google recoge en CrUX y muestra en Search Console,
 * pero indicando qué elemento o interacción las causa, algo que Lighthouse no puede ver (sobre todo
 * el CLS que ocurre durante el uso, no en la carga).
 *
 * Solo se envían selectores CSS y tiempos, nunca texto de la página: no sale contenido clínico.
 */
@Injectable({
  providedIn: 'root'
})
export class WebVitalsService {
  private started = false;
  private readonly landingPage: string;
  // Últimos elementos tocados o pulsados con el teclado, para atribuir el INP cuando el elemento ya
  // no está en el DOM al medirlo (p. ej. el botón de un modal que se cierra al pulsarlo)
  private recentInteractions: { time: number; selector: string }[] = [];

  constructor(private insightsService: InsightsService, private ngZone: NgZone) {
    // CrUX atribuye las métricas a la URL con la que se cargó el documento, no a la ruta SPA actual
    const navigation = typeof performance !== 'undefined'
      ? performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      : undefined;
    this.landingPage = navigation ? this.normalizePath(new URL(navigation.name).pathname) : '';
  }

  start(): void {
    if (typeof window === 'undefined' || this.started) return;
    this.started = true;

    // Desde el arranque (el INP puede ser una interacción temprana) y fuera de Angular, para no
    // añadir detecciones de cambios a cada toque
    this.ngZone.runOutsideAngular(() => {
      const remember = (event: Event) => this.rememberInteraction(event);
      document.addEventListener('pointerdown', remember, { capture: true, passive: true });
      document.addEventListener('keydown', remember, { capture: true, passive: true });
    });

    // Los observers usan buffered: true, así que cargar la librería en idle no pierde entradas del arranque
    const load = () => {
      import('web-vitals/attribution')
        .then(({ onLCP, onINP, onCLS }) => {
          onLCP(metric => this.report(metric));
          onINP(metric => this.report(metric));
          onCLS(metric => this.report(metric));
        })
        .catch((error: unknown) => {
          console.error('No se pudo cargar web-vitals', error);
        });
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(load, { timeout: 2000 });
    } else {
      setTimeout(load, 100);
    }
  }

  private report(metric: ReportedMetric): void {
    const properties: { [key: string]: any } = {
      metric: metric.name,
      value: metric.name === 'CLS' ? Number(metric.value.toFixed(4)) : Math.round(metric.value),
      rating: metric.rating,
      navigationType: metric.navigationType,
      metricId: metric.id,
      landingPage: this.landingPage,
      currentPage: this.normalizePath(window.location.pathname),
      viewportWidth: window.innerWidth
    };

    switch (metric.name) {
      case 'LCP': {
        const attribution = metric.attribution;
        Object.assign(properties, {
          // Sin selector = el elemento ya no está en el DOM (p. ej. Angular rehízo el HTML prerenderizado)
          target: attribution.target || (attribution.lcpEntry ? '(removed)' : ''),
          resourceUrl: this.sanitizeUrl(attribution.url),
          timeToFirstByte: Math.round(attribution.timeToFirstByte),
          resourceLoadDelay: Math.round(attribution.resourceLoadDelay),
          resourceLoadDuration: Math.round(attribution.resourceLoadDuration),
          elementRenderDelay: Math.round(attribution.elementRenderDelay)
        });
        break;
      }
      case 'INP': {
        const attribution = metric.attribution;
        const longestScript = attribution.longestScript;
        Object.assign(properties, {
          target: attribution.interactionTarget || this.removedTargetAt(attribution.interactionTime),
          interactionType: attribution.interactionType || '',
          loadState: attribution.loadState,
          inputDelay: Math.round(attribution.inputDelay),
          processingDuration: Math.round(attribution.processingDuration),
          presentationDelay: Math.round(attribution.presentationDelay),
          longestScriptInvoker: longestScript?.entry.invoker || '',
          longestScriptSource: this.sanitizeUrl(longestScript?.entry.sourceURL),
          longestScriptFunction: longestScript?.entry.sourceFunctionName || '',
          longestScriptSubpart: longestScript?.subpart || '',
          longestScriptDuration: longestScript ? Math.round(longestScript.intersectingDuration) : 0
        });
        break;
      }
      case 'CLS': {
        const attribution = metric.attribution;
        const source = attribution.largestShiftSource;
        Object.assign(properties, {
          target: attribution.largestShiftTarget || '',
          loadState: attribution.loadState || '',
          largestShiftValue: Number((attribution.largestShiftValue || 0).toFixed(4)),
          largestShiftTime: Math.round(attribution.largestShiftTime || 0),
          largestShiftDeltaY: source ? Math.round(source.currentRect.y - source.previousRect.y) : 0
        });
        break;
      }
    }

    this.insightsService.trackEvent('WebVital', properties);

    // CLS e INP se reportan cuando la pestaña se oculta: hay que enviarlos ya o se pierden al cerrar
    if (document.visibilityState === 'hidden') {
      this.insightsService.flushOnPageHide();
    }
  }

  private rememberInteraction(event: Event): void {
    this.recentInteractions.push({ time: event.timeStamp, selector: this.describeElement(event.target) });
    if (this.recentInteractions.length > 30) {
      this.recentInteractions.shift();
    }
  }

  // El inicio de la interacción que da web-vitals es el timeStamp de su primer evento (pointerdown
  // o keydown), el mismo que se guardó al tocar. Se marca «(removed)» para distinguirlo en los datos.
  private removedTargetAt(interactionTime: number | undefined): string {
    if (interactionTime === undefined) return '';
    let closest: { time: number; selector: string } | undefined;
    for (const interaction of this.recentInteractions) {
      const gap = Math.abs(interaction.time - interactionTime);
      if (gap <= 50 && (!closest || gap < Math.abs(closest.time - interactionTime))) {
        closest = interaction;
      }
    }
    return closest && closest.selector ? '(removed) ' + closest.selector : '';
  }

  // Selector al estilo de web-vitals (etiqueta, id y clases de hasta tres niveles); nunca texto
  private describeElement(node: EventTarget | null): string {
    const parts: string[] = [];
    let element = node instanceof Element ? node : null;
    while (element && element !== document.body && parts.length < 3) {
      let part = element.tagName.toLowerCase();
      if (element.id) {
        parts.unshift(part + '#' + element.id);
        break;
      }
      const classes = Array.from(element.classList).slice(0, 3);
      if (classes.length) {
        part += '.' + classes.join('.');
      }
      parts.unshift(part);
      element = element.parentElement;
    }
    return parts.join('>');
  }

  // Las rutas /result/:id llevan el identificador del informe; se agrupan sin él
  private normalizePath(pathname: string): string {
    return pathname.replace(/^\/result\/[^/]+/, '/result/:id');
  }

  // Imágenes subidas por el usuario se pintan como data:/blob:, que no deben salir del navegador
  private sanitizeUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url.slice(0, url.indexOf(':') + 1);
    try {
      const parsed = new URL(url, window.location.href);
      return parsed.origin === window.location.origin ? parsed.pathname : parsed.origin + parsed.pathname;
    } catch {
      return '';
    }
  }
}
