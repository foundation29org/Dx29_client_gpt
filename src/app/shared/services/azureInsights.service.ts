import { Injectable } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: "root"
})
export class InsightsService {
  private appInsights: ApplicationInsights;
  private initialized = false;
  private queuedTelemetry: Array<() => void> = [];

  constructor() {
    this.appInsights = new ApplicationInsights({ config: {
      instrumentationKey: environment.INSTRUMENTATION_KEY,
      disableFetchTracking: true,
      disableAjaxTracking: true,
      enableAutoRouteTracking: false,
      autoTrackPageVisitTime: false,
      loggingLevelConsole: 1,
      // El SDK usa "unload" por defecto para hacer flush de telemetría al salir, pero un
      // handler de "unload" en el frame principal impide que el navegador restaure la página
      // desde el back/forward cache (bfcache). Se excluye aquí: el SDK sigue haciendo flush
      // igualmente con "pagehide"/"visibilitychange", que sí son compatibles con bfcache.
      disablePageUnloadEvents: ['unload'],
      /* ...Other Configuration Options... */
    } });
    
    // Diferir la carga de App Insights para no bloquear el render inicial
    this.deferredInit();
  }

  private deferredInit(): void {
    // Usar requestIdleCallback si está disponible, sino setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => this.initialize(), { timeout: 2000 });
    } else {
      setTimeout(() => this.initialize(), 100);
    }
  }

  private initialize(): void {
    if (this.initialized) return;
    this.appInsights.loadAppInsights();
    this.initialized = true;
    this.flushQueuedTelemetry();
  }

  private enqueueTelemetry(sendTelemetry: () => void): void {
    if (this.initialized) {
      sendTelemetry();
      return;
    }

    this.queuedTelemetry.push(sendTelemetry);
  }

  private flushQueuedTelemetry(): void {
    const queuedTelemetry = [...this.queuedTelemetry];
    this.queuedTelemetry = [];
    queuedTelemetry.forEach(sendTelemetry => sendTelemetry());
  }

  trackEvent(eventName: string, properties?: { [key: string]: any }) {
    // Siempre incluir tenantId en las propiedades
    const enhancedProperties = {
      ...properties,
      tenantId: environment.tenantId,
      timestamp: new Date().toISOString(),
      environment: environment.production ? 'production' : 'development'
    };

    this.enqueueTelemetry(() => {
      if(environment.production){
        this.appInsights.trackEvent({ name: eventName }, enhancedProperties);
      }else{
        this.appInsights.trackEvent({ name: eventName }, enhancedProperties);
        console.log(`[${environment.tenantId}] ${eventName}`, enhancedProperties);
      }
    });
  }

  trackPageView(pageName: string, properties?: { [key: string]: any }) {
    const enhancedProperties = {
      ...properties,
      tenantId: environment.tenantId,
      timestamp: new Date().toISOString(),
      environment: environment.production ? 'production' : 'development'
    };

    this.enqueueTelemetry(() => {
      if(environment.production){
        this.appInsights.trackPageView({ name: pageName, properties: enhancedProperties });
      }else{
        console.log(`[${environment.tenantId}] Page View: ${pageName}`, enhancedProperties);
      }
    });
  }

  trackException(exception) {
    // Asegurar que App Insights esté inicializado
    if (!this.initialized) {
      this.initialize();
    }

    let stringException;
    if (typeof exception === 'string') {
      stringException = exception;
    } else if (typeof exception === 'object') {
      stringException = JSON.stringify(exception);
    } else {
      stringException = exception.toString();
    }

    const enhancedException = {
      exception: new Error(stringException),
      properties: {
        tenantId: environment.tenantId,
        timestamp: new Date().toISOString(),
        environment: environment.production ? 'production' : 'development'
      }
    };

    if(environment.production){
      this.appInsights.trackException(enhancedException);
    }else{
      console.log(`[${environment.tenantId}] Exception:`, enhancedException);
    }
  }
}
