import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BrandingService } from 'app/shared/services/branding.service';

@Component({
    selector: 'app-foundation29',
    templateUrl: './foundation29.component.html',
    styleUrls: ['./foundation29.component.scss'],
    standalone: false
})
export class Foundation29Component implements OnInit {

  constructor(
    public translate: TranslateService,
    public brandingService: BrandingService
  ) { }

  ngOnInit(): void {
    // Inicialización del componente
  }
}
