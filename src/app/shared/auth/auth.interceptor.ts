import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { environment } from 'environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor() { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let headers = req.headers.set('X-Tenant-Id', environment.tenantId);
    
    // Solo agregar el header de APIM si hay una subscription key configurada
    // (para self-hosted puede estar vacío si no usan APIM)
    if (environment.apiSubscriptionKey) {
      headers = headers.set('Ocp-Apim-Subscription-Key', environment.apiSubscriptionKey);
    }

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
