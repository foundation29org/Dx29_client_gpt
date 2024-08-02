import {
  Component,
  OnInit,
  Inject,
  Renderer2,
  HostListener
} from "@angular/core";
import { FeedbackPageComponent } from 'app/pages/land/feedback/feedback-page.component';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
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
  modalReference: NgbModalRef;

  constructor(
    private modalService: NgbModal,
    private eventsService: EventsService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window: Window,
    private renderer: Renderer2
  ) {

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.modalReference == undefined) {
        this.showFeedbackDialog();
      }
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler(event: BeforeUnloadEvent) {
    if(this.modalReference == undefined){
      this.showFeedbackDialog();
    }
    
  }

  async showFeedbackDialog() {
    if (!this.hasShownDialog && localStorage.getItem('sentFeedbackDxGPT') == 'true') {
      let ngbModalOptions: NgbModalOptions = {
        backdrop: 'static',
        keyboard: false,
        windowClass: 'ModalClass-lg'// xl, lg, sm
      };
      this.modalReference = this.modalService.open(FeedbackPageComponent, ngbModalOptions);
      this.modalReference.result
      .then(() => {
        this.modalReference = undefined;
      })
      .catch(() => {
        this.modalReference = undefined;
      });
      //this.hasShownDialog = true;
    }
  }

  ngOnInit() {
    this.eventsService.on('sentFeedbackDxGPT', function (event) {
      this.hasShownDialog = true;
    }.bind(this));
  }

  async sidebarMouseleave(e) {
    if(e.clientY == -1){
      this.showFeedbackDialog();
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
