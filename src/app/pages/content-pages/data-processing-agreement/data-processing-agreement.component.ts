import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-data-processing-agreement',
    templateUrl: './data-processing-agreement.component.html',
    styleUrls: ['./data-processing-agreement.component.scss']
})

export class DataProcessingAgreementComponent implements OnInit{
  showSecurity: boolean = false;
  constructor(public activeModal: NgbActiveModal, public translate: TranslateService) {
    setTimeout(function () {
        this.goTo('initpos');
    }.bind(this), 500);

  }

  ngOnInit() {
  }

  goTo(url){
    document.getElementById(url).scrollIntoView(true);
  }
}
