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

    // Solo dxgpt prod (environment.prod.ts) lleva clave: el enlace de su Static Web App con el APIM
    // inyecta una clave que ya no es válida. Las demás builds dejan que la ponga la Static Web App.
    const apiSubscriptionKey = (environment as { apiSubscriptionKey?: string }).apiSubscriptionKey;
    if (apiSubscriptionKey) {
      headers = headers.set('Ocp-Apim-Subscription-Key', apiSubscriptionKey);
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
