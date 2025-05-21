import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { Observable, throwError } from 'rxjs';
import { catchError, map} from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class ApiDx29ServerService {
  
  constructor(private http: HttpClient, public insightsService: InsightsService) { }



getInfoLocation() {
  return new Observable(observer => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      observer.next({ timezone });
      observer.complete();
    } catch (error) {
      console.log(error);
      this.insightsService.trackException(error);
      observer.error(error);
    }
  });
}

diagnose(info: any) {
    return this.http.post(environment.api + '/diagnose', info)
      .pipe(
        map((res: any) => {
          if (res.result === 'queued') {
            return {
              ...res,
              isQueued: true,
              queueInfo: res.queueInfo
            };
          }
          return res;
        }),
        catchError((err) => {
          console.log(err);
          this.insightsService.trackException(err);
          return err;
        })
      );
  }

  callInfoDisease(info: any) {
    return this.http.post(environment.api + '/disease/info', info)
      .pipe(
        map((res: any) => {
          return res;
        }),
        catchError((err) => {
        console.log(err);
        this.insightsService.trackException(err);
          return err;
        })
      );
  }

  opinion(info: any) {
    return this.http.post(environment.api + '/opinion', info)
      .pipe(
        map((res: any) => {
          return res;
        }),
        catchError((err) => {
          console.log(err);
          this.insightsService.trackException(err);
          return err;
        })
      );
  }

  generateFollowUpQuestions(value): Observable<any> {
    return this.http.post(environment.api + '/questions/followup', value)
      .pipe(
        map((res: any) => {
          return res;
        }),
        catchError((err) => {
          console.log(err);
          return throwError(err || 'Server error');
        })
      );
  }

  generateERQuestions(value): Observable<any> {
    return this.http.post(environment.api + '/questions/emergency', value)
      .pipe(
        map((res: any) => {
          return res;
        }),
        catchError((err) => {
          console.log(err);
          return throwError(err || 'Server error');
        })
      );
  }

  // Nuevo método para procesar las respuestas a las preguntas de seguimiento
  processFollowUpAnswers(value): Observable<any> {
    return this.http.post(environment.api + '/patient/update', value)
      .pipe(
        map((res: any) => {
          return res;
        }),
        catchError((err) => {
          console.log(err);
          return throwError(err || 'Server error');
        })
      );
  }

  summarizeText(value: any): Observable<any> {
    return this.http.post(environment.api + '/medical/summarize', value);
  }

  getQueueStatus(ticketId: string): Observable<any> {
    const timestamp = new Date().getTime();
    return this.http.get(environment.api + '/status/' + ticketId + '?t=' + timestamp)
      .pipe(
        map((res: any) => {
          return res;
        }),
        catchError((err) => {
          console.log(err);
          this.insightsService.trackException(err);
          return throwError(() => err);
        })
      );
  }

  getSystemStatus(): Observable<any> {
    const timestamp = new Date().getTime();
    return this.http.get(environment.api + '/getSystemStatus?t=' + timestamp)
      .pipe(
        map((res: any) => {
          return res;
        }),
        catchError((err) => {
          console.log(err);
          this.insightsService.trackException(err);
          return throwError(() => err);
        })
      );
  }

  getHealthStatus(): Observable<any> {
    const timestamp = new Date().getTime();
    return this.http.get(environment.api + '/health?t=' + timestamp)
      .pipe(
        map((res: any) => {
          return res;
        }),
        catchError((err) => {
          console.log(err);
          this.insightsService.trackException(err);
          return throwError(() => err);
        })
      );
  }
}
