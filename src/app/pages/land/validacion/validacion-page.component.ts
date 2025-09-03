import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-validacion-page',
  templateUrl: './validacion-page.component.html',
  styleUrls: ['./validacion-page.component.scss']
})
export class ValidacionPageComponent implements OnInit {
  private subscription: Subscription = new Subscription();
  showImageModal: boolean = false;
  modalImageSrc: string = '';

  constructor(
    private titleService: Title,
    private router: Router,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('DxGPT');
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openImageModal(event: Event, imageSrc: string): void {
    event.preventDefault();
    this.modalImageSrc = imageSrc;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.modalImageSrc = '';
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}