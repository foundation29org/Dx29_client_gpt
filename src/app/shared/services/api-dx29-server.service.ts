import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { InsightsService } from 'app/shared/services/azureInsights.service';

@Injectable({
  providedIn: "root"
})
export class ApiDx29ServerService {
  constructor(private http: HttpClient, public insightsService: InsightsService) { }


  getInfoLocation(){
    return this.http.get('https://ipinfo.io?token=87ec8c4192db17')
    .map( (res : any) => {
        return res;
    }, (err) => {
        console.log(err);
        return err;
    })
}

  postOpenAi(info) {
    return this.http.post(environment.serverapi + '/api/callopenai', info)
      .map((res: any) => {
        return res;
      }, (err) => {
        console.log(err);
        this.insightsService.trackException(err);
        return err;
      })
  }

  callopenaiquestions(info) {
    return this.http.post(environment.serverapi + '/api/callopenaiquestions', info)
      .map((res: any) => {
        return res;
      }, (err) => {
        console.log(err);
        this.insightsService.trackException(err);
        return err;
      })
  }

  opinion(info) {
    return this.http.post(environment.serverapi + '/api/opinion', info)
      .map((res: any) => {
        return res;
      }, (err) => {
        console.log(err);
        this.insightsService.trackException(err);
        return err;
      })
  }

  feedback(info) {
    return this.http.post(environment.serverapi + '/api/feedback', info)
      .map((res: any) => {
        return res;
      }, (err) => {
        console.log(err);
        this.insightsService.trackException(err);
        return err;
      })
  }
}
