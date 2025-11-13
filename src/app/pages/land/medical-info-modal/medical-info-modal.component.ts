import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { BrandingService, BrandingConfig } from 'app/shared/services/branding.service';
import { Subscription } from 'rxjs';
import { marked } from 'marked';
import { MedicalAnswerFeedbackComponent } from '../medical-answer-feedback/medical-answer-feedback.component';
import { InsightsService } from 'app/shared/services/azureInsights.service';

@Component({
  selector: 'app-medical-info-modal',
  templateUrl: './medical-info-modal.component.html',
  styleUrls: ['./medical-info-modal.component.scss']
})
export class MedicalInfoModalComponent implements OnInit, OnDestroy {
  @Input() content: string = '';
  @Input() title: string = 'Información Médica';
  @Input() sonarData: string = '';
  @Input() model: string = '';
  @Input() selectedFiles: any[] = [];
  @Input() detectedLang: string = '';
  closeButtonText: string = 'Cerrar';
  
  private subscription: Subscription = new Subscription();
  brandingConfig: BrandingConfig | null = null;
  
  // Contenido HTML procesado desde Markdown
  htmlContent: string = '';
  
  // Datos de Sonar para referencias
  sonarDataParsed: any = null;
  
  // Mapeo de citas originales -> nuevas [1..n]
  private citationOldToNew: Map<number, number> = new Map();

  constructor(
    public activeModal: NgbActiveModal,
    private translate: TranslateService,
    private brandingService: BrandingService,
    private modalService: NgbModal,
    private insightsService: InsightsService
  ) {
    // Inicializar con valor por defecto
    this.closeButtonText = 'Cerrar';
  }

