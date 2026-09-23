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
    return this.postDiagnoseOrAsk('/diagnose', info);
}

ask(info: any) {
    return this.postDiagnoseOrAsk('/ask', info);
}

private postDiagnoseOrAsk(path: string, info: any) {
    return this.http.post(environment.api + path, info)
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
          return throwError(() => err);
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
          return throwError(() => err);
        })
      );
  }

  opinion(info: any) {
    return this.http.post(environment.api + '/internal/opinion', info)
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

  generateFollowUpQuestions(value): Observable<any> {
    return this.http.post(environment.api + '/questions/followup', value)
      .pipe(
        map((res: any) => {
          return res;
        }),
        catchError((err) => {
          console.log(err);
          return throwError(() => err);
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
          return throwError(() => err);
        })
      );
  }

  processFollowUpAnswers(value): Observable<any> {
    return this.http.post(environment.api + '/patient/update', value)
      .pipe(
        map((res: any) => {
          return res;
        }),
        catchError((err) => {
          console.log(err);
          return throwError(() => err);
        })
      );
  }

  summarizeText(value: any): Observable<any> {
    return this.http.post(environment.api + '/medical/summarize', value);
  }

  getQueueStatus(ticketId: string, timezone: string): Observable<any> {
    const timestamp = new Date().getTime();
    return this.http.post(environment.api + '/internal/status/' + ticketId + '?t=' + timestamp, { timezone })
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
    return this.http.get(environment.api + '/internal/getSystemStatus?t=' + timestamp)
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
    return this.http.get(environment.api + '/internal/health?t=' + timestamp)
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

  analyzeMultimodal(formData: FormData): Observable<any> {
    return this.http.post(environment.api + '/medical/analyze', formData);
  }

  // Borra las imágenes de un análisis antes de que caduquen (24 h). El myuuid
  // forma parte de la ruta del blob en el servidor: sin él no se borra nada.
  deleteUpload(uploadId: string, myuuid: string): Observable<any> {
    return this.http.delete(environment.api + '/medical/upload/' + encodeURIComponent(uploadId), {
      body: { myuuid }
    });
  }

  // Método para negociar conexión WebSocket con Azure Web PubSub
  negotiatePubSub(myuuid: string): Observable<any> {
    return this.http.post(environment.api + '/pubsub/negotiate', { myuuid })
      .pipe(
        map((res: any) => {
          return res;
        }),
        catchError((err) => {
          console.log('PubSub negotiation error:', err);
          this.insightsService.trackException(err);
          return throwError(() => err);
        })
      );
  }

  createPermalink(data: any) {
    return this.http.post(environment.api + '/internal/permalink', data);
  }

  getPermalink(id: string) {
    return this.http.get(environment.api + '/internal/permalink/' + id);
  }
}
