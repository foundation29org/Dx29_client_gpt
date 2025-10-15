import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { BrandingService, BrandingConfig } from 'app/shared/services/branding.service';
import { Subscription } from 'rxjs';
import { marked } from 'marked';

@Component({
  selector: 'app-medical-info-modal',
  templateUrl: './medical-info-modal.component.html',
  styleUrls: ['./medical-info-modal.component.scss']
})
export class MedicalInfoModalComponent implements OnInit, OnDestroy {
  @Input() content: string = '';
  @Input() title: string = 'Información Médica';
  @Input() sonarData: string = '';
  closeButtonText: string = 'Cerrar';
  
  private subscription: Subscription = new Subscription();
  brandingConfig: BrandingConfig | null = null;
  
  // Contenido HTML procesado desde Markdown
  htmlContent: string = '';
  
  // Datos de Sonar para referencias
  sonarDataParsed: any = null;

  constructor(
    public activeModal: NgbActiveModal,
    private translate: TranslateService,
    private brandingService: BrandingService
  ) {
    // Inicializar con valor por defecto
    this.closeButtonText = 'Cerrar';
  }

  async ngOnInit() {
    // Inicializar la traducción de forma segura
    this.initializeTranslation();
    
    // Procesar datos de Sonar para referencias PRIMERO
    this.processSonarData();
    
    // Procesar el contenido Markdown a HTML DESPUÉS
    await this.processMarkdownContent();
    
    // Cargar configuración de branding
    this.loadBrandingConfig();
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    this.subscription.unsubscribe();
  }

  /**
   * Inicializa la traducción de forma segura
   */
  private initializeTranslation(): void {
    try {
      // Verificar si el servicio de traducción está disponible
      if (this.translate && this.translate.instant) {
        this.closeButtonText = this.translate.instant('generics.Close');
      }
    } catch (error) {
      console.error('Error initializing translation in medical info modal:', error);
      // Mantener el valor por defecto en caso de error
      this.closeButtonText = 'Cerrar';
    }
  }

  /**
   * Procesa el contenido Markdown y lo convierte a HTML
   */
  private async processMarkdownContent(): Promise<void> {
    try {
      if (this.content) {
        // Configurar opciones de marked para mejor renderizado
        marked.setOptions({
          breaks: true, // Convertir saltos de línea a <br>
          gfm: true   // GitHub Flavored Markdown
        });

        // Convertir Markdown a HTML
        let parsedContent = await marked.parse(this.content);
        
        // Procesar referencias en el texto para convertirlas en enlaces
        parsedContent = this.processReferenceLinks(parsedContent);
        
        this.htmlContent = parsedContent;
      } else {
        this.htmlContent = '';
      }
    } catch (error) {
      console.error('Error processing markdown content:', error);
      // En caso de error, mostrar el contenido original
      this.htmlContent = this.content;
    }
  }

  /**
   * Procesa las referencias en el texto para convertirlas en enlaces clicables
   */
  private processReferenceLinks(htmlContent: string): string {
    if (!this.sonarDataParsed || !this.sonarDataParsed.searchResults) {
      return htmlContent;
    }

    // Buscar patrones como [1], [2], [1][2], [1][2][3], etc.
    const referencePattern = /\[(\d+)\]/g;
    
    return htmlContent.replace(referencePattern, (match, number) => {
      const refNumber = parseInt(number);
      const reference = this.sonarDataParsed.searchResults[refNumber - 1];
      
      if (reference && reference.url) {
        return `<a href="${reference.url}" target="_blank" class="reference-link" data-ref="${refNumber}" title="${reference.title}">[${number}]</a>`;
      }
      
      // Si no se encuentra la referencia, mantener el número original
      return match;
    });
  }

  /**
   * Procesa los datos de Sonar para mostrar referencias
   */
  private processSonarData(): void {
    try {
      if (this.sonarData) {
        // Parsear JSON si viene como string
        if (typeof this.sonarData === 'string') {
          this.sonarDataParsed = JSON.parse(this.sonarData);
        } else {
          this.sonarDataParsed = this.sonarData;
        }
        
        // Limpiar cache de referencias cuando cambien los datos
        this._formattedReferences = [];
      } else {
        this.sonarDataParsed = null;
        this._formattedReferences = [];
      }
    } catch (error) {
      console.error('Error processing sonar data:', error);
      this.sonarDataParsed = null;
      this._formattedReferences = [];
    }
  }

