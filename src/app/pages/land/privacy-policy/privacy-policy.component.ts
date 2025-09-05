import { Component, Optional, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BrandingService } from 'app/shared/services/branding.service';

@Component({
    selector: 'app-privacy-policy',
    templateUrl: './privacy-policy.component.html',
    styleUrls: ['./privacy-policy.component.scss']
})

export class PrivacyPolicyPageComponent implements OnInit {
  isShortVersion: boolean = false;
  
  constructor(
    public translate: TranslateService, 
    private router: Router, 
    @Optional() public activeModal: NgbActiveModal,
    public brandingService: BrandingService
  ) {
  }

  ngOnInit(): void {
    // Inicialización del componente
  }

  goTo(url){
    document.getElementById(url).scrollIntoView({behavior: "smooth"});
  }

  goHome() {
    this.router.navigate(['/']);
  }

  toggleShortVersion() {
    this.isShortVersion = !this.isShortVersion;
  }
}
