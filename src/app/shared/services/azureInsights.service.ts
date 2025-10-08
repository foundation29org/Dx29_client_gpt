import { Injectable } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: "root"
})
export class InsightsService {
  private appInsights: ApplicationInsights;

  constructor() {
    this.appInsights = new ApplicationInsights({ config: {
      instrumentationKey: environment.INSTRUMENTATION_KEY,
      disableFetchTracking: true,
      disableAjaxTracking: true,
      enableAutoRouteTracking: false,
      autoTrackPageVisitTime : false,
      loggingLevelConsole: 1,
      /* ...Other Configuration Options... */
    } });
    this.appInsights.loadAppInsights();
  }

  trackEvent(eventName: string, properties?: { [key: string]: any }) {
    // Siempre incluir tenantId en las propiedades
    const enhancedProperties = {
      ...properties,
      tenantId: environment.tenantId,
      timestamp: new Date().toISOString(),
      environment: environment.production ? 'production' : 'development'
    };

    if(environment.production){
      this.appInsights.trackEvent({ name: eventName }, enhancedProperties);
    }else{
      this.appInsights.trackEvent({ name: eventName }, enhancedProperties);
      console.log(`[${environment.tenantId}] ${eventName}`, enhancedProperties);
    }
  }

  trackPageView(pageName: string, properties?: { [key: string]: any }) {
    const enhancedProperties = {
      ...properties,
      tenantId: environment.tenantId,
      timestamp: new Date().toISOString(),
      environment: environment.production ? 'production' : 'development'
    };

    if(environment.production){
      this.appInsights.trackPageView({ name: pageName, properties: enhancedProperties });
    }else{
      console.log(`[${environment.tenantId}] Page View: ${pageName}`, enhancedProperties);
    }
  }

  trackException(exception) {
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
