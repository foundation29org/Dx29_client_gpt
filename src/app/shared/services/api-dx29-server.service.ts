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

  postAnonymize(info) {
    return this.http.post(environment.serverapi + '/api/callanonymized', info)
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

  getDetectLanguage(text) {
    var jsonText = [{ "text": text }];
    return this.http.post(environment.serverapi + '/api/getDetectLanguage', jsonText)
      .map((res: any) => {
        return res;
      }, (err) => {
        console.log(err);
        this.insightsService.trackException(err);
        return err;
      })
  }

  getTranslationDictionary(lang, info) {
    var body = { lang: lang, info: info }
    return this.http.post(environment.serverapi + '/api/translation', body)
      .map((res: any) => {
        return res;
      }, (err) => {
        console.log(err);
        this.insightsService.trackException(err);
        return err;
      })
  }

  getTranslationInvert(lang, info) {
    var body = { lang: lang, info: info }
    return this.http.post(environment.serverapi + '/api/translationinvert', body)
      .map((res: any) => {
        return res;
      }, (err) => {
        console.log(err);
        this.insightsService.trackException(err);
        return err;
      })
  }

  getSegmentation(lang, textf) {
    var body = { lang: lang, info: textf }
    return this.http.post(environment.serverapi + '/api/translation/segments', body)
      .map((res: any) => {
        return res;
      }, (err) => {
        console.log(err);
        this.insightsService.trackException(err);
        return err;
      })
  }
}
