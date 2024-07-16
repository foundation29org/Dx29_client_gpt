import {
  Component,
  OnInit,
  AfterViewInit
} from "@angular/core";
import { Router, NavigationStart } from '@angular/router';
import { FeedbackPageComponent } from 'app/pages/land/feedback/feedback-page.component';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { EventsService } from 'app/shared/services/events.service';

@Component({
    selector: 'app-land-page-layout',
    templateUrl: './land-page-layout.component.html',
    styleUrls: ['./land-page-layout.component.scss']
})

export class LandPageLayoutComponent implements OnInit, AfterViewInit {
  isGTPPage: boolean = false;
  isHomePage: boolean = false;
  hasShownDialog: boolean = false;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private eventsService: EventsService
  ) {
    if ((this.router.url).indexOf('/.') != -1 || (this.router.url)== '/') {
      this.isHomePage = true;
      this.isGTPPage = false;
    }else if((this.router.url).indexOf('/juntoshaciaeldiagnostico')!=-1){
      this.isGTPPage = true;
      this.isHomePage = false;
    }else{
      this.isGTPPage = false;
      this.isHomePage = false;
    }
  }

  ngOnInit() {
    this.eventsService.on('sentFeedbackDxGPT', function (event) {
      this.hasShownDialog = true;
    }.bind(this));
  }

  ngAfterViewInit() {
    this.router.events.filter((event: any) => event instanceof NavigationStart).subscribe(

      event => {
        var tempUrl = (event.url).toString();
        if(tempUrl.indexOf('/.') != -1 || tempUrl== '/'){
          this.isHomePage = true;
          this.isGTPPage = false;
        }else if(tempUrl.indexOf('/juntoshaciaeldiagnostico')!=-1){
          this.isGTPPage = true;
          this.isHomePage = false;
        }else{
          this.isGTPPage = false;
          this.isHomePage = false;
        }
      }
    );
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

}
