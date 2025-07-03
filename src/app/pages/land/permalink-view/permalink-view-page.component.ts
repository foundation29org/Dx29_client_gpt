import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
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

    try {
      // Decodificar los datos de la URL
      const decodedData = decodeURIComponent(atob(this.permalinkId));
      const permalinkData = JSON.parse(decodedData);
      
      // Asignar los datos
      this.medicalDescription = permalinkData.medicalDescription || '';
      this.anonymizedDescription = permalinkData.anonymizedDescription || '';
      this.diagnoses = permalinkData.diagnoses || [];
      this.lang = permalinkData.lang || 'es';
      this.createdDate = permalinkData.createdDate || '';
      
      this.isLoading = false;
    } catch (error) {
      console.error('Error decoding permalink data:', error);
      this.showError(this.translate.instant('permalink.Invalid permalink'));
    }
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
    this.router.navigate(['/']);
  }

  printPage() {
    window.print();
  }

  sharePermalink() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: this.translate.instant('permalink.shareTitle'),
        text: this.translate.instant('permalink.shareText'),
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert(this.translate.instant('permalink.copied'));
    }
  }
} 