  // Cache para las referencias formateadas
  private _formattedReferences: any[] = [];

  /**
   * Obtiene las referencias formateadas para mostrar
   */
  getFormattedReferences(): any[] {
    if (!this.sonarDataParsed || !this.sonarDataParsed.searchResults) {
      return [];
    }

    // Si ya tenemos las referencias cacheadas, las devolvemos
    if (this._formattedReferences.length > 0) {
      return this._formattedReferences;
    }

    // Procesar y cachear las referencias
    this._formattedReferences = this.sonarDataParsed.searchResults.map((result: any, index: number) => ({
      number: index + 1,
      title: result.title,
      url: result.url,
      date: result.date,
      snippet: result.snippet,
      source: result.source
    }));

    return this._formattedReferences;
  }

  /**
   * Verifica si hay referencias disponibles
   */
  hasReferences(): boolean {
    return this.sonarDataParsed && 
           this.sonarDataParsed.searchResults && 
           this.sonarDataParsed.searchResults.length > 0;
  }

  /**
   * TrackBy function para optimizar el rendimiento de las referencias
   */
  trackByReference(index: number, item: any): any {
    return item.number || index;
  }

  /**
   * Maneja el clic en el contenido del modal
   */
  onContentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Verificar si se hizo clic en un enlace de referencia
    if (target.classList.contains('reference-link')) {
      // NO prevenir el comportamiento por defecto para permitir que el enlace se abra
      // Solo hacer scroll a la referencia si es necesario
      const refNumber = parseInt(target.getAttribute('data-ref') || '0');
      
      // Hacer scroll a la referencia después de un pequeño delay para permitir que el enlace se abra
      setTimeout(() => {
        this.onReferenceClick(refNumber);
      }, 100);
    }
  }

  /**
   * Maneja el clic en un enlace de referencia
   */
  onReferenceClick(refNumber: number): void {
    // Scroll a la referencia correspondiente en la lista
    const referenceElement = document.querySelector(`.reference-item:nth-child(${refNumber})`);
    if (referenceElement) {
      referenceElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Resaltar temporalmente la referencia
      referenceElement.classList.add('highlighted');
      setTimeout(() => {
        referenceElement.classList.remove('highlighted');
      }, 2000);
    }
  }

  /**
   * Carga la configuración de branding
   */
  private loadBrandingConfig(): void {
    try {
      this.subscription.add(
        this.brandingService.brandingConfig$.subscribe({
          next: (config) => {
            if (config) {
              this.brandingConfig = config;
              this.applyBrandingStyles();
            }
          },
          error: (error) => {
            console.error('Error loading branding config in medical modal:', error);
          }
        })
      );
    } catch (error) {
      console.error('Error initializing branding config in medical modal:', error);
    }
  }

  /**
   * Aplica los estilos de branding dinámicamente
   */
  private applyBrandingStyles(): void {
    if (!this.brandingConfig) return;

    // Usar setTimeout para asegurar que el modal esté renderizado
    setTimeout(() => {
      const modalElement = document.querySelector('.modal-content') as HTMLElement;
      if (modalElement) {
        // Aplicar gradiente del header usando los colores del branding
        const headerElement = modalElement.querySelector('.modal-header') as HTMLElement;
        if (headerElement) {
          headerElement.style.background = `linear-gradient(135deg, ${this.brandingConfig.colors.primary} 0%, ${this.brandingConfig.colors.secondary} 100%)`;
        }

        // Aplicar color de texto del contenido
        const contentElement = modalElement.querySelector('.medical-content') as HTMLElement;
        if (contentElement) {
          contentElement.style.color = this.brandingConfig.colors.text;
        }

        // Aplicar colores de elementos destacados
        const strongElements = modalElement.querySelectorAll('.medical-content strong');
        strongElements.forEach((element: Element) => {
          (element as HTMLElement).style.color = this.brandingConfig.colors.accent;
        });

        const emElements = modalElement.querySelectorAll('.medical-content em');
        emElements.forEach((element: Element) => {
          (element as HTMLElement).style.color = this.brandingConfig.colors.secondary;
        });

        // Aplicar color a los títulos
        const titleElements = modalElement.querySelectorAll('.medical-content h1, .medical-content h2, .medical-content h3');
        titleElements.forEach((element: Element) => {
          (element as HTMLElement).style.color = this.brandingConfig.colors.primary;
        });
      }
    }, 100);
  }
} 