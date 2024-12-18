import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { catchError, map} from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class ApiDx29ServerService {
  constructor(private http: HttpClient, public insightsService: InsightsService) { }



getInfoLocation() {
  return this.http.get('https://ipinfo.io?token=87ec8c4192db17').pipe(
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

  postOpenAi(info: any) {
    return this.http.post(environment.serverapi + '/api/callopenai', info)
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

  postOpenAiNewModel(info: any) {
    return this.http.post(environment.serverapi + '/api/callopenaiV2', info)
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

  callopenaiquestions(info: any) {
    return this.http.post(environment.serverapi + '/api/callopenaiquestions', info)
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
    return this.http.post(environment.serverapi + '/api/opinion', info)
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

  feedback(info: any) {
    return this.http.post(environment.serverapi + '/api/feedback', info)
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
}
