import { Injectable } from '@angular/core';
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

  constructor(private insightsService: InsightsService) {
    // CrUX atribuye las métricas a la URL con la que se cargó el documento, no a la ruta SPA actual
    const navigation = typeof performance !== 'undefined'
      ? performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      : undefined;
    this.landingPage = navigation ? this.normalizePath(new URL(navigation.name).pathname) : '';
  }

  start(): void {
    if (typeof window === 'undefined' || this.started) return;
    this.started = true;

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
          target: attribution.interactionTarget || '',
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
