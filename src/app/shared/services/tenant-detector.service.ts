import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TenantDetectorService {

  constructor() { }

  /**
   * Detecta el tenant basado en la configuración del entorno
   */
  detectTenant(): string {
    // 1. Usar configuración del entorno (método principal)
    const envTenant = this.detectTenantFromEnvironment();
    if (envTenant) {
      return envTenant;
    }

    // 2. Intentar detectar por subdominio (fallback)
    const subdomainTenant = this.detectTenantFromSubdomain();
    if (subdomainTenant) {
      return subdomainTenant;
    }

    // 3. Fallback por defecto
    return 'dxgpt';
  }

  /**
   * Detecta el tenant desde la configuración del entorno
   */
  private detectTenantFromEnvironment(): string | null {
    // Usar el tenantId del environment como método principal
    if (environment.tenantId) {
      if (environment.tenantId.includes('salud-gpt')) {
        return 'salud-gpt';
      }
      if (environment.tenantId.includes('dxgpt')) {
        return 'dxgpt';
      }
      if (environment.tenantId.includes('dxeugpt')) {
        return 'dxeugpt';
      }
      if (environment.tenantId.includes('sermas-gpt')) {
        return 'sermas-gpt';
      }
      if (environment.tenantId.includes('iasalut-ajuda-dx')) {
        return 'iasalut-ajuda-dx';
      }
    }
    
    return null;
  }

  /**
   * Detecta el tenant desde el subdominio (fallback)
   */
  private detectTenantFromSubdomain(): string | null {
    const hostname = window.location.hostname;
    
    // Solo usar subdominio en producción, no en localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return null;
    }
    
    const subdomain = hostname.split('.')[0];
    
    if (subdomain === 'salud-gpt') {
      return 'salud-gpt';
    }
    
    if (subdomain === 'dxgpt' || hostname.includes('dxgpt')) {
      return 'dxgpt';
    }

    if (subdomain === 'sermas-gpt' || hostname.includes('sermas-gpt')) {
      return 'sermas-gpt';
    }
    if (subdomain === 'dxeugpt' || hostname.includes('dxeugpt')) {
      return 'dxeugpt';
    }
    if (subdomain === 'iasalut-ajuda-dx' || hostname.includes('iasalut-ajuda-dx')) {
      return 'iasalut-ajuda-dx';
    }
    return null;
  }

  /**
   * Obtiene el nombre de la aplicación para el tenant actual
   */
  getAppName(tenant: string): string {
    switch (tenant) {
      case 'salud-gpt':
        return 'SALUD-GPT';
      case 'dxeugpt':
        return 'DxGPT';
      case 'sermas-gpt':
        return 'SermasGPT';
      case 'iasalut-ajuda-dx':
        return 'IASalutAjudaDx';
      case 'dxgpt':
      default:
        return 'DxGPT';
    }
  }

  /**
   * Obtiene la descripción de la aplicación para el tenant actual
   */
  getAppDescription(tenant: string): string {
    switch (tenant) {
      case 'salud-gpt':
        return 'Servicio de IA para Aragón de Salud';
      case 'sermas-gpt':
        return 'Servicio de IA para Madrid de Salud';
      case 'iasalut-ajuda-dx':
        return 'Servicio de IA para CatSalut';
      case 'dxgpt':
        return 'AI-powered diagnostic assistance';
      case 'dxeugpt':
        return 'AI-powered diagnostic assistance';
      default:
        return 'AI-powered diagnostic assistance';
    }
  }

  /**
   * Verifica si el tenant actual es SALUD-GPT
   */
  isSaludGpt(tenant: string): boolean {
    return tenant === 'salud-gpt';
  }

  /**
   * Verifica si el tenant actual es DxGPT
   */
  isDxgpt(tenant: string): boolean {
    return tenant === 'dxgpt';
  }

  /**
   * Verifica si el tenant actual es SermasGPT
   */
  isSermasGpt(tenant: string): boolean {
    return tenant === 'sermas-gpt';
  }
  /**
   * Verifica si el tenant actual es DxGPT EU
   */
  isDxgptEu(tenant: string): boolean {
    return tenant === 'dxeugpt';
  }
  /**
   * Verifica si el tenant actual es IASalutAjudaDx
   */
  isIasalutAjudaDx(tenant: string): boolean {
    return tenant === 'iasalut-ajuda-dx';
  }

  /**
   * Obtiene el tenant actual desde el environment
   */
  getCurrentTenantFromEnvironment(): string {
    return this.detectTenantFromEnvironment() || 'dxgpt';
  }
} 