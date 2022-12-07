import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from 'environments/environment';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';
import { catchError, debounceTime, distinctUntilChanged, map, tap, switchMap, merge, mergeMap, concatMap } from 'rxjs/operators'

@Injectable()
export class ApiExternalServices {

    constructor(private http: HttpClient) {}

    getClinicalTrials(name){
        return this.http.get('https://clinicaltrials.gov/api/query/full_studies?expr='+name+'&fmt=json&max_rnk=50')
        //return this.http.get('https://clinicaltrials.gov/api/query/field_values?expr='+name+'&field=Condition&fmt=json')
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getFromWiki(text, lang){
        return this.http.get('https://'+lang+'.wikipedia.org/w/rest.php/v1/page/'+text)
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }

    getInfoLocation(){
        return this.http.get('https://ipinfo.io?token=77f94ec6489670')
        .map( (res : any) => {
            return res;
        }, (err) => {
            console.log(err);
            return err;
        })
    }
}
