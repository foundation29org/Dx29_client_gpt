import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from 'environments/environment';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'
import { OVERLAY_KEYBOARD_DISPATCHER_PROVIDER } from '@angular/cdk/overlay/keyboard/overlay-keyboard-dispatcher';

@Injectable()
export class Apif29BioService {

    constructor(private http: HttpClient) {}

    getSymptomsOfDisease(lang,listIds,depth){
        return this.http.post(environment.urlDxv2+'/api/v1/F29Bio/disease/phenotypes/'+lang, listIds)
            .map( (res : any) => {
                return res;
            }, (err) => {
                console.log(err);
                return err;
            })

    }
    getInfoSymptomsJSON(listIds,json){
        return new Observable((observer)=>{
            var listFound=[];
            for(var k=0;k<listIds.length;k++){
                listFound.push(json.filter(function(hpoInfo){
                if( hpoInfo.id == listIds[k]){
                    return hpoInfo;
                }}))
            }
            observer.next(JSON.parse(JSON.stringify(listFound)));
        })

    }

    getInfoOfSymptoms(lang,listIds){
        //var startTime = new Date().getTime();
        return this.http.post(environment.urlDxv2+'/api/v1/F29Bio/phenotypes/'+lang, listIds)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getInfoOfDiseasesLang(listOfDiseases, lang){
        return this.http.post(environment.urlDxv2+'/api/v1/F29Bio/diseases/'+lang, listOfDiseases)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    
    callTextAnalytics(textf){
        return this.http.post(environment.api+'/api/callTextAnalytics', textf)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }


    getSegmentation(lang,textf){
        return this.http.post(environment.f29bio+'/api/Translation/document/segmentation?lan='+lang, textf)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getTranslationDictionary(lang,segments){
      var body = {lang:lang, segments: segments}
        return this.http.post(environment.api+'/api/Translation/document/translate', body)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

}
