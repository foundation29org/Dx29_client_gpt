import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TenantDetectorService } from './tenant-detector.service';

export interface BrandingConfig {
  name: string;
  displayName: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    sidebar: string;
    backgroundDark: string;
    rating: string; // Added rating color
  };
  logos: {
    header: string;
    footer: string;
    f29Dark: string;
    favicon: string;
  };
  links: {
    donate: string | null;
    foundation: string;
    support: string;
  };
  backgrounds: {
    aboutUs: {
      gradient: string;
      overlay: string;
    };
  };
}

export interface BrandingConfigs {
  [key: string]: BrandingConfig;
}

@Injectable({
  providedIn: 'root'
})
export class BrandingService {
  private brandingConfigSubject = new BehaviorSubject<BrandingConfig | null>(null);
  public brandingConfig$ = this.brandingConfigSubject.asObservable();

  private currentTenant: string = 'dxgpt'; // Default tenant

  constructor(
    private http: HttpClient,
    private tenantDetector: TenantDetectorService
  ) {
    // Detectar tenant automáticamente
    this.currentTenant = this.tenantDetector.detectTenant();
    this.loadBrandingConfig();
  }

  /**
   * Establece el tenant actual y carga su configuración
   */
  setTenant(tenant: string): void {
    this.currentTenant = tenant;
    this.loadBrandingConfig();
  }

  /**
   * Obtiene el tenant actual
   */
  getCurrentTenant(): string {
    return this.currentTenant;
  }

  /**
   * Carga la configuración de branding desde el archivo JSON
   */
  private loadBrandingConfig(): void {
    this.http.get<BrandingConfigs>('assets/config/branding-config.json')
      .pipe(
        map(configs => configs[this.currentTenant] || configs['dxgpt']), // Fallback a dxgpt
        tap(config => {
          this.brandingConfigSubject.next(config);
          this.applyBrandingStyles(config);
        })
      )
      .subscribe();
  }

  /**
   * Genera un color más oscuro para hover basado en el color primario
   */
  private generateHoverColor(color: string): string {
    // Convertir hex a RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Oscurecer el color (reducir en 20%)
    const darkenFactor = 0.8;
    const newR = Math.round(r * darkenFactor);
    const newG = Math.round(g * darkenFactor);
    const newB = Math.round(b * darkenFactor);
    
    // Convertir de vuelta a hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Aplica los estilos de branding dinámicamente
   */
  private applyBrandingStyles(config: BrandingConfig): void {
    const root = document.documentElement;
    
    // Aplicar variables CSS personalizadas
    root.style.setProperty('--primary-color', config.colors.primary);
    root.style.setProperty('--secondary-color', config.colors.secondary);
    root.style.setProperty('--accent-color', config.colors.accent);
    if (config.colors.rating) {
      root.style.setProperty('--rating-color', config.colors.rating);
    }
    root.style.setProperty('--background-color', config.colors.background);
    root.style.setProperty('--text-color', config.colors.text);
    root.style.setProperty('--background-dark', config.colors.backgroundDark);

    // Generar y aplicar colores de hover
    const primaryHover = this.generateHoverColor(config.colors.primary);
    const secondaryHover = this.generateHoverColor(config.colors.secondary);
    const accentHover = this.generateHoverColor(config.colors.accent);
    
    root.style.setProperty('--primary-hover', primaryHover);
    root.style.setProperty('--secondary-hover', secondaryHover);
    root.style.setProperty('--accent-hover', accentHover);

    // Generar y aplicar colores de alert
    const alertBg = this.generateAlertBackground(config.colors.primary);
    const alertBorder = this.generateAlertBorder(config.colors.primary);
    
    root.style.setProperty('--bs-alert-info-color', config.colors.primary);
    root.style.setProperty('--bs-alert-info-bg', alertBg);
    root.style.setProperty('--bs-alert-info-border-color', alertBorder);

    // Actualizar favicon
    this.updateFavicon(config.logos.favicon);
  }

  /**
   * Genera un color de fondo para alerts basado en el color primario
   */
  private generateAlertBackground(color: string): string {
    // Convertir hex a RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Crear un color de fondo semi-transparente (10% opacidad)
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  }

  /**
   * Genera un color de borde para alerts basado en el color primario
   */
  private generateAlertBorder(color: string): string {
    // Convertir hex a RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Crear un color de borde semi-transparente (20% opacidad)
    return `rgba(${r}, ${g}, ${b}, 0.2)`;
  }

  /**
   * Actualiza el favicon dinámicamente
   */
  private updateFavicon(faviconPath: string): void {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link) {
      link.href = faviconPath;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = faviconPath;
      document.head.appendChild(newLink);
    }
  }

  /**
   * Obtiene la configuración actual de branding
   */
  getBrandingConfig(): BrandingConfig | null {
    return this.brandingConfigSubject.value;
  }

  /**
   * Obtiene un valor específico de la configuración
   */
  getConfigValue<T>(key: string): T | null {
    const config = this.brandingConfigSubject.value;
    if (!config) return null;
    
    return key.split('.').reduce((obj, k) => obj?.[k], config) as T;
  }

  /**
   * Obtiene el color primario
   */
  getPrimaryColor(): string {
    return this.getConfigValue<string>('colors.primary') || '#667eea';
  }

  /**
   * Obtiene el logo del header
   */
  getHeaderLogo(): string {
    return this.getConfigValue<string>('logos.header') || 'assets/img/logo-Dx29.webp';
  }

  /**
   * Obtiene el logo del footer
   */
  getFooterLogo(): string {
    return this.getConfigValue<string>('logos.footer') || 'assets/img/Foundation29logo.webp';
  }

  /**
   * Verifica si debe mostrar el enlace de donación
   */
  shouldShowDonateLink(): boolean {
    return this.getConfigValue<string>('links.donate') !== null;
  }

  /**
   * Obtiene el enlace de donación
   */
  getDonateLink(): string | null {
    return this.getConfigValue<string>('links.donate');
  }

  /**
   * Obtiene el enlace de la fundación
   */
  getFoundationLink(): string {
    return this.getConfigValue<string>('links.foundation') || 'https://foundation29.org';
  }

  /**
   * Obtiene el texto de soporte
   */
  getSupportText(): string {
    return this.getConfigValue<string>('links.support') || 'Support';
  }

  /**
   * Obtiene el nombre de la aplicación
   */
  getAppName(): string {
    return this.getConfigValue<string>('displayName') || 'DxGPT';
  }

  /**
   * Obtiene el gradiente de fondo para la página About Us
   */
  getAboutUsGradient(): string {
    return this.getConfigValue<string>('backgrounds.aboutUs.gradient') || 
           'linear-gradient(135deg, #041d44 0%, #12243a 25%, #2a3a4a 50%, #3c4e5c 75%, #3e4b57 100%)';
  }

  /**
   * Obtiene el overlay de fondo para la página About Us
   */
  getAboutUsOverlay(): string {
    return this.getConfigValue<string>('backgrounds.aboutUs.overlay') || 
           'linear-gradient(45deg, rgba(52, 152, 219, 0.1) 0%, transparent 50%, rgba(41, 128, 185, 0.08) 100%)';
  }
} 