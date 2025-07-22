import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

export interface IframeParams {
  medicalText?: string;
  centro?: string; // Centro hospitalario/sanitario
  ambito?: string; // Ámbito sanitario
  especialidad?: string; // Especialidad médica
  [key: string]: string | undefined; // Para otros parámetros dinámicos
}

@Injectable({
  providedIn: 'root'
})
export class IframeParamsService {
  private paramsSubject = new BehaviorSubject<IframeParams>({});
  public params$ = this.paramsSubject.asObservable();

  private isInIframe: boolean = false;
  private currentParams: IframeParams = {};

  constructor() {
    this.detectIframe();
    this.initializeParamCapture();
  }

  /**
   * Detecta si la aplicación está corriendo dentro de un iframe
   */
  private detectIframe(): void {
    try {
      this.isInIframe = window.self !== window.top;
    } catch (e) {
      // Si hay un error accediendo a window.top, probablemente estamos en un iframe
      this.isInIframe = true;
    }
  }

  /**
   * Inicializa la captura de parámetros
   */
  private initializeParamCapture(): void {
    // Capturar parámetros de la URL actual
    this.captureUrlParams();

    // Si estamos en iframe, también escuchar mensajes del padre
    if (this.isInIframe) {
      this.setupPostMessageListener();
    }
  }

  /**
   * Captura parámetros de la URL
   */
  private captureUrlParams(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const fragmentParams = new URLSearchParams(window.location.hash.substring(1));
    
    const params: IframeParams = {};
    
    // Parámetros de query string
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Parámetros del fragmento (después del #)
    fragmentParams.forEach((value, key) => {
      params[key] = value;
    });
    
    if (Object.keys(params).length > 0) {
      this.updateParams(params);
    }
  }

  /**
   * Configura el listener para mensajes del iframe padre
   */
  private setupPostMessageListener(): void {
    window.addEventListener('message', (event) => {
      // Validar origen si es necesario (por seguridad)
      // En producción deberías validar el origen
      
      if (event.data && typeof event.data === 'object') {
        // Si el mensaje contiene parámetros
        if (event.data.type === 'dxgpt-params' && event.data.params) {
          this.updateParams(event.data.params);
        }
        
        // También aceptar mensajes directos con parámetros conocidos
        if (this.hasKnownParams(event.data)) {
          this.updateParams(event.data);
        }
      }
    });

    // Enviar mensaje al padre indicando que estamos listos para recibir parámetros
    this.notifyParentReady();
  }

  /**
   * Verifica si el objeto contiene parámetros conocidos
   */
  private hasKnownParams(data: any): boolean {
    const knownParams = ['medicalText', 'centro', 'ambito', 'especialidad'];
    return knownParams.some(param => data.hasOwnProperty(param));
  }

  /**
   * Notifica al iframe padre que estamos listos
   */
  private notifyParentReady(): void {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'dxgpt-ready',
          message: 'DxGPT is ready to receive parameters'
        }, '*');
      }
    } catch (e) {
      console.log('No se pudo comunicar con el iframe padre:', e);
    }
  }

  /**
   * Actualiza los parámetros y notifica a los suscriptores
   */
  private updateParams(newParams: IframeParams): void {
    this.currentParams = { ...this.currentParams, ...newParams };
    this.paramsSubject.next(this.currentParams);
    
    console.log('Parámetros actualizados:', this.currentParams);
  }

  /**
   * Obtiene los parámetros actuales
   */
  getCurrentParams(): IframeParams {
    return { ...this.currentParams };
  }

  /**
   * Obtiene un parámetro específico
   */
  getParam(key: string): string | undefined {
    return this.currentParams[key];
  }

  /**
   * Verifica si la aplicación está en un iframe
   */
  getIsInIframe(): boolean {
    return this.isInIframe;
  }

  /**
   * Establece parámetros manualmente (útil para testing o casos especiales)
   */
  setParams(params: IframeParams): void {
    this.updateParams(params);
  }

  /**
   * Limpia todos los parámetros
   */
  clearParams(): void {
    this.currentParams = {};
    this.paramsSubject.next(this.currentParams);
  }

  /**
   * Método para obtener parámetros sanitarios (ámbito y especialidad)
   */
  getMedicalParams(): { ambito?: string; especialidad?: string } {
    return {
      ambito: this.currentParams.ambito,
      especialidad: this.currentParams.especialidad
    };
  }

  /**
   * Método para obtener parámetros de centro y texto médico
   */
  getCenterParams(): { centro?: string; medicalText?: string } {
    return {
      centro: this.currentParams.centro,
      medicalText: this.currentParams.medicalText
    };
  }

  /**
   * Método para obtener todos los parámetros sanitarios completos
   */
  getAllMedicalParams(): { centro?: string; ambito?: string; especialidad?: string; medicalText?: string } {
    return {
      centro: this.currentParams.centro,
      ambito: this.currentParams.ambito,
      especialidad: this.currentParams.especialidad,
      medicalText: this.currentParams.medicalText
    };
  }
} 