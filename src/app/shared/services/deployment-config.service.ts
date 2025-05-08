import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface DeploymentTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface ApiConfig {
  baseUrl: string;
  features?: {
    anonymize?: boolean;
    diagnose?: boolean;
    summarize?: boolean;
    customReports?: boolean;
    [key: string]: boolean;
  };
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerDay: number;
  };
}

export interface DeploymentInfo {
  type: 'shared' | 'dedicated';
  region: string;
}

export interface DeploymentConfig {
  deploymentId: string;
  name: string;
  logo: string;
  favicon?: string;
  theme: DeploymentTheme;
  footer: string;
  api: ApiConfig;
  deployment?: DeploymentInfo;
}

@Injectable({
  providedIn: 'root'
})
export class DeploymentConfigService {
  private configUrl = 'assets/jsons/deployment-config.json';
  private configSubject = new BehaviorSubject<DeploymentConfig>(null);
  public config$ = this.configSubject.asObservable();
  
  constructor(private http: HttpClient) {
    this.loadConfig();
  }

  /**
   * Carga la configuración del despliegue desde el archivo JSON
   */
  private loadConfig(): void {
    this.http.get<DeploymentConfig>(this.configUrl)
      .pipe(
        tap(config => {
          this.configSubject.next(config);
          this.applyTheme(config);
        })
      )
      .subscribe();
  }

  /**
   * Aplica el tema del despliegue al documento HTML
   */
  private applyTheme(config: DeploymentConfig): void {
    if (!config || !config.theme) return;

    const root = document.documentElement;
    
    // Aplicar colores como variables CSS
    root.style.setProperty('--primary-color', config.theme.primaryColor);
    root.style.setProperty('--secondary-color', config.theme.secondaryColor);
    root.style.setProperty('--background-color', config.theme.backgroundColor);
    root.style.setProperty('--text-color', config.theme.textColor);
    
    // Cambiar favicon si está definido
    if (config.favicon) {
      const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (link) {
        link.href = config.favicon;
      }
    }
    
    // Cambiar título de la página
    document.title = config.name;
  }

  /**
   * Obtiene la configuración actual
   */
  public getConfig(): DeploymentConfig {
    return this.configSubject.value;
  }

  /**
   * Obtiene el ID del despliegue actual
   */
  public getDeploymentId(): string {
    const config = this.configSubject.value;
    return config ? config.deploymentId : 'default';
  }

  /**
   * Obtiene el nombre del despliegue actual
   */
  public getName(): string {
    const config = this.configSubject.value;
    return config ? config.name : 'DxGPT';
  }

  /**
   * Obtiene la ruta del logo
   */
  public getLogo(): string {
    const config = this.configSubject.value;
    return config ? config.logo : 'assets/img/logo.png';
  }

  /**
   * Obtiene el texto del pie de página
   */
  public getFooterText(): string {
    const config = this.configSubject.value;
    return config ? config.footer : '© 2023 DxGPT';
  }

  /**
   * Obtiene la URL base de la API
   */
  public getApiBaseUrl(): string {
    const config = this.configSubject.value;
    return config && config.api ? config.api.baseUrl : 'https://dxgpt.app';
  }

  /**
   * Verifica si una característica de API está habilitada
   */
  public isApiFeatureEnabled(featureName: string): boolean {
    const config = this.configSubject.value;
    if (!config || !config.api || !config.api.features) return false;
    return !!config.api.features[featureName];
  }

  /**
   * Obtiene el límite de solicitudes por minuto
   */
  public getRequestsPerMinuteLimit(): number {
    const config = this.configSubject.value;
    if (!config || !config.api || !config.api.rateLimit) return 60; // valor por defecto
    return config.api.rateLimit.requestsPerMinute;
  }

  /**
   * Obtiene el límite de tokens por día
   */
  public getTokensPerDayLimit(): number {
    const config = this.configSubject.value;
    if (!config || !config.api || !config.api.rateLimit) return 100000; // valor por defecto
    return config.api.rateLimit.tokensPerDay;
  }

  /**
   * Verifica si el despliegue es dedicado o compartido
   */
  public isDedicatedDeployment(): boolean {
    const config = this.configSubject.value;
    if (!config || !config.deployment) return false;
    return config.deployment.type === 'dedicated';
  }

  /**
   * Obtiene la región del despliegue
   */
  public getDeploymentRegion(): string {
    const config = this.configSubject.value;
    if (!config || !config.deployment) return 'westeurope'; // valor por defecto
    return config.deployment.region;
  }
} 