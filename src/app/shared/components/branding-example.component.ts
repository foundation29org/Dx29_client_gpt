import { Component, OnInit } from '@angular/core';
import { BrandingService } from '../services/branding.service';
import { TenantDetectorService } from '../services/tenant-detector.service';

@Component({
  selector: 'app-branding-example',
  template: `
    <div class="branding-example">
      <h2>{{appName}}</h2>
      <p>{{appDescription}}</p>
      
      <div class="brand-colors">
        <div class="color-swatch brand-primary-bg">Primary Color</div>
        <div class="color-swatch brand-secondary-bg">Secondary Color</div>
        <div class="color-swatch brand-accent-bg">Accent Color</div>
      </div>
      
      <div class="brand-buttons">
        <button class="btn btn-brand-primary">Primary Button</button>
        <button class="btn btn-brand-accent">Accent Button</button>
      </div>
      
      <div class="brand-info">
        <p><strong>Current Tenant:</strong> {{currentTenant}}</p>
        <p><strong>Header Logo:</strong> {{headerLogo}}</p>
        <p><strong>Footer Logo:</strong> {{footerLogo}}</p>
        <p><strong>Foundation Link:</strong> {{foundationLink}}</p>
        <p><strong>Show Donate Link:</strong> {{shouldShowDonate}}</p>
      </div>
      
      <div class="brand-links">
        <a [href]="foundationLink" target="_blank" class="brand-link">Foundation Website</a>
        <a *ngIf="shouldShowDonate" [href]="donateLink" target="_blank" class="brand-link">Donate</a>
      </div>
    </div>
  `,
  styles: [`
    .branding-example {
      padding: 2rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin: 1rem 0;
    }
    
    .brand-colors {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
    }
    
    .color-swatch {
      width: 100px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      border-radius: 4px;
    }
    
    .brand-buttons {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
    }
    
    .brand-info {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      margin: 1rem 0;
    }
    
    .brand-links {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
    }
    
    .brand-link {
      text-decoration: none;
      padding: 0.5rem 1rem;
      border: 1px solid var(--primary-color);
      border-radius: 4px;
      transition: all 0.3s ease;
    }
    
    .brand-link:hover {
      background-color: var(--primary-color);
      color: white;
    }
  `]
})
export class BrandingExampleComponent implements OnInit {
  appName: string = '';
  appDescription: string = '';
  currentTenant: string = '';
  headerLogo: string = '';
  footerLogo: string = '';
  foundationLink: string = '';
  shouldShowDonate: boolean = false;
  donateLink: string | null = null;

  constructor(
    private brandingService: BrandingService,
    private tenantDetector: TenantDetectorService
  ) {}

  ngOnInit(): void {
    this.loadBrandingInfo();
  }

  private loadBrandingInfo(): void {
    // Obtener información del tenant actual
    this.currentTenant = this.tenantDetector.detectTenant();
    
    // Obtener información de branding
    this.brandingService.brandingConfig$.subscribe(config => {
      if (config) {
        this.appName = config.displayName;
        this.appDescription = config.description;
        this.headerLogo = config.logos.header;
        this.footerLogo = config.logos.footer;
        this.foundationLink = config.links.foundation;
        this.shouldShowDonate = config.links.donate !== null;
        this.donateLink = config.links.donate;
      }
    });
  }
} 