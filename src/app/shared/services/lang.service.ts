import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class LangService {

    langs: any = [];

    constructor(public translate : TranslateService, private http: HttpClient, public insightsService: InsightsService) {}


    getLangs(){
      //load the available languages
      return this.http.get(environment.api+'/api/langs')
        .pipe(
          map((res: any) => {
            this.langs = res;
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
