import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { SortService} from 'app/shared/services/sort.service';

@Injectable()
export class LangService {

    langs: any = [];

    constructor(public translate : TranslateService, private http: HttpClient, private sortService: SortService) {}


    getLangs(){
      //load the available languages
      return this.http.get(environment.serverapi+'/api/langs')
        .map( (res : any) => {
            this.langs = res;
            res.sort(this.sortService.GetSortOrder("name"));
            return res;
         }, (err) => {
           console.log(err);
           return {};
         })
    }
}
