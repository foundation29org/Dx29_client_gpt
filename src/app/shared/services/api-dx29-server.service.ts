import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';

@Injectable()
export class ApiDx29ServerService {
    constructor(private http: HttpClient) {}

    postOpenAi(info) {
      return this.http.post(environment.serverapi + '/api/callopenai', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    opinion(info) {
      return this.http.post(environment.serverapi + '/api/opinion', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    feedback(info) {
      return this.http.post(environment.serverapi + '/api/feedback', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    getDetectLanguage(text){
      var jsonText = [{ "text": text }];
        return this.http.post(environment.serverapi+'/api/getDetectLanguage', jsonText)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getTranslationDictionary(lang,info){
      var body = {lang:lang, info: info}
        return this.http.post(environment.serverapi+'/api/translation', body)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getSegmentation(lang,textf){
      var body = {lang:lang, info: textf}
      return this.http.post(environment.serverapi+'/api/translation/segments', body)
      .map( (res : any) => {
          return res;
      }, (err) => {
          console.log(err);
          return err;
      })
  }
}
