import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-terms-conditions-page',
    templateUrl: './terms-conditions-page.component.html',
    styleUrls: ['./terms-conditions-page.component.scss']
})

export class TermsConditionsPageComponent implements OnInit{
  showSecurity: boolean = false;
  role: string = '';
  subrole: string = '';
  constructor(public activeModal: NgbActiveModal, public translate: TranslateService, private modalService: NgbModal) {
    setTimeout(function () {
        this.goTo('initpos');
    }.bind(this), 500);

  }

  ngOnInit() {
    console.log(this.role);
    console.log(this.subrole);
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }

  openSecurity() {
    this.showSecurity = true;
    setTimeout(function () {
        this.goTo('initposSecurity');
    }.bind(this), 200);
  }

  back(){
    this.showSecurity = false;
    setTimeout(function () {
        this.goTo('stepback');
    }.bind(this), 500);

  }
}
