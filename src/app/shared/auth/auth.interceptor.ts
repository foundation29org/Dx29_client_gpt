import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from 'environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor() { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headers = req.headers
      .set('x-api-key', environment.Server_Key);

    const authReq = req.clone({ headers });

    return next.handle(authReq)
      .pipe(
        catchError((error) => {
          // Aquí puedes manejar el error como te convenga
          return throwError(error);
        })
      );
  }
}
