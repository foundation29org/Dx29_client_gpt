import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ApiDx29ServerService } from 'app/shared/services/api-dx29-server.service';
import { BrandingService, BrandingConfig } from 'app/shared/services/branding.service';
import { AnalyticsService } from 'app/shared/services/analytics.service';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-permalink-view-page',
  templateUrl: './permalink-view-page.component.html',
  styleUrls: ['./permalink-view-page.component.scss']
})
export class PermalinkViewPageComponent implements OnInit, OnDestroy {

  private subscription: Subscription = new Subscription();

  // Datos del permalink
  permalinkId: string = '';
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';

  // Datos médicos
  medicalDescription: string = '';
  anonymizedDescription: string = '';
  diagnoses: any[] = [];
  lang: string = 'es';
  createdDate: string = '';

  // UI
  currentYear: number = new Date().getFullYear();
  generatingPDF: boolean = false;

  // Branding
  brandingConfig: BrandingConfig | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private apiDx29ServerService: ApiDx29ServerService,
    private brandingService: BrandingService,
    private analyticsService: AnalyticsService,
    private clipboard: Clipboard
  ) { }

  ngOnInit() {
    // Track page view para permalink
    this.analyticsService.trackPageView('Permalink View', {
      permalinkId: this.route.snapshot.paramMap.get('id') || '',
      url: this.router.url
    });

    // Suscribirse a los cambios de configuración de branding
    this.subscription.add(
      this.brandingService.brandingConfig$.subscribe(config => {
        this.brandingConfig = config;
        this.applyBrandingStyles();
      })
    );

    // Obtener el ID del permalink de la URL
    this.permalinkId = this.route.snapshot.paramMap.get('id') || '';

    if (this.permalinkId) {
      this.loadPermalink();
    } else {
      this.showError(this.translate.instant('permalink.Invalid permalink'));
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadPermalink() {
    this.isLoading = true;
    this.hasError = false;

    // Llamar al backend para obtener los datos del permalink
    this.subscription.add(
      this.apiDx29ServerService.getPermalink(this.permalinkId).subscribe(
        (res: any) => {
          const permalinkData = res.data; // Acceder a la propiedad 'data'
          this.medicalDescription = permalinkData.medicalDescription || '';
          this.anonymizedDescription = permalinkData.anonymizedDescription || '';
          this.diagnoses = permalinkData.diagnoses || [];
          this.lang = permalinkData.lang || 'es';
          this.createdDate = permalinkData.createdDate || '';
          this.isLoading = false;
        },
        (error) => {
          console.error('Error loading permalink from backend:', error);
          this.showError(this.translate.instant('permalink.Invalid permalink'));
        }
      )
    );
  }

  private showError(message: string) {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
    Swal.fire({
      icon: 'error',
      title: this.translate.instant('permalink.oops'),
      text: message
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      // Usar el idioma de la página si está disponible
      return date.toLocaleDateString(this.lang || 'es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  goHome() {
    window.open('/', '_blank');
  }

  async sharePermalink() {
    const url = window.location.href;
    
    // Intentar usar la API nativa de compartir si está disponible
    if (navigator.share) {
      try {
        await navigator.share({
          title: this.translate.instant('permalink.shareTitle'),
          text: this.translate.instant('permalink.shareText'),
          url: url
        });
        return; // Si se compartió exitosamente, salir
      } catch (shareError: any) {
        // Si el usuario cancela el share, no mostrar error
        if (shareError.name === 'AbortError') {
          return;
        }
        // Si hay otro error, continuar con el modal
      }
    }
    
    // Si no hay navigator.share o falló, mostrar modal con el enlace
    this.showShareModal(url);
  }

  private showShareModal(permalinkUrl: string) {
    Swal.fire({
      title: this.translate.instant('permalink.Share results'),
      html: `
        <div style="text-align: left;">
          <p><strong>${this.translate.instant('permalink.Link created')}</strong></p>
          <div class="input-group mb-3">
            <input type="text" id="permalinkInput" class="form-control" value="${permalinkUrl}" readonly style="font-size: 0.9rem;">
            <button class="btn btn-outline-secondary" type="button" id="copyPermalinkBtn">
              <i class="fa fa-copy"></i>
            </button>
          </div>
          <p class="text-muted" style="font-size: 0.85rem;">${this.translate.instant('permalink.Copy and share')}</p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: this.translate.instant('generics.Close'),
      showCancelButton: false,
      allowOutsideClick: true,
      didOpen: () => {
        const copyBtn = document.getElementById('copyPermalinkBtn');
        const input = document.getElementById('permalinkInput') as HTMLInputElement;
        
        if (copyBtn && input) {
          copyBtn.addEventListener('click', async () => {
            try {
              input.select();
              await this.clipboard.copy(permalinkUrl);
              
              // Feedback visual
              const originalHtml = copyBtn.innerHTML;
              copyBtn.innerHTML = '<i class="fa fa-check"></i>';
              copyBtn.classList.add('btn-success');
              copyBtn.classList.remove('btn-outline-secondary');
              
              // Mostrar mensaje de éxito
              const successMsg = this.translate.instant('land.Results copied to the clipboard');
              Swal.fire({
                icon: 'success',
                title: successMsg,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
              });
              
              setTimeout(() => {
                copyBtn.innerHTML = originalHtml;
                copyBtn.classList.remove('btn-success');
                copyBtn.classList.add('btn-outline-secondary');
              }, 2000);
            } catch (error) {
              console.error('Error copying to clipboard:', error);
            }
          });
          
          // Seleccionar el texto al hacer click en el input
          input.addEventListener('click', () => {
            input.select();
          });
        }
      }
    });
  }

  /**
   * Descarga los resultados como PDF
   */
  async downloadResults() {
    if (this.generatingPDF) {
      return;
    }

    try {
      this.generatingPDF = true;
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const vfsFontsModule = await import('pdfmake/build/vfs_fonts');

      // Extraer los módulos correctamente
      const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;
      const vfsFonts = (vfsFontsModule as any).default || vfsFontsModule;

      // Asignar VFS correctamente
      pdfMake.vfs = vfsFonts.vfs;

      const { PdfMakeService } = await import('app/shared/services/pdf-make.service');
      const pdfService = new PdfMakeService(this.translate);

      await pdfService.generateResultsPDF(
        this.medicalDescription,
        this.diagnoses,
        this.lang,
        pdfMake,
        this.isEuMode()
      );

      this.generatingPDF = false;
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.generatingPDF = false;
      Swal.fire({
        icon: 'error',
        title: this.translate.instant('generics.Error'),
        text: this.translate.instant('generics.Something went wrong')
      });
    }
  }

  /**
   * Aplica los estilos de branding dinámicamente al componente
   */
  private applyBrandingStyles(): void {
    if (!this.brandingConfig) return;

    const root = document.documentElement;

    // Aplicar variables CSS específicas para el permalink
    root.style.setProperty('--permalink-primary', this.brandingConfig.colors.primary);
    root.style.setProperty('--permalink-secondary', this.brandingConfig.colors.secondary);
    root.style.setProperty('--permalink-accent', this.brandingConfig.colors.accent);
    root.style.setProperty('--permalink-rating', this.brandingConfig.colors.rating);
    root.style.setProperty('--permalink-background', this.brandingConfig.colors.background);
    root.style.setProperty('--permalink-text', this.brandingConfig.colors.contrastText);
    root.style.setProperty('--permalink-background-dark', this.brandingConfig.colors.backgroundDark);

    // Generar gradientes dinámicos
    const gradientStart = this.brandingConfig.colors.primary;
    const gradientEnd = this.brandingConfig.colors.secondary;
    root.style.setProperty('--permalink-gradient', `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`);

    // Generar colores de hover
    const primaryHover = this.generateHoverColor(this.brandingConfig.colors.primary);
    root.style.setProperty('--permalink-primary-hover', primaryHover);
  }

  /**
   * Verifica si está en modo europeo (EU)
   */
  isEuMode(): boolean {
    return this.brandingService.isEuMode();
  }

  /**
   * Genera un color más oscuro para hover
   */
  private generateHoverColor(color: string): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const darkenFactor = 0.8;
    const newR = Math.round(r * darkenFactor);
    const newG = Math.round(g * darkenFactor);
    const newB = Math.round(b * darkenFactor);

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
} 