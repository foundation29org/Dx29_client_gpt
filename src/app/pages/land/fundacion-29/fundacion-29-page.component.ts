import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { SendMsgComponent } from '../send-msg/send-msg.component';

@Component({
  selector: 'app-fundacion-29-page',
  templateUrl: './fundacion-29-page.component.html',
  styleUrls: ['./fundacion-29-page.component.scss']
})
export class Fundacion29PageComponent implements OnInit {
  @ViewChild('contactModal') contactModal: SendMsgComponent;
  private subscription: Subscription = new Subscription();

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

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  openContactModal(): void {
    // Need to implement modal opening - the send-msg component needs to be refactored for this
    // For now, redirect to mail
    window.location.href = 'mailto:info@foundation29.org';
  }
}