import { TranslateService } from '@ngx-translate/core';
import { Component, ViewChild, OnDestroy } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { NgForm } from '@angular/forms';
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs/Subscription';
import { ToastrService } from 'ngx-toastr';
import { v4 as uuidv4 } from 'uuid';

declare let gtag: any;

@Component({
    selector: 'app-footer-land',
    templateUrl: './footer-land.component.html',
    styleUrls: ['./footer-land.component.scss']
})

export class FooterLandComponent implements OnDestroy{
    //Variables
    currentDate : Date = new Date();
    _startTime: any;
    @ViewChild('f') mainForm: NgForm;
    sending: boolean = false;
    email: string;
    myuuid: string = uuidv4();
    private subscription: Subscription = new Subscription();

    constructor(private http: HttpClient, public translate: TranslateService, public toastr: ToastrService) {
      this._startTime = Date.now();
      sessionStorage.setItem('uuid', this.myuuid);
    }

    lauchEvent(category) {
        var secs = this.getElapsedSeconds();
        gtag('event', this.myuuid, { "event_category": category, "event_label": secs });
      }
    
      getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
      };

      ngOnDestroy() {
        this.subscription.unsubscribe();
      }
      
      submitInvalidForm() {
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
          this.subscription.add( this.http.post(environment.serverapi+'/api/homesupport/', params)
          .subscribe( (res : any) => {
            this.sending = false;
            this.toastr.success('', this.translate.instant("generics.Data saved successfully"));
            this.mainForm.reset();
           }, (err) => {
             console.log(err);
             this.sending = false;
             this.toastr.error('', this.translate.instant("generics.error try again"));
           }));
      }
  

}
