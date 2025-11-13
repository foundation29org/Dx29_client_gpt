import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { InsightsService } from './azureInsights.service';

declare let gtag: any;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  
  constructor(private insightsService: InsightsService) {}

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
    try {
      if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
          'event_category': 'Custom',
          'event_label': properties.tenantId,
          'tenant_id': properties.tenantId,
          ...properties
        });
      }
    } catch (error) {
      console.warn('Google Analytics no disponible:', error);
    }
  }
}
