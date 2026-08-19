import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from 'environments/environment';
import { InsightsService } from './azureInsights.service';

declare let gtag: any;

interface GoogleAdsConfig {
  primaryId: string;
  secondaryId?: string;
  conversionId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  private cookieConsentGiven = false;

  // Google Analytics + Google Ads comparten un único script gtag.js.
  // googleTagsRequested es una guarda SÍNCRONA (a diferencia del antiguo flag
  // "loaded", que solo se marcaba dentro del onload del script): evita que dos
  // llamadas casi simultáneas a setCookieConsent(true) inyecten el script dos veces.
  private googleTagsRequested = false;
  private googleTagsLoaded = false;
  private googleTagsAvailableForTenant: boolean | null = null; // null = aún no evaluado
  private gaEventQueue: Array<() => void> = [];

  // Hotjar se difiere de forma independiente y más tarde: no es crítico para el negocio
  // y no aporta valor si el usuario no llega a interactuar con la página.
  private hotjarRequested = false;
  private hotjarLoaded = false;

  constructor(
    private insightsService: InsightsService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * Marca que el usuario ha dado consentimiento para cookies (GDPR)
   * y programa la carga de los scripts de analytics.
   */
  setCookieConsent(consent: boolean): void {
    this.cookieConsentGiven = consent;
    if (consent) {
      this.scheduleGoogleTags();
      this.scheduleHotjar();
    } else {
      // Sin consentimiento no se debe conservar telemetría en espera
      this.gaEventQueue = [];
    }
  }

  /**
   * Verifica si se tiene consentimiento de cookies
   */
  hasCookieConsent(): boolean {
    return this.cookieConsentGiven;
  }

  // -----------------------------------------------------------------------
  // Google Analytics + Google Ads
  // -----------------------------------------------------------------------

  /**
   * Programa la carga de Google Analytics/Ads en cuanto ocurra lo primero de:
   * - el navegador queda idle (con un máximo de 2s de espera, para no retrasarla
   *   indefinidamente en un dispositivo siempre ocupado)
   * - el usuario interactúa con la página (pointerdown/keydown/touchstart)
   * Es una guarda idempotente: llamarla varias veces solo programa una carga.
   */
  private scheduleGoogleTags(): void {
    if (this.googleTagsRequested || !this.document) return;
    this.googleTagsRequested = true;

    this.runOnceOnIdleOrInteraction(
      () => this.loadGoogleTags(),
      2000,
      ['pointerdown', 'keydown', 'touchstart']
    );
  }

  /**
   * Carga un único script gtag.js y registra en él tanto Google Analytics como
   * Google Ads (gtag.js soporta múltiples `gtag('config', id)` sobre la misma carga,
   * no hace falta un <script> por id). Antes se cargaban dos scripts independientes,
   * lo que además de duplicar peso podía dejar dos inicializaciones de dataLayer/gtag.
   */
  private loadGoogleTags(): void {
    const gaId = this.getGoogleAnalyticsId();
    const adsConfig = this.getGoogleAdsConfig();

    if (!gaId && !adsConfig) {
      // Tenant sin marketing analytics (p.ej. sanitarios internos)
      this.googleTagsAvailableForTenant = false;
      this.gaEventQueue = [];
      return;
    }
    this.googleTagsAvailableForTenant = true;

    const primaryId = gaId || adsConfig?.primaryId;
    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;

    script.onload = () => {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = (window as any).gtag || function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      };
      const gtagFn = (window as any).gtag;
      gtagFn('js', new Date());

      if (gaId) {
        gtagFn('config', gaId);
      }
      if (adsConfig) {
        gtagFn('config', adsConfig.primaryId);
        if (adsConfig.secondaryId) {
          gtagFn('config', adsConfig.secondaryId);
        }
        if (adsConfig.conversionId) {
          gtagFn('event', 'conversion', { send_to: adsConfig.conversionId });
        }
      }

      this.googleTagsLoaded = true;
      this.flushGaEventQueue();
    };
    script.onerror = () => {
      // Permitir un futuro reintento si la carga falla (p.ej. bloqueada por un adblocker)
      this.googleTagsRequested = false;
    };

    this.document.head.appendChild(script);
  }

