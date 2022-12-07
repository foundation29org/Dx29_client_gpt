import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/Subscription';
import { SearchService } from 'app/shared/services/search.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';
import { GoogleAnalyticsService } from 'app/shared/services/google-analytics.service';

declare let gtag: any;

@Component({
    selector: 'app-about-us-page',
    templateUrl: './about-us-page.component.html',
    styleUrls: ['./about-us-page.component.scss'],
})

export class AboutUsPageComponent implements OnDestroy {

    private subscription: Subscription = new Subscription();
    _startTime: any;
    role: string = '';
    myuuid: string = uuidv4();
    eventList: any = [];
    email: string = '';
    showErrorForm: boolean = false;
    sending: boolean = false;
    @ViewChild('f') donorDataForm: NgForm;

    constructor( public googleAnalyticsService: GoogleAnalyticsService, private searchService: SearchService, public translate: TranslateService, private http: HttpClient, public toastr: ToastrService) {
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
        var savedEvent = this.searchService.search(this.eventList, 'name', category);
        if(!savedEvent){
            this.eventList.push({name:category});
            gtag('event',this.myuuid,{"event_category":category, "event_label": secs});
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    registerToDx29(){
        this.lauchEvent("Registration");
        this.lauchEvent("Registration Home - Event");
        window.location.href = environment.urlDxv2 + "/Identity/Account/Register";
    }

    openWeb(){
        var lang = sessionStorage.getItem('lang');
        if(lang=='es'){
            window.open('https://www.foundation29.org', '_blank');
        }else{
            window.open('https://www.foundation29.org/en/', '_blank');
        }
    }

    onSubmitRevolution() {
        this.showErrorForm = false;
        this.sending = true;
        var params: any = {}
        params.Email = (this.email).toLowerCase();
        params.Lang = sessionStorage.getItem('lang');
        var d = new Date(Date.now());
        var a = d.toString();
        params.Date = a;
        this.subscription.add(this.http.post('https://prod-59.westeurope.logic.azure.com:443/workflows/2d7a82d83b4c4b92a8270a84540b0213/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fnADjHH0yXxYxonVtre2_yrUFyQ0LR4cX2PJSnPwmrM', params)
            .subscribe((res: any) => {
                this.sending = false;
                //Swal.fire('', this.translate.instant("land.diagnosed.general.msgSend"), "success");
                Swal.fire({
                    icon: 'success',
                    html: this.translate.instant("land.diagnosed.DonorData.msgform"),
                    showCancelButton: false,
                    showConfirmButton: false,
                    allowOutsideClick: false
                })
                setTimeout(function () {
                    Swal.close();
                    //window.location.href = 'https://foundation29.org/';
                }, 2000);
                this.email = '';
            }, (err) => {
                console.log(err);
                this.sending = false;
                this.toastr.error('', this.translate.instant("generics.error try again"));
            }));

    }

    submitInvalidForm() {
        this.showErrorForm = true;
        if (!this.donorDataForm) { return; }
        const base = this.donorDataForm;
        for (const field in base.form.controls) {
            if (!base.form.controls[field].valid) {
                base.form.controls[field].markAsTouched()
            }
        }
    }

}
