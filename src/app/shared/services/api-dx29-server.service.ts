import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from 'environments/environment';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'

@Injectable()
export class ApiDx29ServerService {
    constructor(private http: HttpClient) {}

    getDetectLanguage(text){
      var jsonText = [{ "text": text }];
        return this.http.post(environment.api+'/api/getDetectLanguage', jsonText)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }
    getTranslationDictionary(text){
      var jsonText = [{ "text": text }];
        return this.http.post(environment.api+'/api/getTranslationDictionary', jsonText)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    calculate(info, lang) {
      return this.http.post(environment.api + '/api/gateway/Diagnosis/calculate/'+lang, info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    searchDiseases(info) {
      return this.http.post(environment.api + '/api/gateway/search/disease/', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    searchSymptoms(info) {
      return this.http.post(environment.api + '/api/gateway/search/symptoms/', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    sendEmailResultsUndiagnosed(info) {
      return this.http.post(environment.api + '/api/sendEmailResultsUndiagnosed', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    sendEmailResultsDiagnosed(info) {
      return this.http.post(environment.api + '/api/sendEmailResultsDiagnosed', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    sendEmailRevolution(info) {
      return this.http.post(environment.api + '/api/sendEmailRevolution', info)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    createblobOpenDx29(symptoms) {
      return this.http.post(environment.api + '/api/blobOpenDx29', symptoms)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    createblobOpenDx29Timeline(symptoms) {
      return this.http.post(environment.api + '/api/blobOpenDx29Timeline', symptoms)
        .map((res: any) => {
          return res;
        }, (err) => {
          console.log(err);
          return err;
        })
    }

    chekedSymptomsOpenDx29(info) {
      return this.http.post(environment.api + '/api/chekedSymptomsOpenDx29', info)
        .map((res: any) => {
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
          return err;
        })
    }
}