  /**
   * Obtiene la configuración de Google Ads según el tenant
   * DxGPT (incluyendo versión EU) usa Google Ads
   */
  private getGoogleAdsConfig(): GoogleAdsConfig | null {
    const tenantsWithGoogleAds = ['dxgpt-prod', 'dxeugpt', 'dxeugpt-prod'];

    if (tenantsWithGoogleAds.includes(environment.tenantId)) {
      return {
        primaryId: 'AW-335378785',
        secondaryId: 'AW-16829919003',
        conversionId: 'AW-335378785/wcKYCMDpnJIZEOHy9Z8B'
      };
    }
    return null;
  }

  /**
   * Obtiene el ID de Google Analytics según el tenant
   * Solo los tenants públicos de DxGPT cargan analytics de marketing.
   * Los tenants internos sanitarios usan Application Insights/server logs.
   */
  private getGoogleAnalyticsId(): string | null {
    const tenantsWithGoogleAnalytics = ['dxgpt-prod', 'dxeugpt', 'dxeugpt-prod'];
    if (!tenantsWithGoogleAnalytics.includes(environment.tenantId)) return null;

    const gaIds: { [key: string]: string } = {
      'dxgpt-prod': 'G-2FZQ49SRWY',
      'dxeugpt': 'G-2FZQ49SRWY',
      'dxeugpt-prod': 'G-2FZQ49SRWY',
    };
    return gaIds[environment.tenantId] || null;
  }

  /**
   * Verifica si Google Analytics está disponible
   */
  isGoogleAnalyticsAvailable(): boolean {
    return this.googleTagsLoaded && typeof gtag !== 'undefined';
  }

  /**
   * Encola un envío a GA si el script aún no está listo, en vez de descartarlo.
   * Esto garantiza que ningún trackEvent/trackPageView se pierde por llegar
   * antes de que gtag.js haya cargado.
   */
  private enqueueGaEvent(send: () => void): void {
    if (this.googleTagsAvailableForTenant === false) return; // este tenant nunca tendrá GA
    if (this.googleTagsLoaded) {
      send();
      return;
    }
    this.gaEventQueue.push(send);
  }

  private flushGaEventQueue(): void {
    const queued = this.gaEventQueue;
    this.gaEventQueue = [];
    queued.forEach(send => send());
  }

  // -----------------------------------------------------------------------
  // Hotjar
  // -----------------------------------------------------------------------

  /**
   * Programa la carga de Hotjar de forma independiente y más tardía que GA/Ads:
   * espera a una interacción real del usuario (scroll/touch/click) o, como
   * máximo, 8s de idle. Hotjar solo aporta valor si hay interacción que grabar,
   * así que no hay motivo para competir por CPU con el resto del arranque.
   */
  private scheduleHotjar(): void {
    if (this.hotjarRequested || !this.document) return;

    const tenantsWithHotjar = ['dxgpt-prod', 'dxeugpt', 'dxeugpt-prod'];
    if (!environment.production || !tenantsWithHotjar.includes(environment.tenantId)) return;
    if (!environment.hotjarSiteId) return;

    this.hotjarRequested = true;

    this.runOnceOnIdleOrInteraction(
      () => this.loadHotjar(),
      8000,
      ['pointerdown', 'touchstart', 'scroll', 'mousemove']
    );
  }

