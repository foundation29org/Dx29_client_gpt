import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { BrandingService, BrandingConfig } from 'app/shared/services/branding.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-medical-info-modal',
  templateUrl: './medical-info-modal.component.html',
  styleUrls: ['./medical-info-modal.component.scss']
})
export class MedicalInfoModalComponent implements OnInit, OnDestroy {
  @Input() content: string = '';
  @Input() title: string = 'Información Médica';
  @Input() disclaimerText: string = '';
  closeButtonText: string = 'Cerrar';
  
  private subscription: Subscription = new Subscription();
  brandingConfig: BrandingConfig | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private translate: TranslateService,
    private brandingService: BrandingService
  ) {
    // Inicializar con valor por defecto
    this.closeButtonText = 'Cerrar';
  }

  ngOnInit() {
    // Inicializar la traducción de forma segura
    this.initializeTranslation();
    
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