import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgForm, FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/Subscription';
import { SearchService } from 'app/shared/services/search.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EventsService} from 'app/shared/services/events.service';
import { Injectable, Injector } from '@angular/core';
import { InsightsService } from 'app/shared/services/azureInsights.service';

declare let gtag: any;

@Component({
    selector: 'app-feedback-page',
    templateUrl: './feedback-page.component.html',
    styleUrls: ['./feedback-page.component.scss'],
})

export class FeedbackPageComponent implements OnDestroy {

    private subscription: Subscription = new Subscription();
    _startTime: any;
    role: string = '';
    myuuid: string = uuidv4();
    eventList: any = [];
    email: string = '';
    showErrorForm: boolean = false;
    sending: boolean = false;
    @ViewChild('f') mainForm: NgForm;

    formulario: FormGroup;

    constructor(private searchService: SearchService, public translate: TranslateService, private http: HttpClient, public toastr: ToastrService, public activeModal: NgbActiveModal, private inj: Injector, public insightsService: InsightsService) {
        this._startTime = Date.now();
        if(sessionStorage.getItem('uuid')!=null){
            this.myuuid = sessionStorage.getItem('uuid');
        }else{
            this.myuuid = uuidv4();
            sessionStorage.setItem('uuid', this.myuuid);
        }
        

        this.formulario = new FormGroup({
            pregunta1: new FormControl('', Validators.required), // Definir los controles del formulario
            pregunta2: new FormControl('', Validators.required),
            moreFunct: new FormControl(''),
            freeText: new FormControl('')
          });

          setTimeout(function () {
            //this.goTo('initpos');
        }.bind(this), 500);

    }

      goTo(url){
        document.getElementById(url).scrollIntoView(true);
      }

    getElapsedSeconds() {
        var endDate = Date.now();
        var seconds = (endDate - this._startTime) / 1000;
        return seconds;
    };

    lauchEvent(category) {
        var secs = this.getElapsedSeconds();
        var savedEvent = this.searchService.search(this.eventList, 'name', category);
        if(!savedEvent){
            this.eventList.push({name:category});
            gtag('event', category, { 'myuuid': this.myuuid, 'event_label': secs });
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    openWeb(){
        window.open('https://www.foundation29.org', '_blank');
    }
  
      sendFeedback(){
        if (this.formulario.valid) {
          this.sending = true;
          const respuesta1 = this.formulario.get('pregunta1')?.value;
          const respuesta2 = this.formulario.get('pregunta2')?.value;
          const moreFunct = this.formulario.get('moreFunct')?.value;
          const freeText = this.formulario.get('freeText')?.value;
      
          //this.mainForm.value.email = (this.mainForm.value.email).toLowerCase();
          //this.mainForm.value.lang=this.translate.store.currentLang;
          var value = { value: this.formulario.value, myuuid: this.myuuid }
          this.subscription.add( this.http.post(environment.serverapi+'/api/generalfeedback/', value)
          .subscribe( (res : any) => {
            this.sending = false;
            this.toastr.success(this.translate.instant("feedback.thanks"), this.translate.instant("feedback.Submitted"));
            // Limpie el formulario después de enviar
            this.formulario.reset();
            this.lauchEvent('Send email GENERAL FEEDBACK');
            this.activeModal.close();
            //broadcast event
            var eventsLang = this.inj.get(EventsService);
            eventsLang.broadcast('sentFeedbackDxGPT', true);
            localStorage.setItem('sentFeedbackDxGPT', 'sent')
            localStorage.setItem('feedbackTimestampDxGPT', Date.now().toString());
           }, (err) => {
            this.insightsService.trackException(err);
             console.log(err);
             this.sending = false;
             this.toastr.error('', this.translate.instant("generics.error try again"));
           }));
        } else {
            this.toastr.error(this.translate.instant("feedback.onstarts"), 'Error');
        } 
      }

      showOptions($event) {
        if ($event.checked) {
            localStorage.setItem('showFeedbackDxGPT', 'true')
        } else {
            localStorage.setItem('showFeedbackDxGPT', 'false')
        }
    }

}