  openMedicalFeedback(vote: 'up' | 'down') {
    // Track click on thumbs
    try {
      this.insightsService.trackEvent('medical_answer_thumb_click', {
        vote,
        model: this.model || 'unknown',
        detectedLang: this.detectedLang || 'unknown',
        hasSelectedFiles: Array.isArray(this.selectedFiles) && this.selectedFiles.length > 0,
        fileCount: Array.isArray(this.selectedFiles) ? this.selectedFiles.length : 0
      });
    } catch {}

    const modalRef = this.modalService.open(MedicalAnswerFeedbackComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.question = this.title;
    modalRef.componentInstance.initialVote = vote;
    modalRef.componentInstance.model = this.model;
    modalRef.componentInstance.detectedLang = this.detectedLang;
    const fileNames = (this.selectedFiles && this.selectedFiles.length > 0)
      ? this.selectedFiles.map((f: any) => f?.name).filter(Boolean).join(', ')
      : '';
    modalRef.componentInstance.fileNames = fileNames;
    modalRef.componentInstance.answerHtml = this.htmlContent;
    try {
      modalRef.componentInstance.references = this.getFormattedReferences();
    } catch { modalRef.componentInstance.references = []; }
  }

  
  /**
   * Extrae citas únicas en orden de aparición.
   */
  private extractUniqueCitationNumbers(markdown: string): number[] {
    const re = /\[(\d+)\]/g;
    const seen: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(markdown))) {
      const n = Number(m[1]);
      if (!seen.includes(n)) seen.push(n);
    }
    return seen;
  }

  /**
   * Dado el markdown, renumera las citas a [1..n], construye referencias y guarda mapping.
   */
  private renumberInlineCitationsAndBuildReferences(markdown: string): string {
    const usedOriginal = this.extractUniqueCitationNumbers(markdown);

    // Reset mapeos y referencias
    this.citationOldToNew = new Map<number, number>();
    this._formattedReferences = [];

    // Construir mapeo old->new en orden
    usedOriginal.forEach((oldNum, idx) => this.citationOldToNew.set(oldNum, idx + 1));

    // Construir referencias solo para las usadas
    const refs = this.buildReferencesFromSonar(usedOriginal);
    this._formattedReferences = refs.map((r, i) => ({
      number: i + 1,
      title: r.title,
      url: r.url,
      date: r.date,
      snippet: r.snippet,
      source: r.source
    }));

    // Reemplazar en el texto los números antiguos por los nuevos; eliminar huérfanas
    const renumbered = markdown.replace(/\[(\d+)\]/g, (_m, g1) => {
      const oldNum = Number(g1);
      const newNum = this.citationOldToNew.get(oldNum);
      return newNum ? `[${newNum}]` : '';
    });

    return renumbered;
  }

  /**
   * Selecciona fuentes a partir de sonarData según los índices originales usados.
   * Intenta mapear [k] -> searchResults[k-1]; si no está, intenta por URL en citations.
   */
  private buildReferencesFromSonar(usedOriginal: number[]): any[] {
    const results = Array.isArray(this.sonarDataParsed?.searchResults) ? this.sonarDataParsed.searchResults : [];
    const citations = Array.isArray(this.sonarDataParsed?.citations) ? this.sonarDataParsed.citations : [];

    const pickByIndex = (k: number) => {
      const sr = results[k - 1];
      if (sr && sr.url) return sr;
      const url = citations[k - 1];
      if (!url) return null;
      const found = results.find((r: any) => r?.url === url);
      return found || { title: 'Source', url };
    };

    const picked: any[] = [];
    usedOriginal.forEach(k => {
      const ref = pickByIndex(k);
      if (ref && ref.url && !picked.find(p => p.url === ref.url)) picked.push(ref);
    });
    return picked;
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
        let normalized = this.renumberInlineCitationsAndBuildReferences(this.content);

        // Configurar opciones de marked para mejor renderizado
        marked.setOptions({
          breaks: true, // Convertir saltos de línea a <br>
          gfm: true   // GitHub Flavored Markdown
        });

        // Convertir Markdown a HTML
        let parsedContent = await marked.parse(normalized);
        
        // Procesar referencias en el texto para convertirlas en enlaces
        parsedContent = this.processReferenceLinks(parsedContent);
        
        // Convertir URLs sueltas en enlaces clicables
        parsedContent = this.processUrlLinks(parsedContent);
        console.log(parsedContent);
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
   * Convierte URLs sueltas en enlaces clicables y agrega target="_blank" a enlaces existentes
   */
  private processUrlLinks(htmlContent: string): string {
    // Primero, agregar target="_blank" a enlaces existentes que no lo tengan
    let processedContent = htmlContent.replace(
      /<a\s+([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>/gi,
      (match, beforeHref, href, afterHref) => {
        // Si ya tiene target="_blank", no modificar
        if (match.includes('target="_blank"') || match.includes("target='_blank'")) {
          return match;
        }
        
        // Agregar target="_blank" y rel="noopener noreferrer"
        return `<a ${beforeHref}href="${href}"${afterHref} target="_blank" rel="noopener noreferrer">`;
      }
    );
    
    // Luego, convertir URLs sueltas que no estén ya dentro de tags <a>
    const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
    
    processedContent = processedContent.replace(urlPattern, (url) => {
      // Verificar si la URL ya está dentro de un tag <a>
      const beforeUrl = processedContent.substring(0, processedContent.indexOf(url));
      const afterUrl = processedContent.substring(processedContent.indexOf(url) + url.length);
      
      // Si hay un <a> antes y un </a> después, no procesar
      if (beforeUrl.includes('<a') && afterUrl.includes('</a>')) {
        return url;
      }
      
      // Crear enlace con target="_blank"
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="external-link">${url}</a>`;
    });
    
    return processedContent;
  }

  /**
   * Procesa las referencias en el texto para convertirlas en enlaces clicables
   */
  private processReferenceLinks(htmlContent: string): string {
    if (!this._formattedReferences || this._formattedReferences.length === 0) {
      return htmlContent;
    }

    // Buscar patrones como [1], [2], [^1], [^2], [1][2], [^1][^2], etc.
    const referencePattern = /\[\^?(\d+)\]/g;
    
    return htmlContent.replace(referencePattern, (match, number) => {
      const refNumber = parseInt(number);
      const reference = this._formattedReferences.find(r => r.number === refNumber);
      
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
    return this._formattedReferences || [];
  }

  /**
   * Verifica si hay referencias disponibles
   */
  hasReferences(): boolean {
    return Array.isArray(this._formattedReferences) && this._formattedReferences.length > 0;
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
          //contentElement.style.color = this.brandingConfig.colors.text;
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