  private loadHotjar(): void {
    if (this.hotjarLoaded) return;
    const hotjarSiteId = environment.hotjarSiteId;

    ((h: any, o: Document, t: string, j: string, a?: any, r?: any) => {
      h.hj = h.hj || function() {
        (h.hj.q = h.hj.q || []).push(arguments);
      };
      h._hjSettings = {
        hjid: hotjarSiteId,
        hjsv: 6,
        cookieDomain: window.location.hostname,
        cookieSecure: true,
        cookieSameSite: 'Lax'
      };
      a = o.getElementsByTagName('head')[0];
      r = o.createElement('script');
      r.async = 1;
      r.defer = true;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a?.appendChild(r);
    })(window as any, this.document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');

    this.hotjarLoaded = true;
  }

  // -----------------------------------------------------------------------
  // Utilidad de scheduling compartida
  // -----------------------------------------------------------------------

  /**
   * Ejecuta `callback` una única vez, en cuanto ocurra lo primero de:
   * - requestIdleCallback (con un timeout de seguridad `idleTimeoutMs`)
   * - cualquiera de los `interactionEvents` del usuario
   * Limpia listeners/timers pendientes en cuanto se dispara.
   */
  private runOnceOnIdleOrInteraction(
    callback: () => void,
    idleTimeoutMs: number,
    interactionEvents: string[]
  ): void {
    let fired = false;
    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const cleanupInteractionListeners = () => {
      interactionEvents.forEach(evt => window.removeEventListener(evt, trigger));
    };

    const trigger = () => {
      if (fired) return;
      fired = true;
      cleanupInteractionListeners();
      if (idleHandle !== undefined && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
      callback();
    };

    interactionEvents.forEach(evt =>
      window.addEventListener(evt, trigger, { once: true, passive: true })
    );

    if ('requestIdleCallback' in window) {
      idleHandle = (window as any).requestIdleCallback(trigger, { timeout: idleTimeoutMs });
    } else {
      timeoutHandle = setTimeout(trigger, idleTimeoutMs);
    }
  }

  // -----------------------------------------------------------------------
  // API pública de tracking (sin cambios de firma respecto a antes)
  // -----------------------------------------------------------------------

  /**
   * Envía un evento a ambos sistemas de analytics (GA4 y Azure Application Insights)
   */
  trackEvent(eventName: string, properties?: { [key: string]: any }) {
    const enhancedProperties = {
      ...properties,
      tenantId: environment.tenantId,
      timestamp: new Date().toISOString()
    };

    // Enviar a Azure Application Insights (siempre funciona)
    this.insightsService.trackEvent(eventName, enhancedProperties);

    // Enviar a Google Analytics (se encola si el script aún no ha cargado)
    this.trackGoogleAnalyticsEvent(eventName, enhancedProperties);
  }

  /**
   * Envía una vista de página a ambos sistemas
   */
  trackPageView(pageName: string, properties?: { [key: string]: any }) {
    const enhancedProperties = {
      ...properties,
      tenantId: environment.tenantId,
      timestamp: new Date().toISOString()
    };

    // Enviar a Azure Application Insights
    this.insightsService.trackPageView(pageName, enhancedProperties);
  }

  /**
   * Envía una excepción a Azure Application Insights
   */
  trackException(exception: any) {
    this.insightsService.trackException(exception);
  }

  /**
   * Envía evento específico para parámetros de iframe
   */
  trackIframeParameters(params: any) {
    const eventName = 'iframe_parameters_received';
    const properties = {
      centro: params.centro || '',
      ambito: params.ambito || '',
      especialidad: params.especialidad || '',
      isInIframe: params.isInIframe || false
    };

    this.trackEvent(eventName, properties);
  }

  /**
   * Envía evento de búsqueda
   */
  trackSearch(searchTerm: string, resultsCount?: number) {
    this.trackEvent('search_performed', {
      searchTerm,
      resultsCount: resultsCount || 0
    });
  }

  /**
   * Envía evento de descarga
   */
  trackDownload(fileName: string, fileType: string) {
    this.trackEvent('file_download', {
      fileName,
      fileType
    });
  }

  /**
   * Envía evento de clic en botón
   */
  trackButtonClick(buttonName: string, location: string) {
    this.trackEvent('button_click', {
      buttonName,
      location
    });
  }

  // Métodos privados para Google Analytics

  private trackGoogleAnalyticsEvent(eventName: string, properties: any) {
    // Sin consentimiento no se encola ni se envía nada a GA
    if (!this.cookieConsentGiven) return;

    this.enqueueGaEvent(() => {
      try {
        gtag('event', eventName, {
          'event_category': 'Custom',
          'event_label': properties.tenantId,
          'tenant_id': properties.tenantId,
          ...properties
        });
      } catch (error) {
        console.warn('Google Analytics no disponible:', error);
      }
    });
  }
}
