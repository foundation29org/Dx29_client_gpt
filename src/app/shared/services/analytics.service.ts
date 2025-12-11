import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from 'environments/environment';
import { InsightsService } from './azureInsights.service';

declare let gtag: any;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  
  private googleAnalyticsLoaded = false;
  private googleAdsLoaded = false;
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
      this.loadHotjar();
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

    // Crear el script de gtag
    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
    
    script.onload = () => {
      // Inicializar gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(arguments);
      }
      (window as any).gtag = gtag;
      gtag('js', new Date());
      gtag('config', analyticsId);
      
      this.googleAnalyticsLoaded = true;
      console.log('Google Analytics cargado tras consentimiento:', analyticsId);
    };

    this.document.head.appendChild(script);
  }

  /**
   * Carga Google Ads dinámicamente (para tracking de conversiones)
   */
  loadGoogleAds(): void {
    if (this.googleAdsLoaded || !this.document) return;

    const adsConfig = this.getGoogleAdsConfig();
    if (!adsConfig) return;

    // Crear el script de Google Ads
    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${adsConfig.primaryId}`;
    
    script.onload = () => {
      // Asegurar que dataLayer existe
      (window as any).dataLayer = (window as any).dataLayer || [];
      
      // Si gtag no existe, crearlo
      if (!(window as any).gtag) {
        (window as any).gtag = function() {
          (window as any).dataLayer.push(arguments);
        };
        (window as any).gtag('js', new Date());
      }
      
      const gtag = (window as any).gtag;
      
      // Configurar Google Ads
      gtag('config', adsConfig.primaryId);
      if (adsConfig.secondaryId) {
        gtag('config', adsConfig.secondaryId);
      }
      
      // Enviar evento de conversión
      if (adsConfig.conversionId) {
        gtag('event', 'conversion', { 'send_to': adsConfig.conversionId });
      }
      
      this.googleAdsLoaded = true;
      console.log('Google Ads cargado:', adsConfig.primaryId);
    };

    this.document.head.appendChild(script);
  }

  /**
   * Obtiene la configuración de Google Ads según el tenant
   * DxGPT (incluyendo versión EU) usa Google Ads
   */
  private getGoogleAdsConfig(): { primaryId: string; secondaryId?: string; conversionId?: string } | null {
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
   * Carga Hotjar dinámicamente
   */
  loadHotjar(): void {
    if (this.hotjarLoaded || !this.document) return;
    
    // Hotjar solo para DxGPT (incluyendo versión EU) en producción
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
    console.log('Hotjar cargado tras consentimiento');
  }

  /**
   * Obtiene el ID de Google Analytics según el tenant
   * Todos los tenants cargan GA dinámicamente para mejor rendimiento
   */
  private getGoogleAnalyticsId(): string | null {
    const gaIds: { [key: string]: string } = {
      'dxgpt-prod': 'G-2FZQ49SRWY',
      'dxgpt-local': 'G-2FZQ49SRWY',
      'dxeugpt-prod': 'G-2FZQ49SRWY',
      'salud-gpt-prod': 'G-RT0R7199TB',
      'sermas-gpt-prod': 'G-XHQLTXXT8X',
      'iasalut-ajuda-dx-prod': 'G-PSF306RXEL'
    };
    return gaIds[environment.tenantId] || null;
  }

  /**
   * Verifica si Google Analytics está disponible
   */
  isGoogleAnalyticsAvailable(): boolean {
    return this.googleAnalyticsLoaded && typeof gtag !== 'undefined';
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
      gtag('event', eventName, {
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
