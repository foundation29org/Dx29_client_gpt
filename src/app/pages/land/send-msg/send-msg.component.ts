import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { InsightsService } from 'app/shared/services/azureInsights.service';
import { NgbModal, NgbModalRef, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { GoogleAnalyticsService } from 'ngx-google-analytics';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-send-msg',
    templateUrl: './send-msg.component.html',
    styleUrls: ['./send-msg.component.scss']
})

export class SendMsgComponent implements OnDestroy {

  private subscription: Subscription = new Subscription();
  _startTime: any;
  role: string = '';
  myuuid: string = uuidv4();
  email: string = '';
  showErrorForm: boolean = false;
  sending: boolean = false;
  @ViewChild('f') mainForm: NgForm;
  checkSubscribe: boolean = false;
  acceptTerms: boolean = false;
  modalReference: NgbModalRef;
  descriptionLength: number = 0;

  constructor(public translate: TranslateService, private http: HttpClient, public insightsService: InsightsService, private modalService: NgbModal, private gaService: GoogleAnalyticsService) {
    this._startTime = Date.now();
    if(sessionStorage.getItem('uuid')!=null){
        this.myuuid = sessionStorage.getItem('uuid');
    }else{
        this.myuuid = uuidv4();
        sessionStorage.setItem('uuid', this.myuuid);
    }
}

getElapsedSeconds() {
    var endDate = Date.now();
    var seconds = (endDate - this._startTime) / 1000;
    return seconds;
};

lauchEvent(category) {
    var secs = this.getElapsedSeconds();
    this.gaService.gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
}
  
    ngOnDestroy() {
      this.subscription.unsubscribe();
  }

    submitInvalidForm() {
      this.showErrorForm = true;
      if (!this.mainForm) { return; }
      const base = this.mainForm;
      for (const field in base.form.controls) {
        if (!base.form.controls[field].valid) {
            base.form.controls[field].markAsTouched()
        }
      }
    }

    sendMsg(){
      
      this.sending = true;
        //this.mainForm.value.email = (this.mainForm.value.email).toLowerCase();
        //this.mainForm.value.lang=this.translate.store.currentLang;
        var params = this.mainForm.value;
        params.lang = sessionStorage.getItem('lang');
        params.subscribe = this.checkSubscribe;
        this.subscription.add( this.http.post(environment.serverapi+'/api/homesupport/', params)
        .subscribe( (res : any) => {
          this.sending = false;
          Swal.fire({
            icon: 'success',
            html: this.translate.instant('generics.Data saved successfully'),
            showCancelButton: false,
            showConfirmButton: false,
            allowOutsideClick: false
          });
          setTimeout(function () {
            Swal.close();
          }, 2000);
          this.checkSubscribe = false;
          this.acceptTerms = false;
          this.showErrorForm = false;
          this.mainForm.reset();
          this.descriptionLength = 0;
          this.lauchEvent('Send email');
         }, (err) => {
          this.insightsService.trackException(err);
           console.log(err);
           this.sending = false;
           Swal.fire({
            icon: 'error',
            html: this.translate.instant('generics.error try again'),
            showCancelButton: false,
            showConfirmButton: true,
            allowOutsideClick: false
          });
         }));
    }

    async openModal2(panel) {
      let ngbModalOptions: NgbModalOptions = {
        backdrop : 'static',
          keyboard: false,
          windowClass: 'ModalClass-sm'// xl, lg, sm
      };
      this.modalReference = this.modalService.open(panel, ngbModalOptions);
      await this.delay(400);
      document.getElementById('initpopup2').scrollIntoView(true);
    }

    delay(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    onTermsAccepted() {
      this.acceptTerms = true;
      this.modalReference.close();
    }

    autoResize(event: Event) {
      const inputElement = event.target as HTMLTextAreaElement;
      this.descriptionLength = inputElement.value.length;
      const textarea = event.target as HTMLTextAreaElement;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }

}
