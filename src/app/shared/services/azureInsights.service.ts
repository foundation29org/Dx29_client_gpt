import { Injectable } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { environment } from 'environments/environment';

@Injectable()
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
    if(environment.production){
      this.appInsights.trackEvent({ name: eventName }, properties);
    }else{
      console.log(eventName, properties);
    }
  }

  trackException(exception) {
    if(environment.production){
      let stringException;
      if (typeof exception === 'string') {
        stringException = exception;
      } else if (typeof exception === 'object') {
        stringException = JSON.stringify(exception);
      } else {
        stringException = exception.toString();
      }
      this.appInsights.trackException({exception: new Error(stringException)});
    }else{
      console.log(exception);
    }
    
  }
}
