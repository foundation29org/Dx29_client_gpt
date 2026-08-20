import { Injectable, Inject, DOCUMENT } from '@angular/core';

import { environment } from 'environments/environment';
import { InsightsService } from './azureInsights.service';

// Mantener Hotjar desactivado sin alterar la implementación de GA/Ads
// verificada en producción en la versión 0.0133.
const HOTJAR_ENABLED = false;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  
  private googleAnalyticsLoaded = false;
  private googleAdsLoaded = false;
  private googleTagScriptLoaded = false;
  private googleTagScriptLoading?: Promise<void>;
  private googleTagQueueInitialized = false;
  private configuredGoogleTagIds = new Set<string>();
  private hotjarLoaded = false;
  private cookieConsentGiven = false;

  constructor(
    private insightsService: InsightsService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * Marca que el usuario ha dado consentimiento para cookies (GDPR)
   * y carga los scripts de analytics
   */
  setCookieConsent(consent: boolean): void {
    this.cookieConsentGiven = consent;
    if (consent) {
      this.loadGoogleAnalytics();
      this.loadGoogleAds();
      if (HOTJAR_ENABLED) {
        this.loadHotjar();
      }
    }
  }

  /**
   * Verifica si se tiene consentimiento de cookies
   */
  hasCookieConsent(): boolean {
    return this.cookieConsentGiven;
  }

  /**
   * Carga Google Analytics dinámicamente (solo tras consentimiento en EU mode)
   */
  loadGoogleAnalytics(gaId?: string): void {
    if (this.googleAnalyticsLoaded || !this.document) return;

    const analyticsId = gaId || this.getGoogleAnalyticsId();
    if (!analyticsId) return;

    this.loadGoogleTagScript(analyticsId)
      .then(() => {
        this.configureGoogleTag(analyticsId);
        this.googleAnalyticsLoaded = true;
      })
      .catch((error: unknown) => {
        console.warn('No se pudo cargar Google Analytics', error);
      });
  }

  /**
   * Carga Google Ads dinámicamente (para tracking de conversiones)
   */
  loadGoogleAds(): void {
    if (this.googleAdsLoaded || !this.document) return;

    const adsConfig = this.getGoogleAdsConfig();
    if (!adsConfig) return;

    this.loadGoogleTagScript(adsConfig.primaryId)
      .then(() => {
        this.configureGoogleTag(adsConfig.primaryId);
        if (adsConfig.secondaryId) {
          this.configureGoogleTag(adsConfig.secondaryId);
        }

        this.googleAdsLoaded = true;
      })
      .catch((error: unknown) => {
        console.warn('No se pudo cargar Google Ads', error);
      });
  }

  /**
   * Carga gtag.js una única vez. Google Analytics y Google Ads usan el mismo
   * script; cada producto se configura después con su ID propio.
   */
  private loadGoogleTagScript(seedId: string): Promise<void> {
    if (this.googleTagScriptLoaded) {
      return Promise.resolve();
    }

    if (this.googleTagScriptLoading) {
      return this.googleTagScriptLoading;
    }

    this.initializeGoogleTagQueue();

    const loadPromise = new Promise<void>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${seedId}`;

      script.onload = () => {
        this.googleTagScriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        script.remove();
        reject(new Error('No se pudo cargar gtag.js'));
      };

      this.document.head.appendChild(script);
    })
      .catch((error: unknown) => {
        this.googleTagScriptLoading = undefined;
        throw error;
      });

    this.googleTagScriptLoading = loadPromise;
    return loadPromise;
  }

  /**
   * Deja la cola disponible antes de descargar gtag.js, igual que el snippet
   * oficial de Google. Así no se pierden configuraciones ni eventos tempranos.
   */
  private initializeGoogleTagQueue(): void {
    if (this.googleTagQueueInitialized) return;

    const globalWindow = window as any;
    globalWindow.dataLayer = globalWindow.dataLayer || [];

    if (typeof globalWindow.gtag !== 'function') {
      globalWindow.gtag = (...args: any[]) => {
        globalWindow.dataLayer.push(args);
      };
      globalWindow.gtag('js', new Date());
    }

    this.googleTagQueueInitialized = true;
  }

  private configureGoogleTag(tagId: string): void {
    if (this.configuredGoogleTagIds.has(tagId)) return;

    (window as any).gtag('config', tagId);
    this.configuredGoogleTagIds.add(tagId);
  }

  /**
   * Obtiene la configuración de Google Ads según el tenant
   * DxGPT (incluyendo versión EU) usa Google Ads
   */
  private getGoogleAdsConfig(): { primaryId: string; secondaryId?: string } | null {
    const tenantsWithGoogleAds = ['dxgpt-prod', 'dxeugpt', 'dxeugpt-prod'];
    
    if (tenantsWithGoogleAds.includes(environment.tenantId)) {
      return {
        // Paid: única cuenta Ads con conversión web directa activa.
        primaryId: 'AW-16829919003'
        // Grant histórico (no cargar): AW-335378785.
        // Grant recibe `diagnosis_finished` desde la conversión importada de GA4.
      };
    }
    return null;
  }

  /**
   * Carga Hotjar dinámicamente
   */
  loadHotjar(): void {
    if (this.hotjarLoaded || !this.document) return;
    
    // Hotjar solo para tenants habilitados en producción
    const tenantsWithHotjar = ['dxgpt-prod', 'dxeugpt', 'dxeugpt-prod'];
    if (!environment.production || !tenantsWithHotjar.includes(environment.tenantId)) return;

    const hotjarSiteId = environment.hotjarSiteId;
    if (!hotjarSiteId) return;

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
    return this.googleAnalyticsLoaded && typeof (window as any).gtag === 'function';
  }

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

    // Enviar a Google Analytics (si está disponible)
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
    // No enviar eventos si no hay consentimiento (para EU mode) o si GA no está cargado
    if (!this.isGoogleAnalyticsAvailable()) {
      return;
    }

    try {
      (window as any).gtag('event', eventName, {
        'event_category': 'Custom',
        'event_label': properties.tenantId,
        'tenant_id': properties.tenantId,
        ...properties
      });
    } catch (error) {
      console.warn('Google Analytics no disponible:', error);
    }
  }
}
