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
}
