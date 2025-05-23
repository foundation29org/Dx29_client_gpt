import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<ClientPrincipal | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserInfo();
  }

  private async loadUserInfo() {
    try {
      const response = await fetch('/.auth/me');
      const payload = await response.json();
      const { clientPrincipal } = payload;
      this.currentUserSubject.next(clientPrincipal);
    } catch (error) {
      console.log('Usuario no autenticado');
      this.currentUserSubject.next(null);
    }
  }

  login(provider: string = 'aad') {
    window.location.href = `/.auth/login/${provider}`;
  }

  logout() {
    window.location.href = '/.auth/logout';
  }

  async getAuthToken(): Promise<string | null> {
    try {
      const response = await fetch('/.auth/me');
      const payload = await response.json();
      
      // El token se obtiene desde las cookies o headers de la respuesta
      // Azure SWA maneja esto automáticamente
      const authHeader = response.headers.get('X-MS-AUTH-TOKEN');
      return authHeader;
    } catch (error) {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): ClientPrincipal | null {
    return this.currentUserSubject.value;
  }
} 