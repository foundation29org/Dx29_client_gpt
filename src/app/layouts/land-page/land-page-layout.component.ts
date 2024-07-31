import {
  Component,
  OnInit,
  Inject,
  Renderer2,
  HostListener
} from "@angular/core";
import { FeedbackPageComponent } from 'app/pages/land/feedback/feedback-page.component';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { EventsService } from 'app/shared/services/events.service';
import { WINDOW } from 'app/shared/services/window.service';
import { DOCUMENT } from "@angular/common";

@Component({
    selector: 'app-land-page-layout',
    templateUrl: './land-page-layout.component.html',
    styleUrls: ['./land-page-layout.component.scss']
})

export class LandPageLayoutComponent implements OnInit {
  hasShownDialog: boolean = false;
  isScrollTopVisible = false;

  constructor(
    private modalService: NgbModal,
    private eventsService: EventsService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window: Window,
    private renderer: Renderer2
  ) {
  }

  ngOnInit() {
    this.eventsService.on('sentFeedbackDxGPT', function (event) {
      this.hasShownDialog = true;
    }.bind(this));
  }

  async sidebarMouseleave(e) {
    if (!this.hasShownDialog && e.clientY == -1 && localStorage.getItem('sentFeedbackDxGPT') == 'true') {
      let ngbModalOptions: NgbModalOptions = {
        backdrop: 'static',
        keyboard: false,
        windowClass: 'ModalClass-lg'// xl, lg, sm
      };
      const modalRef = this.modalService.open(FeedbackPageComponent, ngbModalOptions);
      //this.hasShownDialog = true;
    }
  }

  scrollToTop() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    let number = this.window.pageYOffset || this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;
    if (number > 60) {
      this.renderer.addClass(this.document.body, "navbar-scrolled");
    } else {
      this.renderer.removeClass(this.document.body, "navbar-scrolled");
    }

    if (number > 400) {
      this.isScrollTopVisible = true;
    } else {
      this.isScrollTopVisible = false;
    }

    if (number > 20) {
      this.renderer.addClass(this.document.body, "page-scrolled");
    } else {
      this.renderer.removeClass(this.document.body, "page-scrolled");
    }
  }


}
