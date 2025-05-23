import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { environment } from 'environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor() { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Verificar si estamos en modo Azure SWA auth (JWT)
    if (this.isAzureSWAAuthEnabled()) {
      return this.handleJWTAuth(req, next);
    } else {
      // Modo API key (SaaS)
      return this.handleAPIKeyAuth(req, next);
    }
  }

  private isAzureSWAAuthEnabled(): boolean {
    // Detectar si estamos en Azure SWA con autenticación habilitada
    // Esto se puede configurar via environment o detectar automáticamente
    return environment.useAzureAuth || window.location.hostname.includes('azurestaticapps.net');
  }

  private handleJWTAuth(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener JWT token de Azure SWA
    return from(this.getAzureAuthToken()).pipe(
      switchMap(token => {
        let authReq = req;
        
        if (token) {
          // Añadir JWT token
          authReq = req.clone({
            setHeaders: {
              'X-MS-AUTH-TOKEN': token
            }
          });
        }
        
        return next.handle(authReq).pipe(
          catchError((error) => {
            this.handleError(error, 'JWT');
            return throwError(error);
          })
        );
      })
    );
  }

  private handleAPIKeyAuth(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Añadir API key (tu código actual)
    const headers = req.headers
      .set('Ocp-Apim-Subscription-Key', environment.apiSubscriptionKey);

    const authReq = req.clone({ headers });

    return next.handle(authReq).pipe(
      catchError((error) => {
        this.handleError(error, 'API Key');
        return throwError(error);
      })
    );
  }

  private async getAzureAuthToken(): Promise<string | null> {
    try {
      const response = await fetch('/.auth/me');
      const payload = await response.json();
      
      if (payload.clientPrincipal) {
        // En Azure SWA, el token JWT se pasa automáticamente en las cookies
        // y Azure lo maneja internamente. Para APIM necesitamos obtenerlo
        // de la respuesta o cookies
        return this.extractTokenFromResponse(response) || 
               this.extractTokenFromCookies() ||
               'authenticated'; // Fallback si estamos autenticados
      }
      
      return null;
    } catch (error) {
      console.log('No Azure auth available:', error);
      return null;
    }
  }

  private extractTokenFromResponse(response: Response): string | null {
    // Intentar obtener token de headers
    return response.headers.get('X-MS-AUTH-TOKEN') || 
           response.headers.get('x-ms-auth-token');
  }

  private extractTokenFromCookies(): string | null {
    // Azure SWA almacena el token en cookies específicas
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('StaticWebAppsAuthToken='));
    
    return authCookie ? authCookie.split('=')[1] : null;
  }

  private handleError(error: any, authMode: string): void {
    console.error(`Error with ${authMode} authentication:`, error);
    
    if (error.status === 401) {
      if (authMode === 'JWT') {
        // Redirigir a login de Azure
        window.location.href = '/.auth/login/aad';
      } else {
        // Error de API key - mostrar mensaje apropiado
        console.error('Invalid API subscription key');
      }
    }
  }
} 